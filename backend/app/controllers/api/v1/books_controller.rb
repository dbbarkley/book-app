module Api
  module V1
    class BooksController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show, :show_by_google]

      def index
        books = Book.includes(:author).all

        # Support search query parameter (searches title, author name, and ISBN)
        if params[:query].present?
          query = params[:query].downcase
          # Use joins for the WHERE clause, but keep includes for eager loading
          books = books.includes(:author).joins(:author).where(
            "LOWER(books.title) LIKE ? OR LOWER(authors.name) LIKE ? OR LOWER(books.isbn) LIKE ?",
            "%#{query}%",
            "%#{query}%",
            "%#{query}%"
          )
        end

        books = books.upcoming if params[:upcoming] == 'true'
        books = books.by_author(params[:author_id]) if params[:author_id].present?
        books = books.where(release_date: params[:release_date]) if params[:release_date].present?

        books = books.order(release_date: :desc)

        # Support pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min # Cap at 100

        total_count = books.count
        books = books.limit(per_page).offset((page - 1) * per_page)

        render json: {
          books: serialize_books(books),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      def show
        book = Book.includes(:author).find(params[:id])
        backfill_description(book)
        render json: { book: serialize_book_detail(book) }, status: :ok
      end

      # GET /api/v1/books/by_google/:google_books_id
      # Looks up in DB first; if not found, fetches live from Google Books API.
      # Returns id: nil when the book isn't in our DB yet (browse-only mode).
      def show_by_google
        google_books_id = params[:google_books_id]

        # Allowlist: Google Books IDs are alphanumeric + underscores/hyphens (8-20 chars).
        # OL IDs use our "ol_OL..." prefix convention. Reject anything outside this set.
        unless google_books_id.match?(/\A(ol_)?[a-zA-Z0-9_\-]{2,40}\z/)
          return render json: { error: 'Invalid book ID' }, status: :bad_request
        end

        # DB hit first — most common path after a book has been added to any shelf
        book = Book.includes(:author).find_by(google_books_id: google_books_id)
        if book
          backfill_description(book)
          render json: { book: serialize_book_detail(book) }, status: :ok
          return
        end

        # Live fallback — fetch directly from Google Books API
        book_data = fetch_google_book(google_books_id)
        if book_data
          render json: { book: book_data }, status: :ok
        else
          render json: { error: 'Book not found' }, status: :not_found
        end
      end

      # GET /api/v1/books/:id/friends
      def friends
        book = Book.find(params[:id])
        
        # Get users that the current user follows who also have this book
        # Note: In a real app, you might want to filter by shelf status or visibility
        friend_ids = current_user.followed_users.pluck(:id)
        
        user_books = UserBook.includes(:user)
                             .where(book_id: book.id, user_id: friend_ids, visibility: 'public')
                             .limit(10)

        render json: {
          friends: user_books.map { |ub| 
            {
              id: ub.user.id,
              username: ub.user.username,
              display_name: ub.user.display_name,
              avatar_url: ub.user.avatar_url_with_attachment,
              status: ub.status
            }
          }
        }, status: :ok
      end

      private

      # Backfill a missing description from whichever source makes sense.
      # OL books (google_books_id starts with "ol_") don't have a direct Google
      # Books volume ID, so we search Google Books by title + author instead.
      def backfill_description(book)
        return unless book.description.blank?

        description =
          if book.google_books_id&.start_with?('ol_')
            fetch_description_via_google_search(book)
          elsif book.google_books_id.present?
            fetch_google_book(book.google_books_id)&.dig(:description)
          else
            fetch_description_via_google_search(book)
          end

        if description.present?
          book.update_column(:description, description)
          book.reload
        end
      end

      # For OL-sourced books (google_books_id starts with "ol_"), search Google Books
      # by title + author to get a description. This is more reliable than the OL
      # works API, which has sparse/missing descriptions for many books.
      def fetch_description_via_google_search(book)
        return nil if book.title.blank?

        author  = book.author&.name.presence || ''
        query   = author.present? ? "intitle:#{book.title} inauthor:#{author}" : "intitle:#{book.title}"
        key     = ENV['GOOGLE_BOOKS_API_KEY']
        params  = "q=#{URI.encode_www_form_component(query)}&maxResults=1&printType=books"
        params += "&key=#{key}" if key.present?

        uri  = URI("https://www.googleapis.com/books/v1/volumes?#{params}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl    = true
        http.open_timeout = 5
        http.read_timeout = 10

        response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless response.is_a?(Net::HTTPSuccess)

        data  = JSON.parse(response.body)
        first = data.dig('items', 0, 'volumeInfo') || {}
        strip_html(first['description'])
      rescue => e
        Rails.logger.error("Google Books title-search description error for #{book.title}: #{e.message}")
        nil
      end

      # Fetch a single volume from the Google Books API by its volume ID.
      # Returns a hash shaped like serialize_book_detail (with id: nil) or nil on failure.
      def fetch_google_book(google_books_id)
        key = ENV['GOOGLE_BOOKS_API_KEY']
        api_key_param = key.present? ? "?key=#{key}" : ''
        uri = URI("https://www.googleapis.com/books/v1/volumes/#{URI.encode_www_form_component(google_books_id)}#{api_key_param}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 10

        response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless response.is_a?(Net::HTTPSuccess)

        data = JSON.parse(response.body)
        v = data['volumeInfo'] || {}
        image_links = v['imageLinks'] || {}
        identifiers = Array(v['industryIdentifiers'])

        {
          id: nil,
          google_books_id: google_books_id,
          title: v['title'] || 'Unknown Title',
          isbn: identifiers.find { |i| i['type'] == 'ISBN_13' }&.dig('identifier') ||
                identifiers.find { |i| i['type'] == 'ISBN_10' }&.dig('identifier'),
          description: strip_html(v['description']),
          cover_image_url: image_links['thumbnail'] || image_links['smallThumbnail'],
          release_date: v['publishedDate'],
          page_count: v['pageCount'],
          author_name: Array(v['authors']).first || 'Unknown Author',
          author: nil,
          followers_count: 0,
          categories: Array(v['categories']),
        }
      rescue => e
        Rails.logger.error("Google Books API error for #{google_books_id}: #{e.message}")
        nil
      end

      # Strip HTML tags and decode common entities from Google Books descriptions.
      def strip_html(text)
        return nil if text.blank?
        text
          .gsub(/<br\s*\/?>/i, "\n")
          .gsub(/<[^>]+>/, '')
          .gsub(/&amp;/, '&')
          .gsub(/&lt;/, '<')
          .gsub(/&gt;/, '>')
          .gsub(/&quot;/, '"')
          .gsub(/&#39;/, "'")
          .gsub(/&nbsp;/, ' ')
          .strip
          .presence
      end

      def serialize_books(books)
        books.map { |book| serialize_book(book) }
      end

      def serialize_book(book)
        {
          id: book.id,
          title: book.title,
          author_name: book.author.name,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          page_count: book.respond_to?(:page_count) ? book.page_count : nil
        }
      end

      def serialize_book_detail(book)
        {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          page_count: book.respond_to?(:page_count) ? book.page_count : nil,
          author: {
            id: book.author.id,
            name: book.author.name,
            avatar_url: book.author.avatar_url
          },
          followers_count: book.followers.count,
          categories: book.categories
        }
      end
    end
  end
end

