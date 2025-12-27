module Api
  module V1
    class UserBooksController < BaseController
      before_action :set_user_book, only: [:show, :update]

      # GET /api/v1/user/books
      def index
        user_books = current_user.user_books.includes(book: :author)

        status_filter = params[:status].presence || params[:shelf].presence
        user_books = user_books.where(status: status_filter) if status_filter.present?
        user_books = user_books.where(visibility: params[:visibility]) if params[:visibility].present?

        page = params[:page]&.to_i || 1
        parsed_per_page = params[:per_page]&.to_i
        per_page =
          if parsed_per_page.present? && parsed_per_page.positive?
            [parsed_per_page, 100].min
          end

        total_count = user_books.count
        if per_page
          user_books = user_books.limit(per_page).offset((page - 1) * per_page)
          pagination = {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        else
          pagination = nil
        end

      render json: {
        user_books: user_books.map { |ub| serialize_user_book(ub) },
        pagination: pagination
      }, status: :ok
      end

      # GET /api/v1/user/books/:id
      def show
        render json: { user_book: serialize_user_book(@user_book) }, status: :ok
      end

      # GET /api/v1/user/books/by_book/:book_id
      def show_by_book
        user_book = current_user.user_books.find_by(book_id: params[:book_id])
        return render_error('User book not found', status: :not_found) unless user_book

        render json: { user_book: serialize_user_book(user_book) }, status: :ok
      end

      # POST /api/v1/user/books
      def create
        book_id = params[:book_id]
        return render_error('Missing book_id') unless book_id.present?

        if book_id.to_i < 0
          book = find_or_create_book_from_google_books(params)
          book_id = book.id
        end

        status = normalize_status(params[:status] || params[:shelf]) || 'to_read'
        visibility = normalize_visibility(params[:visibility])

        user_book = current_user.user_books.find_or_initialize_by(book_id: book_id)
        user_book.assign_attributes(
          status: status,
          shelf: status,
          visibility: visibility,
          total_pages: params[:total_pages] || (user_book.book.respond_to?(:page_count) ? user_book.book.page_count : nil),
          dnf_reason: params[:dnf_reason],
          dnf_page: params[:dnf_page]
        )
        user_book.save!
        if user_book.saved_change_to_id? &&
             user_book.status == 'to_read' &&
             user_book.visibility == 'public'
          enqueue_user_book_activity(user_book, 'user_added_book')
        end

        render json: { user_book: serialize_user_book(user_book) }, status: :created
      end

      # PATCH /api/v1/user/books/:book_id
      def update
        update_params = user_book_params
        normalized_status = normalize_status(update_params[:status] || update_params[:shelf])
        if normalized_status.present?
          update_params[:status] = normalized_status
          update_params[:shelf] = normalized_status
        end

        if normalized_status.present? && normalized_status != @user_book.status
          case normalized_status
          when 'reading'
            update_params[:started_at] ||= Time.current if @user_book.started_at.nil?
          when 'read'
            update_params[:finished_at] ||= Time.current if @user_book.finished_at.nil?
          when 'dnf'
            update_params[:finished_at] = nil
          end
        end

        @user_book.update!(update_params)
        if @user_book.visibility == 'public' && @user_book.saved_change_to_status?
          case @user_book.status
          when 'read'
            enqueue_user_book_activity(@user_book, 'user_finished_book')
          when 'to_read'
            enqueue_user_book_activity(@user_book, 'user_added_book')
          end
        end
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
        @user_book = current_user.user_books.find(params[:id])
      end

      def user_book_params
        params.require(:user_book).permit(
          :status,
          :shelf,
          :visibility,
          :pages_read,
          :total_pages,
          :completion_percentage,
          :rating,
          :review,
          :dnf_reason,
          :dnf_page,
          :started_at,
          :finished_at
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
          google_books_id: google_books_id,
          page_count: google_books_data[:page_count],
          categories: google_books_data[:categories] || []
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
          status: user_book.status,
          shelf: user_book.shelf,
          visibility: user_book.visibility,
          pages_read: user_book.pages_read,
          total_pages: user_book.total_pages,
          completion_percentage: user_book.completion_percentage,
          rating: user_book.rating,
          review: user_book.review,
          dnf_reason: user_book.dnf_reason,
          dnf_page: user_book.dnf_page,
          started_at: user_book.started_at,
          finished_at: user_book.finished_at,
          created_at: user_book.created_at,
          updated_at: user_book.updated_at
        }
      end

      def enqueue_user_book_activity(user_book, activity_type)
        return unless user_book.visibility == 'public'

        GenerateUserActivityFeedItemsJob.perform_later(
          current_user.id,
          'UserBook',
          user_book.id,
          activity_type
        )
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
          google_books_id: book.google_books_id,
          page_count: book.respond_to?(:page_count) ? book.page_count : nil,
          categories: book.respond_to?(:categories) ? (book.categories || []) : []
        }
      end

      def normalize_status(value)
        return unless value.present?
        status = value.to_s
        UserBook::STATUSES.include?(status) ? status : nil
      end

      def normalize_visibility(value)
        visibility = value.to_s.presence
        return visibility if visibility && UserBook::VISIBILITIES.include?(visibility)
        UserBook::VISIBILITIES.first
      end

      def render_error(message, status: :unprocessable_entity)
        render json: { errors: [message] }, status: status
      end
    end
  end
end

