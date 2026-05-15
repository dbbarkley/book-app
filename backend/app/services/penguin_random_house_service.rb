# PenguinRandomHouseService
#
# Fetches upcoming book releases from the Penguin Random House API,
# applies quality filters, and upserts into the upcoming_releases table.
#
# PRH data takes precedence over ISBNdb — run this AFTER IsbndbService
# so that any duplicate ISBNs get overwritten with the more reliable PRH data.
#
# Usage:
#   PenguinRandomHouseService.call
#   PenguinRandomHouseService.call(days_ahead: 60)
#
class PenguinRandomHouseService < BaseService
  BASE_URL   = 'https://api.penguinrandomhouse.com'
  PAGE_SIZE  = 100
  MAX_PAGES  = 30    # cap at 3,000 results per run
  DAYS_AHEAD = 90
  DAYS_BACK  = 7

  # PRH API date format — required to be MM/dd/yyyy
  DATE_FORMAT = '%m/%d/%Y'

  # PRH format codes to keep client-side.
  # Server-side we already exclude MM (Mass Market) and non-book format families,
  # but this catches any stragglers (e.g. audio bundles with format code "BN").
  ACCEPTED_FORMAT_CODES = %w[HC TR TP].freeze

  # Map BISAC subject code prefixes → our internal genre slugs.
  # More specific prefixes must come before broader ones (e.g. FIC022 before FIC).
  BISAC_GENRE_MAP = [
    ['FIC022', 'mystery'],          # Mystery & Detective
    ['FIC030', 'mystery'],          # Mystery
    ['FIC031', 'thriller'],         # Thrillers & Suspense
    ['FIC037', 'thriller'],         # Thriller
    ['FIC027', 'romance'],          # Romance (all sub-codes)
    ['FIC009', 'fantasy'],          # Fantasy
    ['FIC028', 'science-fiction'],  # Science Fiction
    ['FIC015', 'horror'],           # Horror
    ['FIC014', 'horror'],           # Gothic
    ['YAF',    'young-adult'],      # Young Adult Fiction
    ['JUV',    'young-adult'],      # Juvenile (broad)
    ['BIO',    'biography'],        # Biography & Autobiography
    ['SEL',    'self-help'],        # Self-Help
    ['HIS',    'history'],          # History
    ['GRA',    'graphic-novels'],   # Comics & Graphic Novels
    ['FIC',    'fiction'],          # General Fiction (catch-all, lowest priority)
  ].freeze

  def initialize(days_ahead: DAYS_AHEAD)
    @days_ahead  = days_ahead
    @date_from   = (Date.current - DAYS_BACK.days).strftime(DATE_FORMAT)
    @date_to     = (Date.current + days_ahead.days).strftime(DATE_FORMAT)
    @api_key     = ENV.fetch('PENGUI_RANDOMHOUSE_API_KEY')
  end

  private

  def execute
    Rails.logger.info "[PRHService] Fetching upcoming releases #{@date_from} → #{@date_to}"

    books = fetch_all_titles
    Rails.logger.info "[PRHService] #{books.size} books after fetch + filter"

    upserted = upsert_all(books)
    Rails.logger.info "[PRHService] Upserted #{upserted} records"

    success!(upserted)
  rescue KeyError
    failure!('PENGUI_RANDOMHOUSE_API_KEY environment variable is not set')
  rescue => e
    Rails.logger.error "[PRHService] Error: #{e.message}\n#{e.backtrace.first(3).join("\n")}"
    failure!(e.message)
  end

  # ── Fetching ────────────────────────────────────────────────────────────────

  def fetch_all_titles
    results = []
    page    = 0

    loop do
      # Server-side filters applied:
      #   onSaleFrom/onSaleTo — narrow to our date window (MM/dd/yyyy format required)
      #   language            — English only
      #   saleStatus          — IP (in print) only; excludes out-of-print / cancelled titles
      #   formatFamily        — Hardcover only; PRH hardcovers are always first editions.
      #                         Paperback editions come 6-12 months later and would be
      #                         reprints of books already in the table. Trade paperback
      #                         originals from other publishers are covered by ISBNdb.
      data = http_get('/resources/v2/title/domains/PRH.US/titles', {
        'onSaleFrom'   => @date_from,
        'onSaleTo'     => @date_to,
        'language'     => 'E',
        'saleStatus'   => 'IP',
        'formatFamily' => 'Hardcover',
        'rows'         => PAGE_SIZE,
        'start'        => page * PAGE_SIZE,
      })

      break unless data

      titles = data.dig('data', 'titles') || []
      break if titles.empty?

      results.concat(titles.select { |t| keep?(t) })

      total   = data['recordCount'].to_i
      fetched = (page + 1) * PAGE_SIZE

      break if fetched >= total || page >= MAX_PAGES - 1

      page += 1
      sleep 0.3  # be polite to the API
    end

    results
  end

  def http_get(path, params = {})
    full_params = params.merge('api_key' => @api_key)
    query       = URI.encode_www_form(full_params)
    url         = "#{BASE_URL}#{path}?#{query}"

    uri  = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 20

    req = Net::HTTP::Get.new(uri)
    req['Accept'] = 'application/json'

    response = http.request(req)
    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn "[PRHService] HTTP #{response.code} for #{path}"
      return nil
    end

    JSON.parse(response.body)
  rescue => e
    Rails.logger.warn "[PRHService] Request failed for #{path}: #{e.message}"
    nil
  end

  # ── Filtering ───────────────────────────────────────────────────────────────

  # Most filtering is done server-side. This is a belt-and-suspenders pass
  # to catch anything that slipped through (e.g. non-book format codes, UPC-style
  # ISBNs that don't start with 978/979, blank titles).
  def keep?(title)
    isbn = title['isbnStr'].to_s
    return false unless isbn.match?(/\A97[89]\d{10}\z/)   # valid ISBN-13 only (excludes UPCs)
    return false if title['title'].blank?
    return false unless accepted_format?(title.dig('format', 'code'))
    true
  end

  def accepted_format?(code)
    return false if code.blank?
    ACCEPTED_FORMAT_CODES.include?(code.upcase)
  end

  # ── Persistence ─────────────────────────────────────────────────────────────

  def upsert_all(titles)
    return 0 if titles.empty?

    records = titles.map do |t|
      isbn_str = t['isbnStr'].to_s
      author   = t['author'].presence
      authors  = author ? [author] : []
      subjects = Array(t['subjects']).map { |s| s['description'] }.compact.reject(&:blank?)
      genres   = derive_genres(t['subjects'])

      {
        isbn13:          isbn_str,
        isbn10:          t['isbn10'].presence,
        title:           t['title'],
        authors:         authors,
        publisher:       t.dig('imprint', 'description').presence || t.dig('publisher', 'description'),
        date_published:  safe_date(t['onsale']),
        binding:         t.dig('format', 'description'),
        synopsis:        nil,   # PRH listing API doesn't include description;
                                # rely on existing enrichment jobs to backfill.
        cover_image_url: cover_url(t),
        subjects:        subjects,
        genres:          genres,
        msrp:            usd_price(t['price']),
        pages:           t['pages'].presence&.to_i,
        fetched_at:      Time.current,
      }
    end

    UpcomingRelease.upsert_all(
      records,
      unique_by:   :isbn13,
      update_only: %i[
        isbn10 title authors publisher date_published binding
        synopsis cover_image_url subjects genres msrp pages fetched_at
      ]
    )

    titles.size
  end

  # ── Helpers ──────────────────────────────────────────────────────────────────

  # Derive our genre slugs from BISAC subject codes.
  # Each subject code is matched against the BISAC_GENRE_MAP prefixes in order,
  # so more specific matches take precedence over broad catch-alls.
  def derive_genres(subjects)
    return [] if subjects.blank?

    genres = []
    Array(subjects).each do |subj|
      code = subj['code'].to_s
      next if code.blank?

      BISAC_GENRE_MAP.each do |prefix, genre|
        if code.start_with?(prefix)
          genres << genre
          break
        end
      end
    end

    genres.uniq
  end

  # Extract the cover image URL from the _links array (rel: "icon"),
  # falling back to the standard PRH CDN URL pattern.
  def cover_url(title)
    links = title['_links']
    if links.is_a?(Array)
      icon = links.find { |l| l['rel'] == 'icon' }
      return icon['href'] if icon&.dig('href').present?
    end

    isbn = title['isbnStr'].to_s
    "https://images.penguinrandomhouse.com/cover/#{isbn}" if isbn.present?
  end

  def usd_price(prices)
    return nil unless prices.is_a?(Array)
    usd = prices.find { |p| p['currencyCode'] == 'USD' }
    usd&.dig('amount')&.to_d
  end

  def safe_date(str)
    Date.parse(str)
  rescue ArgumentError, TypeError
    nil
  end
end
