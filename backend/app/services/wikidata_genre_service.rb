require 'net/http'
require 'json'

# Fetches genre data from Wikidata's SPARQL endpoint.
#
# Strategy:
#   1. Try ISBN-13 lookup (fast, exact — works when Wikidata has that edition)
#   2. Try ISBN-10 lookup
#   3. Fall back to title + author label search (broader, usually finds the work)
#
# Usage:
#   genres = WikidataGenreService.fetch_genres(book)
#   # => ["Science fiction", "Dystopian fiction", "Adventure fiction"]
#
class WikidataGenreService
  SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

  # Wikidata item IDs for "instance of" types that mean "book/novel"
  # Q7725634 = novel, Q8261 = novel, Q47461344 = written work, Q571 = book
  BOOK_TYPES = %w[Q7725634 Q8261 Q47461344 Q571 Q49084].freeze

  def self.fetch_genres(book)
    genres = nil

    # 1. ISBN-13
    if book.isbn.present?
      isbn = book.isbn.gsub(/[^0-9X]/i, '')
      genres = query_by_isbn(isbn, 'P212') if isbn.length == 13
      genres ||= query_by_isbn(isbn, 'P957') if isbn.length == 10
    end

    # 2. Title + author fallback
    if genres.blank? && book.title.present?
      genres = query_by_title(book.title, book.author&.name)
    end

    genres.presence
  end

  # ── SPARQL queries ──────────────────────────────────────────────────────────

  def self.query_by_isbn(isbn, property)
    sparql = <<~SPARQL
      SELECT ?genreLabel WHERE {
        ?book wdt:#{property} "#{isbn}" .
        ?book wdt:P136 ?genre .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    SPARQL
    run_query(sparql)
  end

  # Strip series notation before querying — Wikidata uses bare titles.
  # "The Ballad of Songbirds and Snakes (The Hunger Games, #0)" → "The Ballad of Songbirds and Snakes"
  def self.clean_title(title)
    title.to_s
         .gsub(/\s*\([^)]*#\d[^)]*\)/, '') # remove "(Series Name, #N)"
         .gsub(/\s*\([^)]*\d+[^)]*\)/, '') # remove remaining "(... number ...)"
         .strip
  end

  def self.query_by_title(title, author_name)
    title = clean_title(title)

    # Escape quotes in title/author to avoid breaking the SPARQL string
    safe_title  = title.to_s.gsub('"', '\\"')
    safe_author = author_name.to_s.gsub('"', '\\"')

    author_clause = if author_name.present?
      <<~CLAUSE
        ?book wdt:P50 ?author .
        ?author rdfs:label "#{safe_author}"@en .
      CLAUSE
    else
      ''
    end

    sparql = <<~SPARQL
      SELECT ?genreLabel WHERE {
        ?book rdfs:label "#{safe_title}"@en .
        #{author_clause}
        ?book wdt:P136 ?genre .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      LIMIT 20
    SPARQL
    run_query(sparql)
  end

  # ── HTTP ────────────────────────────────────────────────────────────────────

  def self.run_query(sparql)
    uri = URI(SPARQL_ENDPOINT)
    uri.query = URI.encode_www_form(query: sparql, format: 'json')

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl     = true
    http.open_timeout = 10
    http.read_timeout = 15

    request = Net::HTTP::Get.new(uri)
    request['Accept']     = 'application/sparql-results+json'
    request['User-Agent'] = 'WellRead/1.0 (book tracking app; contact@getwellread.com)'

    response = http.request(request)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data   = JSON.parse(response.body)
    labels = data.dig('results', 'bindings')
                 &.filter_map { |b| b.dig('genreLabel', 'value') }
                 &.reject { |g| g.start_with?('Q') }  # skip unmapped QIDs
                 &.map(&:strip)
                 &.uniq

    labels.presence
  rescue => e
    Rails.logger.warn "WikidataGenreService error: #{e.message}"
    nil
  end
end
