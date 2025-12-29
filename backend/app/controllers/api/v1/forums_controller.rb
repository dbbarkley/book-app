module Api
  module V1
    class ForumsController < BaseController
      before_action :authenticate_user!, except: [:index, :show]
      before_action :set_forum, only: [:show, :update, :destroy, :follow, :unfollow]

      # GET /api/v1/forums
      def index
        # Only show forums the user is allowed to see
        @forums = Forum.visible_for(current_user).order(created_at: :desc)
        
        render json: {
          forums: @forums.map { |forum| serialize_forum(forum) }
        }, status: :ok
      end

      # GET /api/v1/forums/:id
      def show
        # Check if user can view this forum
        if @forum.private_access? && !@forum.following?(current_user) && @forum.owner != current_user
          return render json: { error: 'Access denied. This forum is private.' }, status: :forbidden
        end

        # Paginate posts
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        posts = @forum.forum_posts.not_deleted.includes(:user).order(created_at: :desc)
        total_count = posts.count
        paginated_posts = posts.limit(per_page).offset((page - 1) * per_page)

        render json: {
          forum: serialize_forum(@forum, include_stats: true),
          posts: paginated_posts.map { |post| serialize_post(post) },
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # POST /api/v1/forums
      def create
        @forum = current_user.owned_forums.build(forum_params)

        if @forum.save
          # Owner automatically follows the forum
          current_user.forum_follows.find_or_create_by(forum: @forum)
          render json: serialize_forum(@forum), status: :created
        else
          render json: { errors: @forum.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/forums/:id
      def update
        if @forum.owner != current_user
          return render json: { error: 'Unauthorized. Only the owner can edit this forum.' }, status: :unauthorized
        end

        if @forum.update(forum_params)
          render json: serialize_forum(@forum), status: :ok
        else
          render json: { errors: @forum.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forums/:id
      def destroy
        if @forum.owner != current_user
          return render json: { error: 'Unauthorized. Only the owner can delete this forum.' }, status: :unauthorized
        end

        @forum.destroy
        head :no_content
      end

      # POST /api/v1/forums/:id/follow
      def follow
        follow = current_user.forum_follows.find_or_initialize_by(forum: @forum)
        
        if follow.save
          render json: { message: 'Followed successfully', following: true }, status: :ok
        else
          render json: { errors: follow.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forums/:id/unfollow
      def unfollow
        follow = current_user.forum_follows.find_by(forum: @forum)
        
        if @forum.owner == current_user
          return render json: { error: 'Owners cannot unfollow their own forums.' }, status: :unprocessable_entity
        end

        if follow&.destroy
          render json: { message: 'Unfollowed successfully', following: false }, status: :ok
        else
          render json: { error: 'Not following this forum' }, status: :not_found
        end
      end

      private

      def set_forum
        @forum = Forum.find(params[:id])
      end

      def forum_params
        params.require(:forum).permit(:title, :description, :visibility)
      end

      def serialize_forum(forum, include_stats: false)
        data = {
          id: forum.id,
          title: forum.title,
          description: forum.description,
          visibility: forum.visibility,
          owner_id: forum.owner_id,
          created_at: forum.created_at,
          is_following: forum.following?(current_user),
          followers_count: forum.follower_count,
          posts_count: forum.forum_posts.not_deleted.count
        }

        data
      end

      def serialize_post(post)
        {
          id: post.id,
          forum_id: post.forum_id,
          body: post.deleted? ? '[Deleted]' : post.body,
          created_at: post.created_at,
          edited_at: post.edited_at,
          deleted_at: post.deleted_at,
          user: post.deleted? ? nil : {
            id: post.user.id,
            username: post.user.username,
            display_name: post.user.display_name,
            avatar_url: post.user.avatar_url_with_attachment
          },
          heart_count: post.heart_count,
          reply_count: post.forum_replies.not_deleted.count,
          is_hearted: post.hearted_by?(current_user)
        }
      end
    end
  end
end

