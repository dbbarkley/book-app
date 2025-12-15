module Api
  module V1
    class UserBooksController < BaseController
      before_action :set_user_book, only: [:show, :update]

      # GET /api/v1/user/books
      def index
        user_books = current_user.user_books.includes(book: :author)
        
        # Filter by shelf if specified
        user_books = user_books.where(shelf: params[:shelf]) if params[:shelf].present?
        
        # Pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 100
        per_page = [per_page, 100].min
        
        total_count = user_books.count
        user_books = user_books.limit(per_page).offset((page - 1) * per_page)
        
        render json: {
          user_books: user_books.map { |ub| serialize_user_book(ub) },
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # GET /api/v1/user/books/:book_id
      def show
        render json: { user_book: serialize_user_book(@user_book) }, status: :ok
      end

      # POST /api/v1/user/books
      def create
        book_id = params[:book_id]
        shelf = params[:shelf]
        
        # Handle Google Books results (negative IDs)
        if book_id.to_i < 0
          # Create book from Google Books data
          book = find_or_create_book_from_google_books(params)
          book_id = book.id
        end

        # Check if user already has this book
        user_book = current_user.user_books.find_by(book_id: book_id)
        
        if user_book
          # Update existing shelf
          user_book.update!(shelf: shelf)
        else
          # Create new user_book
          user_book = current_user.user_books.create!(
            book_id: book_id,
            shelf: shelf,
            total_pages: params[:total_pages]
          )
        end

        render json: { user_book: serialize_user_book(user_book) }, status: :created
      end

      # PATCH /api/v1/user/books/:book_id
      def update
        update_params = user_book_params
        
        # Set timestamps for shelf changes
        if update_params[:shelf].present? && @user_book.shelf != update_params[:shelf]
          case update_params[:shelf]
          when 'reading'
            update_params[:started_at] ||= Time.current if @user_book.started_at.nil?
          when 'read'
            update_params[:finished_at] ||= Time.current if @user_book.finished_at.nil?
          end
        end

        @user_book.update!(update_params)
        render json: { user_book: serialize_user_book(@user_book) }, status: :ok
      end

      # POST /api/v1/user/books/:book_id/review
      def review
        @user_book = current_user.user_books.find_by!(book_id: params[:id])
        @user_book.update!(
          rating: params[:rating],
          review: params[:review]
        )
        render json: { user_book: serialize_user_book(@user_book) }, status: :ok
      end

      private

      def set_user_book
        @user_book = current_user.user_books.find_by!(book_id: params[:id])
      end

      def user_book_params
        params.require(:user_book).permit(
          :shelf,
          :pages_read,
          :total_pages,
          :completion_percentage,
          :rating,
          :review
        )
      end

      def find_or_create_book_from_google_books(google_books_data)
        # Check if book exists by ISBN or Google Books ID
        isbn = google_books_data[:isbn]
        google_books_id = google_books_data[:google_books_id]
        
        book = Book.find_by(isbn: isbn) if isbn.present?
        book ||= Book.find_by(google_books_id: google_books_id) if google_books_id.present?
        
        return book if book

        # Create author if doesn't exist
        author_name = google_books_data[:author_name] || 'Unknown Author'
        author = Author.find_or_create_by!(name: author_name) do |a|
          a.bio = google_books_data[:author_bio] if google_books_data[:author_bio].present?
        end

        # Create book
        Book.create!(
          title: google_books_data[:title],
          isbn: isbn,
          description: google_books_data[:description],
          cover_image_url: google_books_data[:cover_image_url],
          release_date: parse_release_date(google_books_data[:release_date]),
          author: author,
          google_books_id: google_books_id
        )
      end

      def parse_release_date(date_string)
        return Date.current if date_string.blank?
        
        # Google Books sometimes returns partial dates (e.g., "2020", "2020-05")
        case date_string.length
        when 4 # Year only
          Date.new(date_string.to_i, 1, 1)
        when 7 # Year-Month
          year, month = date_string.split('-').map(&:to_i)
          Date.new(year, month, 1)
        else
          Date.parse(date_string)
        end
      rescue
        Date.current
      end

      def serialize_user_book(user_book)
        {
          id: user_book.id,
          book_id: user_book.book_id,
          book: serialize_book(user_book.book),
          shelf: user_book.shelf,
          pages_read: user_book.pages_read,
          total_pages: user_book.total_pages,
          completion_percentage: user_book.completion_percentage,
          rating: user_book.rating,
          review: user_book.review,
          started_at: user_book.started_at,
          finished_at: user_book.finished_at,
          created_at: user_book.created_at,
          updated_at: user_book.updated_at
        }
      end

      def serialize_book(book)
        {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          author_name: book.author.name,
          google_books_id: book.google_books_id
        }
      end
    end
  end
end

