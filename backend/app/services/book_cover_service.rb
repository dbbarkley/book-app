# frozen_string_literal: true

require 'net/http'
require 'uri'

# BookCoverService - Finds and enriches book covers from multiple sources
#
# Priority order:
# 1. Open Library Covers API (best quality, free, no key required)
# 2. Google Books API (good coverage)
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
    # Try Open Library first (best quality)
    cover_data = try_open_library
    return cover_data if cover_data

    # Fallback to Google Books
    cover_data = try_google_books
    return cover_data if cover_data

    # No cover found
    { url: nil, quality: NO_COVER, source: 'none' }
  end

  # Update book with the best cover found
  def enrich_cover!
    cover_data = find_best_cover
    
    @book.update!(
      cover_image_url: cover_data[:url],
      cover_image_quality: cover_data[:quality],
      cover_image_source: cover_data[:source],
      cover_last_enriched_at: Time.current
    )
    
    cover_data
  end

  # Check if book needs cover enrichment
  def needs_enrichment?
    # No cover at all
    return true if @book.cover_image_url.blank?
    
    # Low quality cover
    return true if @book.cover_image_quality.to_i < MEDIUM_QUALITY
    
    # Haven't enriched in 30 days
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

    uri = URI("#{GOOGLE_BOOKS_BASE}?q=#{URI.encode_www_form_component(query)}&maxResults=1")
    
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

    # Replace http with https for security
    cover_url = cover_url.gsub('http://', 'https://')
    
    # Estimate quality based on which size we got
    quality = if image_links['large']
                HIGH_QUALITY
              elsif image_links['medium']
                MEDIUM_QUALITY
              else
                LOW_QUALITY
              end

    {
      url: cover_url,
      quality: quality,
      source: 'google_books'
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
    
    # Open Library returns 200 for found covers, 404 for not found
    response.is_a?(Net::HTTPSuccess)
  rescue StandardError
    false
  end
end

