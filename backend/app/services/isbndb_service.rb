# IsbndbService
#
# Fetches upcoming book releases from the ISBNdb API across a set of genres,
# applies quality filters, deduplicates by isbn13, and upserts into the
# upcoming_releases table.
#
# Usage:
#   IsbndbService.call
#   IsbndbService.call(days_ahead: 60)
#
class IsbndbService < BaseService
  BASE_URL   = 'https://api2.isbndb.com'
  PAGE_SIZE  = 100  # ISBNdb max per request
  MAX_PAGES  = 3    # cap at 300 results per genre to avoid hammering the API
  DAYS_AHEAD = 90   # fetch releases within the next 90 days
  DAYS_BACK  = 7    # also fetch/update releases from the last 7 days

  # Genres to fan out across — these map to ISBNdb subject slugs
  GENRES = %w[
    fiction
    mystery
    thriller
    romance
    fantasy
    science-fiction
    horror
    biography
    self-help
    history
    young-adult
    graphic-novels
  ].freeze

  # Bindings that signal a reprint rather than a new release
  EXCLUDED_BINDINGS = ['Mass Market Paperback'].freeze

  # Publisher allowlist — partial case-insensitive match.
  # Covers the Big 5 + major independents. Filters out self-pub noise.
  PUBLISHER_PATTERNS = [
    # Penguin Random House
    'penguin', 'random house', 'knopf', 'doubleday', 'viking', 'putnam',
    'berkley', 'riverhead', 'crown', 'bantam', 'dutton', 'plume',
    'signet', 'portfolio', 'avery', 'tarcher', 'ace books', 'roc books',
    # HarperCollins
    'harpercollins', 'harper collins', 'avon', 'mira books', 'william morrow',
    'harper voyager', 'harlequin', 'hanover square', 'park row',
    # Simon & Schuster
    'simon & schuster', 'simon and schuster', 'gallery books', 'atria',
    'scribner', 'pocket books', 'howard books', 'adams media',
    # Macmillan
    'tor publishing', 'st. martin', 'st martin', 'farrar', 'henry holt',
    'celadon', 'macmillan', 'flatiron', 'minotaur',
    # Hachette
    'little, brown', 'little brown', 'grand central', 'orbit', 'mulholland',
    'hachette', 'basic books', 'public affairs', 'running press',
    # Major independents
    # 'sourcebooks', 'workman', 'chronicle books', 'bloomsbury',
    # 'disney', 'hyperion', 'algonquin', 'soho press', 'poisoned pen',
    # 'quirk books', 'tyndale', 'baker books', 'zondervan', 'thomas nelson',
    # 'kensington', 'podium', 'wednesday books', 'wednesday',
    # 'severn house', 'crooked lane', 'mysterious press',
  ].freeze

  # Specific publisher sub-groups or imprints to exclude (e.g. children's or UK-only groups)
  EXCLUDED_PUBLISHER_PATTERNS = [
    "hachette children's group",
    "little, brown book group limited"
  ].freeze

  def initialize(days_ahead: DAYS_AHEAD)
    @days_ahead     = days_ahead
    @published_from = (Date.current - DAYS_BACK.days).strftime('%Y-%m-%d')
    @published_to   = (Date.current + days_ahead.days).strftime('%Y-%m-%d')
    @api_key        = ENV.fetch('ISBNDB_API_KEY')
  end

  private

  def execute
    Rails.logger.info "[IsbndbService] Fetching upcoming releases #{@published_from} → #{@published_to}"

    # isbn13 → merged book hash (with :_genres array accumulated across queries)
    merged = {}

    GENRES.each do |genre|
      books = fetch_genre(genre)
      Rails.logger.info "[IsbndbService] #{genre}: #{books.size} books after filter"

      books.each do |book|
        isbn = book['isbn13']

        # Determine additional genres based on subjects.
        # "Historical Fiction" maps to plain "fiction", and anything with "History"
        # in the subjects gets tagged as "history".
        subjects = Array(book['subjects']).compact.map(&:downcase)
        extra    = []
        extra << 'history' if subjects.any? { |s| s.include?('history') }
        extra << 'fiction' if subjects.any? { |s| s.include?('historical fiction') }

        assigned = ([genre] + extra).uniq

        if merged.key?(isbn)
          # Already seen — just add these genres
          merged[isbn][:_genres] |= assigned
        else
          merged[isbn] = book.merge(_genres: assigned)
        end
      end
    end

    deduped = merged.values
    Rails.logger.info "[IsbndbService] #{deduped.size} unique ISBNs before title+author dedup"

    # Second dedup pass — same book often appears as both hardcover and paperback
    # with different ISBN13s. Normalize title + first author (lowercase, collapsed
    # whitespace) to find these pairs and keep the hardcover, merging genres from both.
    normalized = {}
    deduped.each do |book|
      authors = Array(book['authors']).compact.reject(&:blank?)
      key = [
        clean_title(book['title']).to_s.downcase.gsub(/\s+/, ' ').strip,
        authors.first.to_s.downcase.gsub(/\s+/, ' ').strip,
      ]

      existing = normalized[key]
      if existing.nil?
        normalized[key] = book
      else
        merged_genres  = (existing[:_genres] || []) | (book[:_genres] || [])
        existing_is_hc = existing['binding'].to_s.downcase.include?('hardcover')
        current_is_hc  = book['binding'].to_s.downcase.include?('hardcover')
        winner         = (current_is_hc && !existing_is_hc) ? book : existing
        winner[:_genres] = merged_genres
        normalized[key]  = winner
      end
    end

    final         = normalized.values
    dropped_isbns = deduped.map { |b| b['isbn13'] } - final.map { |b| b['isbn13'] }
    Rails.logger.info "[IsbndbService] #{final.size} books after title+author dedup (dropped #{dropped_isbns.size} duplicate editions)"
    UpcomingRelease.where(isbn13: dropped_isbns).delete_all if dropped_isbns.any?

    upserted = upsert_all(final)
    Rails.logger.info "[IsbndbService] Upserted #{upserted} records"

    # Purge stale records (past their release date by >7 days, or fetched >30 days ago)
    purge_stale
    success!(upserted)
  rescue KeyError
    failure!('ISBNDB_API_KEY environment variable is not set')
  rescue => e
    Rails.logger.error "[IsbndbService] Error: #{e.message}\n#{e.backtrace.first(3).join("\n")}"
    failure!(e.message)
  end

  # ── Fetching ───────────────────────────────────────────────────────────────

  def fetch_genre(genre)
    books = []
    page  = 1

    loop do
      url  = build_url(genre, page)
      data = http_get(url)
      break unless data

      raw = data['books'] || []
      break if raw.empty?

      books.concat(raw.select { |b| keep?(b) })

      total   = data['total'].to_i
      fetched = page * PAGE_SIZE
      break if fetched >= total || page >= MAX_PAGES

      page += 1
      sleep 0.3  # be polite to the API
    end

    books
  end

  def build_url(genre, page)
    params = URI.encode_www_form(
      page:          page,
      pageSize:      PAGE_SIZE,
      publishedFrom: @published_from,
      publishedTo:   @published_to,
    )
    "#{BASE_URL}/books/#{URI.encode_uri_component(genre)}?#{params}"
  end

  def http_get(url)
    uri  = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.read_timeout = 15
    http.open_timeout = 10

    req = Net::HTTP::Get.new(uri)
    req['Authorization'] = @api_key
    req['Content-Type']  = 'application/json'

    response = http.request(req)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn "[IsbndbService] HTTP #{response.code} for #{url}"
      return nil
    end

    JSON.parse(response.body)
  rescue => e
    Rails.logger.warn "[IsbndbService] Request failed for #{url}: #{e.message}"
    nil
  end

  # ── Filtering ──────────────────────────────────────────────────────────────

  def keep?(book)
    return false if book['title'].blank?
    return false if book['isbn13'].blank?
    return false unless english_language?(book['language'])
    return false if excluded_binding?(book['binding'])
    return false unless allowed_publisher?(book['publisher'])
    return false unless future_or_recent_date?(book['date_published'])
    true
  end

  def english_language?(lang)
    # ISBNdb uses "en" or "English". If blank, we assume English to avoid
    # over-filtering, but usually it's present.
    return true if lang.blank?
    lang.downcase.start_with?('en')
  end

  def excluded_binding?(binding)
    return false if binding.blank?
    EXCLUDED_BINDINGS.any? { |ex| binding.strip.casecmp?(ex) }
  end

  def allowed_publisher?(publisher)
    return false if publisher.blank?
    pub_down = publisher.downcase

    # Check exclusions first (e.g. to filter out children's groups from a major publisher)
    return false if EXCLUDED_PUBLISHER_PATTERNS.any? { |pat| pub_down.include?(pat) }

    PUBLISHER_PATTERNS.any? { |pat| pub_down.include?(pat) }
  end

  def future_or_recent_date?(date_str)
    return false if date_str.blank?
    Date.parse(date_str) >= Date.current - DAYS_BACK.days
  rescue ArgumentError
    false
  end

  # ── Persistence ───────────────────────────────────────────────────────────

  def upsert_all(books)
    return 0 if books.empty?

    records = books.map do |book|
      authors  = Array(book['authors']).compact.reject(&:blank?)
      subjects = Array(book['subjects']).compact.reject(&:blank?)
      genres   = Array(book[:_genres]).compact

      # Omit created_at / updated_at — record_timestamps: true (default) lets
      # Rails inject them correctly without duplicating in the ON CONFLICT clause.
      {
        isbn13:          book['isbn13'],
        isbn10:          book['isbn10'],
        title:           clean_title(book['title']),
        authors:         authors,          # Pass raw Array — AR handles JSONB cast
        publisher:       book['publisher'],
        date_published:  safe_date(book['date_published']),
        binding:         book['binding'],
        synopsis:        strip_html(book['synopsis']),
        cover_image_url: book['image'],
        subjects:        subjects,         # Pass raw Array — AR handles JSONB cast
        genres:          genres,           # Pass raw Array — AR handles JSONB cast
        msrp:            book['msrp'].presence&.to_d,
        pages:           book['pages'].presence&.to_i,
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

    books.size
  end

  def purge_stale
    old_count = UpcomingRelease.where('date_published < ?', Date.current - DAYS_BACK.days).delete_all
    Rails.logger.info "[IsbndbService] Purged #{old_count} stale upcoming releases" if old_count > 0
  end

  def safe_date(str)
    Date.parse(str)
  rescue ArgumentError, TypeError
    nil
  end

  def strip_html(text)
    return nil if text.blank?
    text.gsub(/<[^>]+>/, ' ').gsub(/\s+/, ' ').strip
  end

  # ISBNdb frequently appends marketing subtitles to the title field, separated
  # by a spaced dash (or en/em dash), e.g.:
  #   "Our Secret Summer - Escape to sunshine in this sparkling summertime romance"
  # Strip everything from the first " - " / " – " / " — " onwards so only the
  # real title is stored. The regex requires whitespace on both sides so hyphenated
  # words like "Spider-Man" are left untouched.
  def clean_title(raw)
    return nil if raw.blank?

    # 1. Handle explicit separators (colon, dash)
    # This is the most reliable, so we do it first.
    title = raw.sub(/[:]\s*.*|\s+[\-–—].*|[\-–—]\s+.*/, '').strip

    # 2. Define marketing patterns
    marketing_hooks = [
      "The brand new", "A brand new", "The Sunday Times", "The New York Times",
      "The NYT bestseller", "From the author of", "From the bestselling",
      "BookTok phenomenon", "TikTok made me buy it", "The most anticipated",
      "A novel from", "Winner of the", "Shortlisted for", "Longlisted for",
      "The steamy new", "A steamy new", "The sexy new", "A sexy new",
      "The gripping new", "A gripping new", "The heart-pounding", "The must-read"
    ]

    marketing_nouns = %w[bestseller thriller romance novel series phenomenon story]

    # 3. Find the EARLIEST occurrence of any marketing pattern.
    # We want to strip everything from the first sign of marketing onwards.
    earliest_index = title.length

    marketing_hooks.each do |hook|
      regex = /\s+#{Regexp.escape(hook)}/i
      if (match = title.match(regex))
        earliest_index = [earliest_index, match.begin(0)].min
      end
    end

    marketing_nouns.each do |noun|
      # Matches: space + The/A + optional words + noun
      regex = /\s+(?:The|An?)\s+[\w\s\.-]{0,60}#{noun}/i
      if (match = title.match(regex))
        earliest_index = [earliest_index, match.begin(0)].min
      end
    end

    # 4. Fallback: Capitalization heuristic
    # If we see a sequence of 2+ lowercase words at the end, it's likely marketing.
    words = title.split(/\s+/)
    if words.size > 3
      last_cap_index = words.rindex { |w| w =~ /^[A-Z]/ }
      if last_cap_index && (words.size - 1 - last_cap_index) >= 2
        # Calculate the character index where the "noise" starts
        noise_start_index = title.index(words[last_cap_index]) + words[last_cap_index].length

        # If the last capitalized word is an article, the noise actually starts before it
        if %w[the a an].include?(words[last_cap_index].downcase)
          # Find the space before this article
          article_regex = /\s+#{Regexp.escape(words[last_cap_index])}\s+/i
          if (match = title.match(article_regex))
            noise_start_index = match.begin(0)
          end
        end

        earliest_index = [earliest_index, noise_start_index].min
      end
    end

    title[0...earliest_index].strip
  end
end
