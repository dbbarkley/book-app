module Api
  module V1
    class BooksController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show]

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
        render json: { book: serialize_book_detail(book) }, status: :ok
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
          followers_count: book.followers.count
        }
      end
    end
  end
end

