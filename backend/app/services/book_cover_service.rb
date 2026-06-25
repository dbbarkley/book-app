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

    # Last resort: Serper image search (Google Images via API)
    cover_data = try_image_search
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

  private

  def try_open_library
    # Try ISBN13 first, then ISBN10
    isbn = @book.isbn
    return nil if isbn.blank?

    # Open Library supports multiple sizes: S, M, L
    # We use L for best quality
    url = "#{OPEN_LIBRARY_BASE}/isbn/#{isbn}-L.jpg"
    
    # Check if cover exists by making a HEAD request
    if cover_exists?(url)
      # Open Library L size is typically high quality
      return {
        url: url,
        quality: HIGH_QUALITY,
        source: 'open_library'
      }
    end

    nil
  rescue StandardError => e
    Rails.logger.error("Open Library cover fetch failed for book #{@book.id}: #{e.message}")
    nil
  end

  def try_google_books
    # Search by ISBN or title+author
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

    # Google Books provides different sizes, prefer larger ones
    cover_url = image_links['large'] || 
                image_links['medium'] || 
                image_links['thumbnail']
    
    return nil unless cover_url

    cover_url = cover_url
      .gsub('zoom=1', 'zoom=0')
      .gsub('&edge=curl', '')
      .gsub('http://', 'https://')
    
    # Estimate quality based on which size we got
    quality = if image_links['large']
                HIGH_QUALITY
              elsif image_links['medium']
                MEDIUM_QUALITY
              else
                LOW_QUALITY
              end

    # Google Books provides categories/genres and page count
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

  def try_image_search
    return nil unless ENV['SERPER_API_KEY'].present?

    query = "\"#{@book.title}\" \"#{@book.author.name}\" book cover"

    uri  = URI('https://google.serper.dev/images')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 8
    http.read_timeout = 12

    req = Net::HTTP::Post.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    req['X-API-KEY']    = ENV['SERPER_API_KEY']
    req.body            = { q: query, num: 5 }.to_json

    resp = http.request(req)
    return nil unless resp.is_a?(Net::HTTPSuccess)

    images = JSON.parse(resp.body)['images'] || []
    return nil if images.empty?

    # Prefer portrait-oriented results — book covers are taller than wide
    portrait = images.select { |img| img['imageHeight'].to_i > img['imageWidth'].to_i }
    candidates = portrait.any? ? portrait : images

    url = candidates.first&.dig('imageUrl')
    return nil unless url.present?

    Rails.logger.info("[BookCoverService] book=#{@book.id}: using image search result #{url}")
    { url: url, quality: HIGH_QUALITY, source: 'image_search' }
  rescue StandardError => e
    Rails.logger.warn("[BookCoverService] Serper image search failed for book #{@book.id}: #{e.message}")
    nil
  end
end

