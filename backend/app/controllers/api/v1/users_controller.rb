module Api
  module V1
    class UsersController < BaseController
      include Authenticable
      before_action :authenticate_user!, except: [:show]
      before_action :set_user, only: [:show, :update, :profile, :following, :followers]

      def show
        render json: serialize_user(@user), status: :ok
      end

      def update
        if @user == current_user && @user.update(user_params)
          render json: serialize_user(@user), status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def profile
        render json: {
          user: serialize_user(@user),
          stats: {
            followers_count: @user.followers.count,
            following_count: @user.follows.count
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
            onboarding_completed: user.onboarding_completed
          }
        }, status: :ok
      end

      # Update current user's preferences
      def update_preferences
        user = current_user
        preferences_params = params.require(:preferences).permit(:onboarding_completed, genres: [], author_ids: [])

        # Update onboarding_completed if provided
        if preferences_params.key?(:onboarding_completed)
          user.onboarding_completed = preferences_params[:onboarding_completed]
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
              onboarding_completed: user.onboarding_completed
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
        params.require(:user).permit(:display_name, :bio, :avatar_url)
      end

      def serialize_user(user)
        {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
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
          author_name: book.author.name,
          cover_image_url: book.cover_image_url
        }
      end
    end
  end
end

