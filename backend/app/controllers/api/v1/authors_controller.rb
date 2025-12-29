module Api
  module V1
    class AuthorsController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show]

      def index
        authors = Author.all.order(:name)
        
        # Support search query parameter
        if params[:query].present?
          query = params[:query].downcase
          authors = authors.where(
            "LOWER(name) LIKE ? OR LOWER(bio) LIKE ?",
            "%#{query}%",
            "%#{query}%"
          )
        end
        
        # Support pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min # Cap at 100
        
        total_count = authors.count
        authors = authors.limit(per_page).offset((page - 1) * per_page)
        
        render json: {
          authors: serialize_authors(authors),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      def show
        author = Author.find(params[:id])
        render json: serialize_author_detail(author), status: :ok
      end

      # POST /api/v1/authors
      # Create a new author (e.g., when importing from Google Books)
      def create
        # Check if author already exists by name
        existing_author = Author.find_by('LOWER(name) = ?', author_params[:name].downcase)
        
        if existing_author
          render json: { author: serialize_author(existing_author) }, status: :ok
          return
        end

        # Create new author
        author = Author.new(author_params)
        
        if author.save
          render json: { author: serialize_author(author) }, status: :created
        else
          render json: { errors: author.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def books
        author = Author.find(params[:id])
        books = author.books.order(release_date: :desc)
        render json: serialize_books(books), status: :ok
      end

      def events
        author = Author.find(params[:id])
        events = author.events.order(starts_at: :asc)
        render json: serialize_events(events), status: :ok
      end

      def followers
        author = Author.find(params[:id])
        followers = author.followers
        render json: serialize_users(followers), status: :ok
      end

      private

      def author_params
        params.require(:author).permit(:name, :bio, :avatar_url, :website_url)
      end

      def serialize_authors(authors)
        authors.map { |author| serialize_author(author) }
      end

      def serialize_author(author)
        {
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url,
          website_url: author.website_url,
          books_count: author.books.count,
          events_count: author.events.count,
          followers_count: author.followers.count
        }
      end

      def serialize_author_detail(author)
        {
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url,
          website_url: author.website_url,
          books_count: author.books.count,
          events_count: author.events.count,
          followers_count: author.followers.count
        }
      end

      def serialize_books(books)
        books.map do |book|
          {
            id: book.id,
            title: book.title,
            cover_image_url: book.cover_image_url,
            release_date: book.release_date
          }
        end
      end

      def serialize_events(events)
        events.map do |event|
          {
            id: event.id,
            title: event.title,
            event_type: event.event_type,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            location: event.location
          }
        end
      end

      def serialize_users(users)
        users.map do |user|
          {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url_with_attachment
          }
        end
      end
    end
  end
end

