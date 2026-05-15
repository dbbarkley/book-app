# frozen_string_literal: true

require 'net/http'
require 'json'

# BigBookSimilarityService
#
# Given a Book record, returns up to 20 similar books using the BigBook API.
#
# Two-step flow (each step independently cached):
#   1. Title search → find BigBook ID by matching title + author name  (7-day cache)
#   2. BigBook ID → similar books                                       (24-hour cache)
#
# BigBook API notes (from observed responses):
#   - Search endpoint: GET /search-books?query=<title>&search-fields=title&number=5
#   - Response: { "books": [[{id, title, image, authors:[{id,name}], rating}], [...]], ... }
#     NOTE: `books` is an array of single-element arrays — flatten one level before use.
#   - Cover field is `image`, not `cover_image`.
#   - Similar endpoint: GET /<bigbook_id>/similar?number=20
#     Response shape mirrors the search response (nested arrays).
#
# For each BigBook result:
#   - Try to find the book in our DB by title + author (exact title, fuzzy author).
#   - If found → return full DB record (has google_books_id for Book Details navigation).
#   - If not → return a Book-shaped hash from BigBook metadata (id: nil).
#
# Usage:
#   results = BigBookSimilarityService.new(book).call
#   # => Array of Book-shaped hashes
#
class BigBookSimilarityService
  BIGBOOK_BASE  = 'https://api.bigbookapi.com'
  TIMEOUT_OPEN  = 8
  TIMEOUT_READ  = 20
  SIMILAR_COUNT = 20
  SEARCH_COUNT  = 5  # candidates to consider when finding the seed book

  def initialize(book)
    @book = book
  end

  def call
    unless @book.title.present?
      Rails.logger.info("[BigBook] Book #{@book.id} has no title — skipping")
      return []
    end

    bigbook_id = fetch_bigbook_id
    unless bigbook_id
      Rails.logger.info("[BigBook] Could not find BigBook ID for '#{@book.title}'")
      return []
    end

    raw_similar = fetch_similar_books(bigbook_id)
    return [] if raw_similar.blank?

    enrich_results(raw_similar)
  rescue => e
    Rails.logger.error("[BigBook] Error for book #{@book.id}: #{e.message}\n#{e.backtrace.first(3).join("\n")}")
    []
  end

  private

  # ── Step 1: Title search → BigBook ID ─────────────────────────────────────
  #
  # Cache key uses the book's DB id — stable and unique.
  # We search by title and pick the candidate whose author name best matches ours.

  def fetch_bigbook_id
    Rails.cache.fetch("bigbook_book_id:#{@book.id}", expires_in: 7.days) do
      Rails.logger.info("[BigBook] Searching for '#{@book.title}' by '#{author_name}'")

      data = http_get('/search-books', {
        'query'         => @book.title,
        'search-fields' => 'title',
        'number'        => SEARCH_COUNT,
      })

      candidates = unwrap_books(data)
      id = best_match_id(candidates)
      Rails.logger.info("[BigBook] '#{@book.title}' → BigBook ID #{id.inspect}")
      id
    end
  end

  # ── Step 2: BigBook ID → similar books ────────────────────────────────────

  def fetch_similar_books(bigbook_id)
    Rails.cache.fetch("bigbook_similar:#{bigbook_id}", expires_in: 24.hours) do
      Rails.logger.info("[BigBook] Fetching similar books for BigBook ID #{bigbook_id}")

      data  = http_get("/#{bigbook_id}/similar", { 'number' => SIMILAR_COUNT })
      books = unwrap_books(data)
      Rails.logger.info("[BigBook] Found #{books.size} similar books for BigBook ID #{bigbook_id}")
      books
    end
  end

  # ── BigBook response parsing ───────────────────────────────────────────────
  #
  # BigBook wraps each book in its own single-element array:
  #   { "books": [[{...}], [{...}], ...] }
  # Flatten one level to get a plain array of book hashes.
  # Also handles the case where similar returns a bare array directly.

  def unwrap_books(data)
    return [] if data.nil?

    raw = case data
          when Array then data          # /similar returns a bare array
          when Hash  then data['books'] # /search-books wraps in { books: [...] }
          else return []
          end

    Array(raw).flat_map { |item| item.is_a?(Array) ? item : [item] }.compact
  end

  # Pick the candidate whose author name most closely matches ours.
  # Falls back to the first result if no author match is found.

  def best_match_id(candidates)
    return nil if candidates.empty?

    our_author = normalize_name(author_name)

    if our_author.present?
      matched = candidates.find do |c|
        candidate_authors = Array(c['authors']).map { |a| normalize_name(a.is_a?(Hash) ? a['name'] : a.to_s) }
        candidate_authors.any? { |ca| ca.include?(our_author) || our_author.include?(ca) }
      end
      return matched['id'] if matched
    end

    # No author match — use first result (title already matched)
    candidates.first&.dig('id')
  end

  def normalize_name(str)
    str.to_s.downcase.gsub(/[^a-z\s]/, '').split.sort.join(' ')
  end

  def author_name
    @author_name ||= (@book.author_name.presence || @book.author&.name).to_s
  end

  # ── Enrichment: BigBook results → Book-shaped hashes ─────────────────────

  def enrich_results(raw_books)
    raw_books.filter_map { |raw| enrich_one(raw) }
  end

  def enrich_one(raw)
    title = raw['title'].to_s.strip
    return nil if title.blank?

    raw_author = extract_author_name(raw['authors'])

    # Try our DB by title + author first — gives us full metadata + google_books_id
    db_book = find_in_db(title, raw_author)
    return serialize_db_book(db_book) if db_book

    # Not in DB — use BigBook metadata directly
    serialize_bigbook_result(raw, raw_author)
  end

  # Fuzzy DB lookup: exact title (case-insensitive) + author last name
  def find_in_db(title, raw_author)
    candidates = Book.includes(:author)
                     .where('LOWER(books.title) = ?', title.downcase)
                     .limit(5)

    return candidates.first if candidates.size == 1
    return nil if candidates.empty? || raw_author.blank?

    # Disambiguate by author last name
    last = raw_author.split.last.to_s.downcase
    candidates.find { |b| b.author&.name.to_s.downcase.include?(last) } || candidates.first
  end

  def serialize_db_book(book)
    {
      id:              book.id,
      title:           book.title,
      author_name:     book.author&.name,
      author_id:       book.author&.id,
      cover_image_url: book.cover_image_url,
      release_date:    book.release_date,
      google_books_id: book.google_books_id,
      isbn:            book.isbn,
      description:     book.description,
      page_count:      book.page_count,
      categories:      book.categories,
    }
  end

  def serialize_bigbook_result(raw, author_name)
    # Cover: BigBook uses 'image' (confirmed from API response)
    cover = raw['image'].presence || raw['cover_image'].presence

    # Release date: BigBook may return 'publish_date' string or 'year' int
    release = raw['publish_date'].presence || (raw['year'] ? "#{raw['year']}-01-01" : nil)

    {
      id:              nil,
      title:           raw['title'],
      author_name:     author_name,
      author_id:       nil,
      cover_image_url: cover,
      release_date:    release,
      google_books_id: nil,
      isbn:            raw['isbn13'].presence || raw['isbn'].presence,
      description:     raw['summary'].presence || raw['description'].presence,
      page_count:      raw['number_of_pages']&.to_i,
      categories:      Array(raw['genres']),
    }
  end

  def extract_author_name(authors)
    return nil if authors.blank?

    first = Array(authors).first
    return first          if first.is_a?(String)
    return first['name']  if first.is_a?(Hash)

    nil
  end

  # ── HTTP ──────────────────────────────────────────────────────────────────

  def http_get(path, params = {})
    params['api-key'] = ENV.fetch('BIG_BOOK_API_KEY', '')

    uri       = URI("#{BIGBOOK_BASE}#{path}")
    uri.query = URI.encode_www_form(params)

    http              = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = TIMEOUT_OPEN
    http.read_timeout = TIMEOUT_READ

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'Libraio/1.0 (book tracking app)'

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("[BigBook] Non-200 from #{path}: #{response.code}")
      return nil
    end

    JSON.parse(response.body)
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.warn("[BigBook] Timeout on #{path}: #{e.message}")
    nil
  rescue JSON::ParserError => e
    Rails.logger.warn("[BigBook] Bad JSON from #{path}: #{e.message}")
    nil
  rescue => e
    Rails.logger.warn("[BigBook] HTTP error on #{path}: #{e.message}")
    nil
  end
end
