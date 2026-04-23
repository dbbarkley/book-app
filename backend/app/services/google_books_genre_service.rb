require 'net/http'
require 'json'

# Fetches genre/category data directly from the Google Books API.
#
# Strategy:
#   1. Direct volume lookup by google_books_id — richest category data
#      (slash-separated strings like "Fiction / Science Fiction / Space Opera")
#   2. ISBN search fallback
#   3. Title + author search fallback
#
# Returns { categories: [...], google_books_id: "..." } or nil.
# The caller should also persist google_books_id so future lookups skip the search.
#
# A result is considered "rich" only if it contains at least one non-vague category.
# Bare ["Fiction"] / ["Nonfiction"] are treated as no-data so the next pipeline
# tier can try.
#
# Usage:
#   result = GoogleBooksGenreService.fetch_genres(book)
#   # => { categories: ["Fiction / Science Fiction / Space Opera"], google_books_id: "buc0AAAAMAAJ" }
#
class GoogleBooksGenreService
  BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

  # Standalone tags that carry no sub-genre signal.
  # We keep them as part of richer strings ("Fiction / Science Fiction") but
  # reject results that consist *only* of these bare labels.
  VAGUE_ONLY = %w[fiction nonfiction non-fiction].freeze

  # Returns an array of category strings, or nil if nothing rich was found.
  # As a side-effect, stores google_books_id on the book record if it was missing.
  def self.fetch_genres(book)
    result, _reason = fetch_result_with_reason(book)
    return nil unless result

    # Backfill google_books_id so future lookups use the fast direct-volume path
    if result[:google_books_id].present? && book.google_books_id.blank?
      book.update_column(:google_books_id, result[:google_books_id])
    end

    result[:categories].presence
  end

  # Like fetch_genres but also returns a human-readable reason string for diagnostics.
  # Returns [result_or_nil, reason_string]
  #
  #   result, reason = GoogleBooksGenreService.fetch_genres_with_reason(book)
  #   # reason => "found (ISBN) — vague only: [\"Fiction\"]"
  #   # reason => "found (ISBN) — ✓ rich"
  #   # reason => "not in Google Books"
  #
  def self.fetch_genres_with_reason(book)
    result, reason = fetch_result_with_reason(book)

    if result
      if result[:google_books_id].present? && book.google_books_id.blank?
        book.update_column(:google_books_id, result[:google_books_id])
      end
      [result[:categories].presence, reason]
    else
      [nil, reason]
    end
  end

  # ── Internal ─────────────────────────────────────────────────────────────────

  def self.fetch_result_with_reason(book)
    # 1. Direct volume lookup by stored ID — returns full metadata
    if book.google_books_id.present?
      item = get_json("#{BASE_URL}/#{book.google_books_id}")
      result, reason = parse_item_with_reason(item, 'volume ID')
      return [result, reason] if result || reason&.include?('vague') || reason&.include?('no categories')
    end

    # 2. ISBN search — NOTE: search endpoint returns a "lite" projection that
    #    often strips category detail down to just ["Fiction"]. If we get a
    #    vague result, re-fetch the same volume directly before giving up.
    if book.isbn.present?
      clean_isbn = book.isbn.gsub(/[^0-9X]/i, '')
      data       = get_json("#{BASE_URL}?q=isbn:#{clean_isbn}&maxResults=1")
      search_item = data&.dig('items', 0)

      if search_item
        result, reason = parse_item_with_reason(search_item, 'ISBN')
        if result
          return [result, reason]
        elsif search_item['id'].present?
          # Got a vague/empty result from the search projection — try the full volume endpoint
          full_item = get_json("#{BASE_URL}/#{search_item['id']}")
          result, reason = parse_item_with_reason(full_item, 'ISBN→volume')
          return [result, reason] if result || reason&.include?('vague') || reason&.include?('no categories')
        end
      end
    end

    # 3. Title + author search — same lite-projection issue; re-fetch if needed
    if book.title.present?
      query   = "intitle:#{book.title}"
      query  += "+inauthor:#{book.author&.name}" if book.author&.name.present?
      encoded = URI.encode_www_form_component(query)
      data    = get_json("#{BASE_URL}?q=#{encoded}&maxResults=1")
      search_item = data&.dig('items', 0)

      if search_item
        result, reason = parse_item_with_reason(search_item, 'title search')
        if result
          return [result, reason]
        elsif search_item['id'].present?
          full_item = get_json("#{BASE_URL}/#{search_item['id']}")
          result, reason = parse_item_with_reason(full_item, 'title→volume')
          return [result, reason] if result || reason&.include?('vague') || reason&.include?('no categories')
        end
      end
    end

    [nil, 'not in Google Books']
  rescue RateLimitError => e
    Rails.logger.warn "GoogleBooksGenreService rate limited: #{e.message}"
    [nil, "rate limited — #{e.message}"]
  rescue => e
    Rails.logger.warn "GoogleBooksGenreService error for '#{book.title}': #{e.message}"
    [nil, "error: #{e.message}"]
  end

  # Returns [result_or_nil, reason_string]
  def self.parse_item_with_reason(item, via)
    return [nil, nil] unless item

    volume_id = item['id']
    info      = item['volumeInfo'] || {}
    raw       = Array(info['categories']).map(&:strip).reject(&:empty?)

    if raw.empty?
      return [nil, "found (#{via}) — no categories stored"]
    end

    rich = raw.reject { |c| VAGUE_ONLY.include?(c.downcase) }
    unless rich.any?
      return [nil, "found (#{via}) — vague only: #{raw.inspect}"]
    end

    [{ categories: raw, google_books_id: volume_id }, "found (#{via}) — ✓ rich"]
  end

  def self.append_api_key(url)
    key = ENV['GOOGLE_BOOKS_API_KEY']
    return url if key.blank?
    separator = url.include?('?') ? '&' : '?'
    "#{url}#{separator}key=#{key}"
  end

  def self.get_json(url)
    uri  = URI(append_api_key(url))
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 15

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'Libraio/1.0 (book tracking app; contact@libraio.app)'

    response = http.request(request)

    if response.code == '429'
      retry_after = response['Retry-After']&.to_i || 60
      raise RateLimitError, "rate limited (retry after #{retry_after}s)"
    end

    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue RateLimitError
    raise  # let callers handle it explicitly
  rescue => e
    Rails.logger.warn "GoogleBooksGenreService HTTP error: #{e.message}"
    nil
  end

  class RateLimitError < StandardError; end
end
