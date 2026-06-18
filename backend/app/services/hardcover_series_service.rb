require 'net/http'
require 'json'

class HardcoverSeriesService
  GQL_ENDPOINT   = 'https://api.hardcover.app/v1/graphql'
  TIMEOUT_OPEN   = 8
  TIMEOUT_READ   = 15
  MIN_USERS      = 50
  VALID_FRACS    = [0.0, 0.5].freeze
  MIN_POSITION   = 1.0
  CACHE_TTL      = 7.days

  def initialize(google_books_id:, title:, author_name: nil)
    @google_books_id = google_books_id
    @title           = title
    @author_name     = author_name
  end

  # Returns the persisted Series record, or nil if the book isn't in a series.
  def call
    hc_book = find_hardcover_book
    return nil unless hc_book

    series_entry = pick_best_series(hc_book['book_series'])
    return nil unless series_entry

    hc_series_id = series_entry.dig('series', 'id')
    series_name  = series_entry.dig('series', 'name')
    return nil unless hc_series_id

    # Return cached series if fresh
    existing = Series.find_by(hardcover_series_id: hc_series_id)
    return existing unless existing.nil? || existing.stale?

    # Fetch all books in the series from Hardcover
    series_data = fetch_series_books(hc_series_id)
    return nil unless series_data

    canonical = filter_canonical_books(series_data['book_series'] || [])
    return nil if canonical.empty?

    # Upsert the series record
    series = Series.find_or_initialize_by(hardcover_series_id: hc_series_id)
    series.update!(
      name:        series_name,
      total_books: canonical.size,
      fetched_at:  Time.current
    )

    # Write all series books to book_catalog in one batch
    BookCatalog.upsert_series_books(canonical, series: series)

    series
  rescue => e
    Rails.logger.error("[HardcoverSeriesService] #{e.class}: #{e.message}\n#{e.backtrace.first(3).join("\n")}")
    nil
  end

  private

  # ── Step 1: Find the book on Hardcover by title ───────────────────────────

  def find_hardcover_book
    cache_key = "hc_series_book:#{@title.to_s.downcase.gsub(/\s+/, '_')}"
    Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
      query = <<~GQL
        query FindBookForSeries($title: String!) {
          books(
            where: { title: { _eq: $title } }
            order_by: { users_count: desc }
            limit: 5
          ) {
            id title users_count
            contributions { author { name } }
            book_series {
              position
              series { id name }
            }
          }
        }
      GQL
      data  = graphql_post(query, { title: @title })
      books = data&.dig('books') || []
      best_match(books)
    end
  end

  def best_match(books)
    return nil if books.empty?
    return books.first if books.size == 1 || @author_name.blank?

    author_norm = normalize_name(@author_name)
    books.find do |b|
      Array(b['contributions']).any? do |c|
        candidate = normalize_name(c.dig('author', 'name').to_s)
        candidate.include?(author_norm) || author_norm.include?(candidate)
      end
    end || books.first
  end

  # Prefer the series where this book appears at the lowest position number.
  # This picks the specific sub-series (e.g. Stormlight pos 1) over the
  # umbrella series (e.g. Cosmere pos 7).
  def pick_best_series(book_series)
    return nil if book_series.blank?
    book_series
      .select { |e| e['series'].present? && e['position'].present? }
      .min_by { |e| e['position'] }
  end

  # ── Step 2: Fetch all books in the series ────────────────────────────────

  def fetch_series_books(series_id)
    query = <<~GQL
      query GetSeriesBooks($series_id: Int!) {
        series(where: { id: { _eq: $series_id } }) {
          id name
          book_series(order_by: { position: asc }) {
            position
            book {
              id title users_count default_physical_edition_id
              image { url }
              english_editions: editions(
                where: { language: { id: { _eq: 1 } } }
                limit: 20
              ) { id isbn_13 isbn_10 }
            }
          }
        }
      }
    GQL
    data = graphql_post(query, { series_id: series_id })
    data&.dig('series', 0)
  end

  # ── Filtering ─────────────────────────────────────────────────────────────

  def filter_canonical_books(book_series_entries)
    by_position = book_series_entries.group_by { |e| e['position'] }

    by_position.filter_map do |pos, entries|
      next if pos.nil?
      next if pos < MIN_POSITION
      next unless VALID_FRACS.include?((pos % 1).round(1))

      # Keep only entries with English editions, a cover, and enough users
      candidates = entries.select do |e|
        b = e['book']
        b['image'].present? &&
          (b['users_count'] || 0) >= MIN_USERS &&
          b['english_editions'].present?
      end
      next if candidates.empty?

      # Pick highest users_count — reliably selects canonical English edition
      best = candidates.max_by { |e| e['book']['users_count'] || 0 }
      book = best['book']

      # Prefer edition matching default_physical_edition_id for canonical ISBN
      default_id  = book['default_physical_edition_id']
      editions    = book['english_editions']
      canon_ed    = editions.find { |e| e['id'] == default_id } || editions.first
      isbn        = canon_ed&.dig('isbn_13') || canon_ed&.dig('isbn_10')

      {
        position:        pos,
        google_books_id: "hc_#{book['id']}",
        title:           book['title'],
        cover_image_url: book.dig('image', 'url')&.gsub('http://', 'https://'),
        isbn:            isbn,
        author_name:     nil,
      }
    end.sort_by { |b| b[:position] }
  end

  # ── GraphQL HTTP ──────────────────────────────────────────────────────────

  def graphql_post(query, variables = {})
    uri               = URI(GQL_ENDPOINT)
    http              = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = TIMEOUT_OPEN
    http.read_timeout = TIMEOUT_READ

    request                  = Net::HTTP::Post.new(uri)
    request['Content-Type']  = 'application/json'
    request['User-Agent']    = 'WellRead/1.0 (book tracking app)'
    api_key = ENV.fetch('HARDCOVER_API_KEY', '')
    request['Authorization'] = "Bearer #{api_key}" if api_key.present?
    request.body             = { query: query, variables: variables }.to_json

    response = http.request(request)
    return nil unless response.is_a?(Net::HTTPSuccess)

    parsed = JSON.parse(response.body)
    if parsed['errors'].present?
      Rails.logger.warn("[HardcoverSeriesService] GraphQL errors: #{parsed['errors'].map { |e| e['message'] }.join('; ')}")
      return nil
    end

    parsed['data']
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.warn("[HardcoverSeriesService] Timeout: #{e.message}")
    nil
  rescue JSON::ParserError => e
    Rails.logger.warn("[HardcoverSeriesService] Bad JSON: #{e.message}")
    nil
  rescue => e
    Rails.logger.warn("[HardcoverSeriesService] HTTP error: #{e.message}")
    nil
  end

  def normalize_name(str)
    str.to_s.downcase.gsub(/[^a-z\s]/, '').split.sort.join(' ')
  end
end
