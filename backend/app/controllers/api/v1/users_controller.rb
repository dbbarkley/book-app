module Api
  module V1
    class UsersController < BaseController
      include Authenticable
      before_action :authenticate_user!, except: [:show, :stats]
      before_action :set_user, only: [:show, :update, :profile, :following, :followers, :library, :stats]

      def show
        render json: serialize_user(@user), status: :ok
      end

      # GET /api/v1/users/:id/library
      def library
        user_books = @user.user_books
                          .includes(book: :author)
                          .where(visibility: 'public')
                          .order(updated_at: :desc)

        render json: {
          user_books: user_books.map { |ub| serialize_user_book(ub) }
        }, status: :ok
      end

      def update
        if @user == current_user && @user.update(user_params)
          render json: serialize_user(@user), status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def profile
        current_follow = nil
        if current_user
          current_follow = current_user.follows.find_by(followable: @user)
        end

        render json: {
          user: serialize_user(@user),
          stats: {
            followers_count: @user.followers.count,
            following_count: @user.follows.count
          },
          current_user_follow: current_follow ? {
            following: true,
            follow_id: current_follow.id
          } : {
            following: false
          }
        }, status: :ok
      end

      def following
        follows = @user.follows.includes(:followable).order(created_at: :desc)
        render json: serialize_follows(follows), status: :ok
      end

      def followers
        followers = @user.followers
        render json: serialize_users(followers), status: :ok
      end

      # GET /api/v1/users/:id/stats
      def stats
        # Only include public books in stats
        public_books = @user.user_books.where(visibility: 'public').includes(book: :author)
        
        # Genre stats
        genre_counts = Hash.new(0)
        total_genre_entries = 0
        
        public_books.each do |ub|
          categories = ub.book.respond_to?(:categories) ? (ub.book.categories || []) : []
          categories.each do |cat|
            # # Roll up specific categories to "Non-fiction"
            # non_fiction_categories = [
            #   'Biography & Autobiography', 'History', 'Social Science', 
            #   'Science', 'Self-Help', 'Business & Economics', 
            #   'Philosophy', 'Religion', 'True Crime', 'Cooking',
            #   'Art', 'Travel', 'Education', 'Nature'
            # ]
            # display_cat = if non_fiction_categories.any? { |nf| nf.downcase == cat.strip.downcase }
            #                 'non-fiction'
            #               else
            #                 cat
            #               end
            genre_counts[cat] += 1
            total_genre_entries += 1
          end
        end
        
        sorted_genres = genre_counts.sort_by { |_, count| -count }
        top_6_genres = sorted_genres.first(6).map do |name, count|
          {
            name: name,
            count: count,
            percentage: total_genre_entries > 0 ? (count.to_f / total_genre_entries * 100).round(1) : 0
          }
        end
        
        other_count = sorted_genres.drop(6).sum { |_, count| count }
        if other_count > 0
          top_6_genres << {
            name: 'Other',
            count: other_count,
            percentage: total_genre_entries > 0 ? (other_count.to_f / total_genre_entries * 100).round(1) : 0
          }
        end

        # Top Author stats
        author_counts = Hash.new(0)
        total_books = public_books.count
        
        public_books.each do |ub|
          author_counts[ub.book.author.name] += 1
        end
        
        top_authors = author_counts.sort_by { |_, count| -count }.first(10).map do |name, count|
          {
            name: name,
            count: count,
            percentage: total_books > 0 ? (count.to_f / total_books * 100).round(1) : 0
          }
        end

        render json: {
          genres: top_6_genres,
          top_authors: top_authors
        }, status: :ok
      end

      # Search users
      def search
        users = User.all.order(:username)
        
        # Support search query parameter
        if params[:query].present?
          query = params[:query].downcase
          users = users.where(
            "LOWER(username) LIKE ? OR LOWER(display_name) LIKE ? OR LOWER(bio) LIKE ?",
            "%#{query}%",
            "%#{query}%",
            "%#{query}%"
          )
        end
        
        # Support pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min # Cap at 100
        
        total_count = users.count
        users = users.limit(per_page).offset((page - 1) * per_page)
        
        render json: {
          users: serialize_users(users),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # Get current user's preferences
      def preferences
        user = current_user
        render json: {
          preferences: {
            genres: user.preferences['genres'] || [],
            author_ids: user.preferences['author_ids'] || [],
            onboarding_completed: user.onboarding_completed,
            zipcode: user.zipcode
          }
        }, status: :ok
      end

      # Update current user's preferences
      def update_preferences
        user = current_user
        preferences_params = params.require(:preferences).permit(:onboarding_completed, :zipcode, genres: [], author_ids: [])

        # Update onboarding_completed if provided
        if preferences_params.key?(:onboarding_completed)
          user.onboarding_completed = preferences_params[:onboarding_completed]
        end

        # Update zipcode if provided
        if preferences_params.key?(:zipcode)
          user.zipcode = preferences_params[:zipcode]
        end

        # Update preferences JSONB
        user.preferences ||= {}
        user.preferences['genres'] = preferences_params[:genres] if preferences_params.key?(:genres)
        user.preferences['author_ids'] = preferences_params[:author_ids] if preferences_params.key?(:author_ids)

        if user.save
          render json: {
            message: 'Preferences updated successfully',
            preferences: {
              genres: user.preferences['genres'] || [],
              author_ids: user.preferences['author_ids'] || [],
              onboarding_completed: user.onboarding_completed,
              zipcode: user.zipcode
            }
          }, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:display_name, :bio, :avatar_url, :zipcode)
      end

      def serialize_user(user)
        {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          zipcode: user.zipcode,
          created_at: user.created_at
        }
      end

      def serialize_users(users)
        users.map { |user| serialize_user(user) }
      end

      def serialize_follows(follows)
        follows.map do |follow|
          {
            id: follow.id,
            followable_type: follow.followable_type,
            followable_id: follow.followable_id,
            followable: serialize_followable(follow.followable),
            created_at: follow.created_at
          }
        end
      end

      def serialize_followable(followable)
        case followable
        when User
          serialize_user(followable)
        when Author
          serialize_author(followable)
        when Book
          serialize_book(followable)
        end
      end

      def serialize_author(author)
        {
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url
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
          google_books_id: book.google_books_id,
          categories: book.respond_to?(:categories) ? (book.categories || []) : []
        }
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
    end
  end
end

