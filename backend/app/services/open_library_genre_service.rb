require 'net/http'
require 'json'

# Fetches subject/genre data from Open Library for a given book.
# Tries ISBN lookup first (most accurate), falls back to title+author search.
#
# Usage:
#   subjects = OpenLibraryGenreService.fetch_subjects(book)
#   # => ["Science fiction", "Space travel", "Survival", ...]
#
class OpenLibraryGenreService
  BASE_URL = 'https://openlibrary.org'

  # Junk subjects that add no genre signal — filtered before storing
  SKIP_SUBJECTS = %w[
    fiction nonfiction accessible\ book protected\ daisy
    large\ print overdrive internet\ archive
    open\ library american in\ english accessible
    lending\ library
  ].freeze

  # Returns an array of cleaned subject strings, or nil if nothing found.
  def self.fetch_subjects(book)
    subjects = nil

    if book.isbn.present?
      subjects = fetch_by_isbn(book.isbn)
    end

    if subjects.blank? && book.title.present?
      subjects = fetch_by_search(book.title, book.author&.name)
    end

    subjects.presence
  end

  # ── Private ────────────────────────────────────────────────────────────────

  def self.fetch_by_isbn(isbn)
    uri = URI("#{BASE_URL}/api/books?bibkeys=ISBN:#{isbn}&format=json&jscmd=data")
    response = get_json(uri)
    return nil unless response

    book_data = response["ISBN:#{isbn}"]
    return nil unless book_data

    raw = book_data['subjects']&.map { |s| s.is_a?(Hash) ? s['name'] : s.to_s } || []
    clean_subjects(raw)
  rescue => e
    Rails.logger.warn "OL ISBN lookup failed for #{isbn}: #{e.message}"
    nil
  end

  def self.fetch_by_search(title, author)
    query = [title, author].compact.join(' ')
    encoded = URI.encode_www_form_component(query)
    uri = URI("#{BASE_URL}/search.json?q=#{encoded}&limit=1&fields=subject,title,author_name")
    response = get_json(uri)
    return nil unless response

    doc = response['docs']&.first
    return nil unless doc

    raw = doc['subject'] || []
    clean_subjects(raw)
  rescue => e
    Rails.logger.warn "OL search failed for '#{title}': #{e.message}"
    nil
  end

  # Remove noise: strip "-- Fiction" suffixes, skip junk terms, deduplicate.
  # Keep at most 10 subjects so we don't bloat the categories column.
  def self.clean_subjects(subjects)
    cleaned = subjects
      .map    { |s| s.gsub(/\s*--\s*.+$/, '').strip }   # "Mars -- Fiction" → "Mars"
      .map    { |s| s.gsub(/\s*\(.+\)$/, '').strip }     # "Weir, Andy (Fictitious)" → strip
      .reject { |s| s.length < 3 }
      .reject { |s| SKIP_SUBJECTS.any? { |skip| s.downcase.include?(skip) } }
      .uniq
      .first(12)

    cleaned.presence
  end

  def self.get_json(uri)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 8
    http.read_timeout = 10

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'WellRead/1.0 (book tracking app)'

    response = http.request(request)
    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue => e
    Rails.logger.warn "OL HTTP error: #{e.message}"
    nil
  end
end
