require 'net/http'
require 'json'

# BisacPopulatorJob
#
# Fills curated_shelf_books by querying Hardcover's GraphQL API for each
# active BisacCategory. Designed to be called by a scheduler (weekly to start,
# daily for high-traffic categories later) — never called at request time.
#
# The controller only ever reads from the curated_shelf_books cache. This job
# is the only thing that writes to it.
#
# Usage:
#   BisacPopulatorJob.perform_later                        # all stale categories
#   BisacPopulatorJob.perform_later(code: 'FIC027000')     # one category
#   BisacPopulatorJob.perform_later(code: 'FIC027000', force: true)
#
# ── Hardcover sort strategy ───────────────────────────────────────────────────
# The Hardcover UI sorts by taggings_count (how many users tagged the book with
# that specific genre tag). This is the ideal signal but is not directly sortable
# via the public GraphQL API without a timeout-inducing aggregate.
#
# Instead we:
#   1. Fetch up to FETCH_LIMIT books per page across HARDCOVER_PAGES pages,
#      filtered by genre tag + ratings_count >= MIN_RATINGS, sorted by
#      users_read_count desc (fast, indexed — gives us popular engaged books).
#      Pages are merged and de-duped in Ruby.
#   2. Re-sort in Ruby by the genre-specific tag count from cached_tags
#      (same data the UI uses, just computed here rather than in the DB)
#   3. Keep the top MAX_RESULTS
#
# Storing 250 books per shelf lets the mobile client page through 6 screens
# of 40 books each (initial view + 5 "Load More" taps) with zero extra
# network requests after the first shelf open.
#
class BisacPopulatorJob < ApplicationJob
  queue_as :default

  HARDCOVER_ENDPOINT = 'https://api.hardcover.app/v1/graphql'

  # Books to request per Hardcover API page
  FETCH_LIMIT     = 100
  # Number of pages to fetch (100 × 3 = 300 candidates before re-sort)
  HARDCOVER_PAGES = 3
  # Books to keep per shelf after re-sorting — supports 6 pages of 40 on mobile
  MAX_RESULTS     = 250
  # Minimum ratings on Hardcover — filters out zero-engagement imports
  MIN_RATINGS     = 10

  # Trending shelf — tighter cap; quality over quantity
  MAX_SERP_RESULTS = 40

  # Genre-specific trending queries — keeps results in recognisable fiction/nonfiction
  # territory and avoids almanacs, magazines, and reference titles that slip through
  # broad "trending books" searches.
  SERP_QUERIES = [
    'trending romance novels 2026',
    'trending fiction books 2026',
    'trending nonfiction books 2026',
    'trending fantasy novels 2026',
  ].freeze

  # Tokens that strongly indicate a non-novel product — used to filter SERP results
  # before they reach the Google Books enrichment step.
  NON_BOOK_PATTERNS = /
    almanac | magazine | journal | encyclopedia | dictionary |
    handbook | manual | workbook | planner | coloring\s+book |
    knife | knives | blade | tactical | gun | firearm |
    cookbook\s+collection | field\s+guide | atlas | catalog
  /xi.freeze

  def perform(code: nil, force: false)
    categories = code.present? ? BisacCategory.active.where(code: code) : BisacCategory.active

    categories.find_each do |category|
      next unless force || category.stale?
      populate_category(category)
    end
  end

  private

  def populate_category(category)
    identifier = category.resolved_source_identifier

    # SERP is the only source that doesn't need a source_identifier — it drives
    # itself from the hardcoded SERP_QUERIES constant.
    if identifier.blank? && category.data_source != 'serp'
      Rails.logger.warn("[BisacPopulator] Skipping #{category.code} — no source_identifier or query_terms")
      return
    end

    Rails.logger.info("[BisacPopulator] Populating #{category.code} (#{category.name}) " \
                      "via #{category.data_source}")

    books = case category.data_source
            when 'hardcover'      then fetch_from_hardcover(identifier)
            when 'nyt'            then fetch_from_nyt(identifier)
            when 'nyt+hardcover'  then fetch_nyt_plus_hardcover(category)
            when 'open_library'   then fetch_from_open_library(identifier)
            when 'serp'           then fetch_from_serp
            else
              Rails.logger.warn("[BisacPopulator] Unknown data_source '#{category.data_source}'")
              []
            end

    if books.empty?
      Rails.logger.warn("[BisacPopulator] No results for #{category.code} (#{identifier})")
      return
    end

    persist_books(category, books)
  end

  # ── Hardcover ──────────────────────────────────────────────────────────────

  def fetch_from_hardcover(tag_slug)
    unless ENV['HARDCOVER_API_KEY'].present?
      Rails.logger.error('[BisacPopulator] HARDCOVER_API_KEY not set')
      return []
    end

    # Paginate across HARDCOVER_PAGES pages to collect a large candidate pool.
    # Each page is sorted by users_read_count desc (fast indexed sort).
    # We merge, de-dupe by id, then re-sort by genre-specific taggings_count in Ruby.
    all_items = []

    HARDCOVER_PAGES.times do |page|
      offset = page * FETCH_LIMIT
      items  = fetch_hardcover_page(tag_slug, offset: offset)
      break if items.empty?
      all_items.concat(items)
      # Stop early if the last page was short (no more results)
      break if items.size < FETCH_LIMIT
    end

    return [] if all_items.empty?

    # De-dupe (pages can overlap when the result set is smaller than FETCH_LIMIT * PAGES)
    unique = all_items.uniq { |b| b['id'] }

    # Re-sort by how many users specifically tagged this book with this genre.
    # This replicates the Hardcover UI ranking without an expensive aggregate query.
    sorted = unique.sort_by do |book|
      genre_tags = book.dig('cached_tags', 'Genre') || []
      match = genre_tags.find { |t| t['tagSlug'] == tag_slug }
      match ? -match['count'] : 0   # negative for desc
    end

    sorted
      .first(MAX_RESULTS)
      .select { |b| b.dig('image', 'url').present? }
      .map    { |b| map_hardcover_book(b) }
      .compact

  rescue => e
    Rails.logger.error("[BisacPopulator] Hardcover fetch failed for '#{tag_slug}': #{e.message}")
    []
  end

  def fetch_hardcover_page(tag_slug, offset: 0)
    query = <<~GRAPHQL
      query GetCategoryBooks($tag: String!, $limit: Int!, $offset: Int!, $minRatings: Int!) {
        books(
          where: {
            taggings: { tag: { slug: { _eq: $tag } } }
            ratings_count: { _gte: $minRatings }
          }
          order_by: { users_read_count: desc }
          limit: $limit
          offset: $offset
        ) {
          id
          title
          slug
          rating
          ratings_count
          users_read_count
          release_year
          pages
          description
          cached_tags
          image { url }
          contributions(limit: 1) {
            author { name }
          }
          editions(limit: 1) {
            isbn_13
            isbn_10
          }
        }
      }
    GRAPHQL

    payload = {
      query:     query,
      variables: { tag: tag_slug, limit: FETCH_LIMIT, offset: offset, minRatings: MIN_RATINGS },
    }

    run_hardcover_query(payload)
  rescue => e
    Rails.logger.error("[BisacPopulator] Hardcover page fetch failed (offset=#{offset}): #{e.message}")
    []
  end

  def run_hardcover_query(payload)
    api_key = ENV['HARDCOVER_API_KEY']
    uri  = URI(HARDCOVER_ENDPOINT)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 30

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type']  = 'application/json'
    request['Authorization'] = "Bearer #{api_key}"
    request.body = payload.to_json

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      raise "Hardcover returned #{response.code}: #{response.body.truncate(300)}"
    end

    data = JSON.parse(response.body)

    if data['errors'].present?
      raise "Hardcover GraphQL errors: #{data['errors'].map { |e| e['message'] }.join(', ')}"
    end

    data.dig('data', 'books') || []
  end

  def map_hardcover_book(item)
    cover = item.dig('image', 'url').to_s.gsub('http://', 'https://')
    return nil if cover.blank?

    edition = (item['editions'] || []).first || {}
    isbn = edition['isbn_13'].presence || edition['isbn_10'].presence

    {
      google_books_id: "hc_#{item['id']}",
      isbn:            isbn,
      title:           item['title'].presence || 'Unknown Title',
      author_name:     item.dig('contributions', 0, 'author', 'name'),
      cover_image_url: cover,
      description:     item['description'].presence,
      published_date:  item['release_year']&.to_s,
      average_rating:  item['rating']&.to_f&.round(2),
      ratings_count:   item['ratings_count']&.to_i || 0,
      page_count:      item['pages']&.to_i.presence,
    }
  end

  # ── NYT ───────────────────────────────────────────────────────────────────

  def fetch_from_nyt(list_name)
    api_key = ENV['NEW_YORK_TIMES_API_KEY']
    raise 'NYT API key not configured' if api_key.blank?

    uri  = URI("https://api.nytimes.com/svc/books/v3/lists/current/#{list_name}.json?api-key=#{api_key}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 8
    http.read_timeout = 12

    resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
    raise "NYT returned #{resp.code}" unless resp.is_a?(Net::HTTPSuccess)

    books_data = JSON.parse(resp.body).dig('results', 'books') || []

    books = books_data.filter_map do |b|
      next if b['book_image'].blank?
      {
        google_books_id: b['primary_isbn13'] || b['primary_isbn10'],
        title:           b['title'],
        author_name:     b['author'],
        cover_image_url: b['book_image'],
        description:     b['description'].presence,
        published_date:  nil,
        page_count:      nil,
        average_rating:  nil,
        ratings_count:   0,
      }
    end

    enrich_with_google_books(books)

  rescue => e
    Rails.logger.error("[BisacPopulator] NYT fetch failed for '#{list_name}': #{e.message}")
    []
  end

  # ── Google Books ISBN enrichment ──────────────────────────────────────────
  #
  # Fills in page_count and published_date for books that have an ISBN as their
  # google_books_id (i.e. NYT-sourced books). Skips books that already have
  # both fields or whose ID is not an ISBN (hc_ / ol_ prefixed).
  #
  # Uses a small sleep between requests to stay within the free-tier quota.
  #
  def enrich_with_google_books(books)
    gb_key = ENV['GOOGLE_BOOKS_API_KEY'].presence

    books.map do |book|
      isbn = book[:google_books_id].to_s

      # Only enrich ISBN-format IDs (10 or 13 digits); skip hc_ / ol_ etc.
      next book unless isbn.match?(/\A\d{10,13}\z/)
      # Skip if we already have both fields
      next book if book[:page_count].present? && book[:published_date].present?

      begin
        url = "https://www.googleapis.com/books/v1/volumes?q=isbn:#{isbn}&maxResults=1"
        url += "&key=#{gb_key}" if gb_key

        uri  = URI(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl      = true
        http.open_timeout = 5
        http.read_timeout = 8

        resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        data = JSON.parse(resp.body)
        info = data.dig('items', 0, 'volumeInfo')

        if info
          book = book.merge(
            page_count:     info['pageCount']&.to_i.presence || book[:page_count],
            published_date: info['publishedDate'].presence    || book[:published_date],
          )
        end

        sleep 0.15  # ~6 req/sec — well within the 1,000 req/day free quota
      rescue => e
        Rails.logger.warn("[BisacPopulator] Google Books enrichment failed for ISBN #{isbn}: #{e.message}")
      end

      book
    end
  end

  # ── NYT + Hardcover hybrid ────────────────────────────────────────────────
  #
  # Used for broad parent categories (Fiction, Non-Fiction) where no single
  # Hardcover genre slug exists.
  #
  # Strategy:
  #   1. Fetch the current NYT bestsellers list (15 books) — ranked first as
  #      the highest editorial signal.
  #   2. Look up this category's active Hardcover subcategories in the DB and
  #      pull one page (FETCH_LIMIT) from each slug.
  #   3. Sort the Hardcover pool by users_read_count (proxy for popularity).
  #   4. Merge: NYT books first, then Hardcover books not already in the NYT
  #      list (de-duped by normalised title). Trim to MAX_RESULTS.
  #
  # The subcategory-driven supplement means this shelf automatically gains
  # depth whenever new subcategories are added — no hardcoding required.
  #
  def fetch_nyt_plus_hardcover(category)
    nyt_books = fetch_from_nyt(category.source_identifier)

    hc_slugs = BisacCategory.active
                             .where(parent_code: category.code, data_source: 'hardcover')
                             .order(:display_order)
                             .pluck(:source_identifier)
                             .compact
                             .uniq

    Rails.logger.info(
      "[BisacPopulator] #{category.code} hybrid: #{nyt_books.size} NYT + " \
      "#{hc_slugs.size} Hardcover slugs to supplement"
    )

    # One page per slug — enough candidates without being slow
    hc_raw = hc_slugs.flat_map do |slug|
      fetch_hardcover_page(slug, offset: 0)
    rescue => e
      Rails.logger.warn("[BisacPopulator] Supplement slug '#{slug}' failed: #{e.message}")
      []
    end

    hc_books = hc_raw
                 .uniq { |b| b['id'] }
                 .sort_by { |b| -(b['users_read_count'].to_i) }
                 .select  { |b| b.dig('image', 'url').present? }
                 .map     { |b| map_hardcover_book(b) }
                 .compact

    # De-dupe against NYT by normalised title (different ID namespaces)
    nyt_titles = nyt_books.map { |b| normalize_title(b[:title]) }.to_set
    hc_unique  = hc_books.reject { |b| nyt_titles.include?(normalize_title(b[:title])) }

    (nyt_books + hc_unique).first(MAX_RESULTS)
  end

  def normalize_title(title)
    title.to_s.downcase.gsub(/[^a-z0-9]/, '')
  end

  # ── SERP / Google Shopping trending ───────────────────────────────────────
  #
  # Fires SERP_QUERIES against Google Shopping via Serper.dev (free tier:
  # 2,500 req/month — 4 queries/week costs ~17/month, well within free).
  # Results are de-duped by normalised title, enriched via Google Books to get
  # a stable google_books_id + full metadata, then trimmed to MAX_SERP_RESULTS.
  #
  # Because Google Books IDs are returned (not hc_ or ol_), books on this
  # shelf resolve cleanly through the standard show_by_google endpoint without
  # any curated-shelf fallback needed.
  #
  def fetch_from_serp
    unless ENV['SERPER_API_KEY'].present?
      Rails.logger.error('[BisacPopulator] SERPER_API_KEY not set')
      return []
    end

    seen_titles = Set.new
    candidates  = []

    SERP_QUERIES.each_with_index do |query, idx|
      Rails.logger.info("[BisacPopulator] SERP query #{idx + 1}/#{SERP_QUERIES.size}: \"#{query}\"")
      items = fetch_serp_query(query)

      items.each do |item|
        title = clean_serp_title(item['title'])
        next if title.blank?
        next if title.match?(NON_BOOK_PATTERNS)   # drop almanacs, magazines, etc.
        key = normalize_title(title)
        next if seen_titles.include?(key)

        seen_titles.add(key)
        candidates << { title: title, thumbnail: item['imageUrl'].to_s }
      end

      sleep 0.5
    end

    Rails.logger.info("[BisacPopulator] SERP: #{candidates.size} unique titles, enriching via Google Books…")

    enriched = candidates
      .first(MAX_SERP_RESULTS * 2)   # over-fetch before enrichment drops some
      .filter_map { |c| enrich_serp_book(c[:title], c[:thumbnail]) }
      .first(MAX_SERP_RESULTS)

    Rails.logger.info("[BisacPopulator] SERP: #{enriched.size} books after enrichment")
    enriched

  rescue => e
    Rails.logger.error("[BisacPopulator] fetch_from_serp failed: #{e.message}")
    []
  end

  def fetch_serp_query(query)
    uri  = URI('https://google.serper.dev/shopping')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 8
    http.read_timeout = 12

    req = Net::HTTP::Post.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    req['X-API-KEY']    = ENV['SERPER_API_KEY']
    req.body            = { q: query, num: 20 }.to_json

    resp = http.request(req)
    raise "Serper returned #{resp.code}: #{resp.body.truncate(200)}" unless resp.is_a?(Net::HTTPSuccess)

    JSON.parse(resp.body)['shopping'] || []
  rescue => e
    Rails.logger.error("[BisacPopulator] Serper query '#{query}' failed: #{e.message}")
    []
  end

  # Strip retailer suffixes Google Shopping adds to book titles:
  #   "Fourth Wing - Hardcover"  →  "Fourth Wing"
  #   "Fourth Wing by Rebecca Yarros"  →  "Fourth Wing"
  #   "Fourth Wing (The Empyrean, 1)"  →  "Fourth Wing"
  def clean_serp_title(raw)
    return '' if raw.blank?

    raw
      .gsub(/\s*[-–|]\s*(hardcover|paperback|mass market paperback|audio cd|
                          kindle edition|ebook|board book|large print|
                          spiral[\s-]bound|box set|omnibus).*/ix, '')
      .gsub(/\s+by\s+[A-Z].+$/i, '')          # trailing "by Author Name"
      .gsub(/\s*[\(\[][^)\]]*[\)\]]\s*$/, '')  # trailing (Series, 1) or [...]
      .strip
  end

  # Look up a book by title in Google Books and return a fully-formed hash
  # ready for persist_books. Returns nil if no cover is found.
  def enrich_serp_book(title, fallback_thumbnail)
    gb_key  = ENV['GOOGLE_BOOKS_API_KEY'].presence
    encoded = URI.encode_www_form_component("intitle:\"#{title}\"")
    url     = "https://www.googleapis.com/books/v1/volumes?q=#{encoded}&maxResults=1&orderBy=relevance"
    url    += "&key=#{gb_key}" if gb_key

    uri  = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 5
    http.read_timeout = 8

    resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
    data = JSON.parse(resp.body)
    item = data['items']&.first
    return nil unless item

    v      = item['volumeInfo'] || {}
    vol_id = item['id']

    # Use exactly the same URL format that fetch_google_book (the detail endpoint)
    # returns — raw imageLinks.thumbnail from the Google Books API, just with
    # http upgraded to https for iOS ATS. No zoom tweaks, no constructed URLs;
    # those don't reliably load in React Native.
    raw = v.dig('imageLinks', 'thumbnail') || v.dig('imageLinks', 'smallThumbnail')
    return nil if raw.blank?   # skip books Google Books has no cover for

    cover = raw.to_s.gsub('http://', 'https://')

    sleep 0.1  # ~10 req/sec — Google Books free quota is 1,000/day per key

    {
      google_books_id: vol_id,
      title:           v['title'].presence || title,
      author_name:     (v['authors'] || []).first,
      cover_image_url: cover,
      description:     v['description'].presence,
      published_date:  v['publishedDate'].presence,
      page_count:      v['pageCount']&.to_i.presence,
      average_rating:  v['averageRating']&.to_f&.round(2),
      ratings_count:   v['ratingsCount']&.to_i || 0,
    }
  rescue => e
    Rails.logger.warn("[BisacPopulator] Google Books enrichment failed for '#{title}': #{e.message}")
    nil
  end

  # ── Open Library ──────────────────────────────────────────────────────────

  def fetch_from_open_library(subject)
    uri  = URI("https://openlibrary.org/subjects/#{URI.encode_www_form_component(subject)}.json?limit=#{MAX_RESULTS}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 8
    http.read_timeout = 15

    resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
    raise "Open Library returned #{resp.code}" unless resp.is_a?(Net::HTTPSuccess)

    works = JSON.parse(resp.body)['works'] || []

    works
      .select { |w| w['cover_id'].present? }
      .map do |w|
        ol_key = w['key'].to_s.sub('/works/', '')
        {
          google_books_id: "ol_#{ol_key}",
          title:           w['title'],
          author_name:     w.dig('authors', 0, 'name') || 'Unknown Author',
          cover_image_url: "https://covers.openlibrary.org/b/id/#{w['cover_id']}-M.jpg",
          description:     nil,
          published_date:  w['first_publish_year']&.to_s,
          average_rating:  nil,
          ratings_count:   0,
        }
      end

  rescue => e
    Rails.logger.error("[BisacPopulator] Open Library fetch failed for '#{subject}': #{e.message}")
    []
  end

  # ── Persistence ───────────────────────────────────────────────────────────

  def persist_books(category, books)
    now = Time.current

    books.each_with_index do |book, idx|
      CuratedShelfBook.upsert(
        {
          bisac_code:      category.code,
          google_books_id: book[:google_books_id],
          title:           book[:title],
          author_name:     book[:author_name],
          cover_image_url: book[:cover_image_url],
          description:     book[:description],
          published_date:  book[:published_date],
          page_count:      book[:page_count],
          average_rating:  book[:average_rating],
          ratings_count:   book[:ratings_count].to_i,
          rank:            idx + 1,
          cached_at:       now,
          created_at:      now,
          updated_at:      now,
        },
        unique_by: [:bisac_code, :google_books_id],
        update_only: %i[
          title author_name cover_image_url description published_date
          page_count average_rating ratings_count rank cached_at
        ]
      )
    end

    current_ids = books.map { |b| b[:google_books_id] }
    CuratedShelfBook.where(bisac_code: category.code)
                    .where.not(google_books_id: current_ids)
                    .delete_all

    # Dual-write to book_catalog — same data, upserted as a batch
    source = category.data_source.presence || 'curated'
    BookCatalog.upsert_many(books, source: source)

    category.update_column(:last_populated_at, now)
    Rails.logger.info("[BisacPopulator] #{category.code} — #{books.size} books saved (catalog updated)")
  end
end
