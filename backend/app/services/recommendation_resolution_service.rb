class RecommendationResolutionService < BaseService
  def initialize(user, llm_output)
    @user = user
    @llm_output = llm_output
  end

  def call
    # Process books
    (@llm_output[:books] || []).each do |book_data|
      resolve_book(book_data)
    end

    # Process authors
    (@llm_output[:authors] || []).each do |author_data|
      resolve_author(author_data)
    end
  end

  private

  def resolve_book(data)
    author_name = data["author"]
    title = data["title"]
    reason = data["reason"]

    return if author_name.blank? || title.blank?

    # Normalize and find author
    author = Author.where("name ILIKE ?", author_name).first
    book = nil

    if author
      book = Book.where("title ILIKE ? AND author_id = ?", title, author.id).first
    end

    # If not found, search Google Books
    if book.nil?
      book = find_on_google_books(title, author_name)
    end

    return if book.nil?

    # Create recommendation
    Recommendation.find_or_create_by!(
      user: @user,
      recommendable: book
    ) do |r|
      r.reason = reason
      r.source = "llm_v1"
      r.score = 1.0
    end
  end

  def resolve_author(data)
    name = data["name"]
    reason = data["reason"]

    return if name.blank?

    author = Author.where("name ILIKE ?", name).first

    if author.nil?
      author = find_author_on_google_books(name)
    end

    return if author.nil?

    Recommendation.find_or_create_by!(
      user: @user,
      recommendable: author
    ) do |r|
      r.reason = reason
      r.source = "llm_v1"
      r.score = 1.0
    end
  end

  def find_on_google_books(title, author_name)
    query = "intitle:#{title} inauthor:#{author_name}"
    uri = URI("https://www.googleapis.com/books/v1/volumes?q=#{URI.encode_www_form_component(query)}&maxResults=1")
    
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil if data['totalItems'].to_i.zero? || data['items'].blank?

    volume = data['items'].first
    v_info = volume['volumeInfo']

    # Find or create author
    # Try to use the canonical name from Google Books if available
    gb_author_name = v_info['authors']&.first || author_name
    author = Author.find_or_create_by!(name: gb_author_name)
    
    # Create book
    book = Book.find_or_create_by!(google_books_id: volume['id']) do |b|
      b.title = v_info['title']
      b.author = author
      b.description = v_info['description']
      b.cover_image_url = v_info.dig('imageLinks', 'thumbnail')&.gsub('http://', 'https://')
      b.release_date = v_info['publishedDate'] ? parse_date(v_info['publishedDate']) : Date.current
      b.isbn = v_info.dig('industryIdentifiers')&.find { |id| id['type'] == 'ISBN_13' }&.dig('identifier') ||
               v_info.dig('industryIdentifiers')&.find { |id| id['type'] == 'ISBN_10' }&.dig('identifier')
      b.categories = v_info['categories'] || []
    end

    # Enrich with better covers (e.g. Open Library) immediately
    BookCoverService.new(book).enrich_cover! if book.isbn.present?
    
    book
  rescue StandardError => e
    Rails.logger.error("Failed to resolve book on Google Books: #{e.message}")
    nil
  end

  def find_author_on_google_books(name)
    query = "inauthor:#{name}"
    uri = URI("https://www.googleapis.com/books/v1/volumes?q=#{URI.encode_www_form_component(query)}&maxResults=1")
    
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil if data['totalItems'].to_i.zero? || data['items'].blank?

    # Create the author
    v_info = data['items'].first['volumeInfo']
    gb_author_name = v_info['authors']&.find { |a| a.downcase.include?(name.downcase) } || 
                    v_info['authors']&.first || 
                    name

    Author.find_or_create_by!(name: gb_author_name)
  rescue StandardError => e
    Rails.logger.error("Failed to resolve author on Google Books: #{e.message}")
    nil
  end

  def parse_date(date_str)
    # Google Books can return "2023", "2023-01", or "2023-01-01"
    if date_str =~ /^\d{4}$/
      Date.parse("#{date_str}-01-01")
    elsif date_str =~ /^\d{4}-\d{2}$/
      Date.parse("#{date_str}-01")
    else
      Date.parse(date_str)
    end
  rescue ArgumentError
    Date.current
  end
end

