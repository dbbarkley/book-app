# frozen_string_literal: true

require 'net/http'
require 'uri'

# BookCoverService - Finds and enriches book covers from multiple sources
#
# Priority order:
# 1. Google Books API (consistent look, zoom=0 ~512px)
# 2. Open Library Covers API (fallback, free, no key required)
# 3. Returns nil for frontend to show placeholder
#
# Quality scoring:
# - 10: High resolution (>= 500px width)
# - 5: Medium resolution (200-499px)
# - 1: Low resolution (< 200px)
# - 0: No cover found
class BookCoverService
  OPEN_LIBRARY_BASE = 'https://covers.openlibrary.org/b'
  GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes'
  
  # Quality thresholds
  HIGH_QUALITY = 10
  MEDIUM_QUALITY = 5
  LOW_QUALITY = 1
  NO_COVER = 0

  def initialize(book)
    @book = book
  end

  # Find the best cover from all sources
  def find_best_cover
    # Try Google Books first (consistent look, zoom=0 ~512px)
    cover_data = try_google_books
    return cover_data if cover_data

    # Fallback to Open Library
    cover_data = try_open_library
    return cover_data if cover_data

    { url: nil, quality: NO_COVER, source: 'none' }
  end

  # Update book with the best cover and metadata found
  def enrich_cover!
    best_data = find_best_cover
    
    update_attrs = {
      cover_image_url: best_data[:url],
      cover_image_quality: best_data[:quality],
      cover_image_source: best_data[:source],
      cover_last_enriched_at: Time.current
    }

    # Also update categories and page_count if they were found in Google Books
    if best_data[:categories].present? && @book.respond_to?(:categories) && @book.categories.blank?
      update_attrs[:categories] = best_data[:categories]
    end

    if best_data[:page_count].present? && @book.respond_to?(:page_count) && @book.page_count.blank?
      update_attrs[:page_count] = best_data[:page_count]
    end

    @book.update!(update_attrs)
    
    best_data
  end

  # Check if book needs enrichment
  def needs_enrichment?
    return false if @book.cover_storage_path.present?
    return true if @book.cover_storage_path.blank?
    return true if @book.cover_image_url.blank?
    return true if @book.respond_to?(:categories)  && @book.categories.blank?
    return true if @book.respond_to?(:page_count)  && @book.page_count.blank?
    return true if @book.cover_image_quality.to_i < MEDIUM_QUALITY
    return true if @book.cover_last_enriched_at.blank? ||
                   @book.cover_last_enriched_at < 30.days.ago
    false
  end

  # Returns [url, data, content_type] by trying each Serper candidate in order,
  # skipping CloudFront URLs (require auth cookies). Accepts the downloader so
  # it can call fetch without duplicating HTTP logic.
  def try_image_search_download(downloader)
    candidates = serper_candidates
    return [nil, nil, nil] if candidates.nil?

    candidates.each do |img|
      url = img['imageUrl']
      next unless url.present?

      if url.include?('cloudfront.net')
        Rails.logger.info("[Serper] book=#{@book.id}: skipping CloudFront url=#{url}")
        next
      end

      data, content_type = downloader.send(:fetch, url)
      if data
        Rails.logger.info("[Serper] book=#{@book.id}: success source=#{img['source']} url=#{url}")
        return [url, data, content_type]
      else
        Rails.logger.info("[Serper] book=#{@book.id}: fetch failed, trying next — url=#{url}")
      end
    end

    Rails.logger.warn("[Serper] book=#{@book.id}: all candidates failed")
    [nil, nil, nil]
  end

  # Returns the Serper URL only (used as fallback URL source in find_best_cover context).
  def try_image_search
    candidates = serper_candidates
    return nil if candidates.nil?

    url = candidates.reject { |img| img['imageUrl'].to_s.include?('cloudfront.net') }
                    .first&.dig('imageUrl')
    return nil unless url.present?

    { url: url, quality: HIGH_QUALITY, source: 'image_search' }
  end

  def try_open_library
    isbn = @book.isbn
    return nil if isbn.blank?

    url = "#{OPEN_LIBRARY_BASE}/isbn/#{isbn}-L.jpg"

    if cover_exists?(url)
      return { url: url, quality: HIGH_QUALITY, source: 'open_library' }
    end

    nil
  rescue StandardError => e
    Rails.logger.error("Open Library cover fetch failed for book #{@book.id}: #{e.message}")
    nil
  end

  def try_google_books
    query = if @book.isbn.present?
              "isbn:#{@book.isbn}"
            else
              "intitle:#{@book.title}+inauthor:#{@book.author.name}"
            end

    key = ENV['GOOGLE_BOOKS_API_KEY']
    api_key_param = key.present? ? "&key=#{key}" : ''
    uri = URI("#{GOOGLE_BOOKS_BASE}?q=#{URI.encode_www_form_component(query)}&maxResults=1#{api_key_param}")

    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil if data['totalItems'].to_i.zero?

    volume = data['items']&.first
    image_links = volume&.dig('volumeInfo', 'imageLinks')
    return nil unless image_links

    cover_url = image_links['large'] ||
                image_links['medium'] ||
                image_links['thumbnail']
    return nil unless cover_url

    cover_url = cover_url
      .gsub('zoom=1', 'zoom=0')
      .gsub('&edge=curl', '')
      .gsub('http://', 'https://')

    quality = if image_links['large']
                HIGH_QUALITY
              elsif image_links['medium']
                MEDIUM_QUALITY
              else
                LOW_QUALITY
              end

    categories = volume&.dig('volumeInfo', 'categories') || []
    page_count = volume&.dig('volumeInfo', 'pageCount')

    {
      url:        cover_url,
      quality:    quality,
      source:     'google_books',
      categories: categories,
      page_count: page_count,
    }
  rescue StandardError => e
    Rails.logger.error("Google Books cover fetch failed for book #{@book.id}: #{e.message}")
    nil
  end

  private

  # Domains that reliably serve clean, flat book cover art
  COVER_DOMAINS = %w[
    m.media-amazon.com
    images-na.ssl-images-amazon.com
    i.gr-assets.com
    images.gr-assets.com
    s.gr-assets.com
    images.isbndb.com
    books.google.com
    covers.openlibrary.org
    cdn.waterstones.com
    images.penguinrandomhouse.com
    harpercollins.com
    simonandschuster.com
    macmillan.com
    bloomsbury.com
  ].freeze

  # Domains that often return lifestyle/photo-of-book results — skip entirely
  BLOCKED_DOMAINS = %w[
    instagram.com
    pinterest.com
    tumblr.com
    twitter.com
    x.com
    facebook.com
    reddit.com
    tiktok.com
    youtube.com
  ].freeze

  def serper_candidates
    unless ENV['SERPER_API_KEY'].present?
      Rails.logger.warn("[Serper] book=#{@book.id}: SERPER_API_KEY not set")
      return nil
    end

    # "book cover" at the end signals we want the flat art, not a photo of the book
    query = "\"#{@book.title}\" \"#{@book.author.name}\" book cover"
    Rails.logger.info("[Serper] book=#{@book.id} (#{@book.title.inspect}): querying — #{query}")

    uri  = URI('https://google.serper.dev/images')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 8
    http.read_timeout = 12

    req = Net::HTTP::Post.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    req['X-API-KEY']    = ENV['SERPER_API_KEY']
    req.body            = { q: query, num: 10 }.to_json

    resp = http.request(req)
    unless resp.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("[Serper] book=#{@book.id}: HTTP #{resp.code}")
      return nil
    end

    images = JSON.parse(resp.body)['images'] || []
    Rails.logger.info("[Serper] book=#{@book.id}: #{images.size} results returned")

    if images.empty?
      Rails.logger.warn("[Serper] book=#{@book.id}: no results for — #{query}")
      return nil
    end

    scored = images
      .reject { |img| blocked?(img['imageUrl']) }
      .reject { |img| img['imageUrl'].to_s.include?('cloudfront.net') }
      .map    { |img| [img, cover_score(img)] }
      .sort_by { |_, score| -score }

    scored.each do |img, score|
      Rails.logger.info("[Serper] book=#{@book.id}: score=#{score} title=#{img['title'].inspect} url=#{img['imageUrl']}")
      puts "[Serper] book=#{@book.id}: score=#{score} w=#{img['imageWidth']} h=#{img['imageHeight']} title=#{img['title'].inspect} url=#{img['imageUrl']}"
    end
    Rails.logger.info("[Serper] book=#{@book.id}: #{scored.size} candidates after filtering")

    scored.empty? ? nil : scored.map(&:first)
  rescue StandardError => e
    Rails.logger.warn("[Serper] book=#{@book.id}: request failed — #{e.message}")
    nil
  end

  def blocked?(url)
    host = URI.parse(url.to_s).host.to_s
    BLOCKED_DOMAINS.any? { |d| host.include?(d) }
  rescue URI::InvalidURIError
    true
  end

  # Title/alt keywords that strongly suggest clean flat cover art
  COVER_TITLE_SIGNALS = %w[cover paperback hardcover edition jacket artwork art].freeze

  # Title keywords that suggest a lifestyle photo of the book, not the flat art
  PHOTO_TITLE_SIGNALS = %w[reading unboxing haul stack bookshelf shelf review photo
                            holding aesthetic bookstagram tbr wrap].freeze

  # Higher score = more likely to be a clean flat cover image.
  def cover_score(img)
    url   = img['imageUrl'].to_s
    host  = URI.parse(url).host.to_s rescue ''
    title = "#{img['title']} #{img['imageUrl']}".downcase
    w     = img['imageWidth'].to_i
    h     = img['imageHeight'].to_i

    score = 0

    # Trusted cover-art CDNs
    score += 20 if COVER_DOMAINS.any? { |d| host.end_with?(d) }

    # Title/alt signals
    score += 15 if COVER_TITLE_SIGNALS.any? { |kw| title.include?(kw) }
    score -= 20 if PHOTO_TITLE_SIGNALS.any? { |kw| title.include?(kw) }

    # Book covers are typically 0.58–0.72 wide relative to height (e.g. 6"×9")
    if h > 0
      ratio = w.to_f / h
      score += 15 if ratio.between?(0.58, 0.72)
      score += 5  if ratio.between?(0.5, 0.8) && !ratio.between?(0.58, 0.72)
      score -= 15 if ratio > 0.9  # too square or wide — likely a photo of the physical book
    end

    score
  end

  def cover_exists?(url)
    uri = URI(url)
    request = Net::HTTP::Head.new(uri)
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end
    
    # Open Library returns 200 for found covers, 404 for not found.
    # However, sometimes they return a 200 with a "not found" tiny image.
    # A real cover is usually > 1000 bytes.
    return false unless response.is_a?(Net::HTTPSuccess)
    
    # If it's a HEAD request, check content-length
    content_length = response['content-length'].to_i
    return false if content_length > 0 && content_length < 1000
    
    true
  rescue StandardError
    false
  end

end

