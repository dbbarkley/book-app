require 'net/http'
require 'json'

class BookEnrichmentService < BaseService
  GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes'

  def self.enrich_book(book)
    return if book.page_count.present? && book.categories.present?

    # Try searching by Google Books ID first
    if book.google_books_id.present?
      data = fetch_by_id(book.google_books_id)
    end

    # Fallback to ISBN
    if data.nil? && book.isbn.present?
      data = fetch_by_isbn(book.isbn)
    end

    # Fallback to Title/Author
    if data.nil?
      data = fetch_by_title_author(book.title, book.author&.name)
    end

    return if data.nil?

    # Update book with missing info
    updates = {}
    updates[:page_count] = data[:page_count] if book.page_count.blank? && data[:page_count].present?
    updates[:categories] = data[:categories] if book.categories.blank? && data[:categories].present?
    updates[:description] = data[:description] if book.description.blank? && data[:description].present?
    updates[:google_books_id] = data[:google_books_id] if book.google_books_id.blank? && data[:google_books_id].present?

    book.update(updates) if updates.any?
  end

  def self.enrich_all_books
    Book.where(page_count: nil).find_each do |book|
      enrich_book(book)
      sleep(0.5) # Avoid rate limiting
    end
  end

  private

  def self.fetch_by_id(google_books_id)
    url = "#{GOOGLE_BOOKS_API_BASE}/#{google_books_id}"
    response = get_json(url)
    parse_volume(response) if response
  end

  def self.fetch_by_isbn(isbn)
    url = "#{GOOGLE_BOOKS_API_BASE}?q=isbn:#{isbn}"
    response = get_json(url)
    return nil unless response && response['items']&.any?
    
    parse_volume(response['items'].first)
  end

  def self.fetch_by_title_author(title, author_name)
    query = "intitle:#{title}"
    query += "+inauthor:#{author_name}" if author_name.present?
    url = "#{GOOGLE_BOOKS_API_BASE}?q=#{URI.encode_www_form_component(query)}&maxResults=1"
    
    response = get_json(url)
    return nil unless response && response['items']&.any?
    
    parse_volume(response['items'].first)
  end

  def self.get_json(url)
    uri = URI(url)
    response = Net::HTTP.get(uri)
    JSON.parse(response)
  rescue => e
    Rails.logger.error "[BookEnrichmentService] Error fetching data: #{e.message}"
    nil
  end

  def self.parse_volume(item)
    return nil unless item && item['volumeInfo']
    
    info = item['volumeInfo']
    {
      google_books_id: item['id'],
      page_count: info['pageCount'],
      categories: info['categories'],
      description: info['description']
    }
  end
end

