module Api
  module V1
    class ForumPostsController < BaseController
      before_action :authenticate_user!, except: [:index, :show]
      before_action :set_forum, only: [:index, :create]
      before_action :set_post, only: [:show, :update, :destroy, :heart, :unheart, :report]

      # GET /api/v1/forums/:forum_id/posts
      def index
        # Check forum visibility
        if @forum.private_access? && !@forum.following?(current_user) && @forum.owner != current_user
          return render json: { error: 'Access denied. This forum is private.' }, status: :forbidden
        end

        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        posts = @forum.forum_posts.not_deleted.includes(:user).order(created_at: :desc)
        total_count = posts.count
        paginated_posts = posts.limit(per_page).offset((page - 1) * per_page)

        render json: {
          posts: paginated_posts.map { |post| serialize_post(post) },
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # GET /api/v1/forum_posts/:id
      def show
        # Check forum visibility
        forum = @post.forum
        if forum.private_access? && !forum.following?(current_user) && forum.owner != current_user
          return render json: { error: 'Access denied. This forum is private.' }, status: :forbidden
        end

        if @post.deleted?
          return render json: { error: 'Post has been deleted.' }, status: :not_found
        end

        # Paginate replies
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        replies = @post.forum_replies.not_deleted.where(parent_id: nil).includes(:user).order(created_at: :asc)
        total_count = replies.count
        paginated_replies = replies.limit(per_page).offset((page - 1) * per_page)

        render json: {
          post: serialize_post(@post),
          replies: paginated_replies.map { |reply| serialize_reply(reply) },
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # POST /api/v1/forums/:forum_id/posts
      def create
        # Check if user can post in this forum
        if @forum.private_access? && !@forum.following?(current_user) && @forum.owner != current_user
          return render json: { error: 'You must follow this private forum to post.' }, status: :forbidden
        end

        @post = @forum.forum_posts.build(post_params)
        @post.user = current_user

        if @post.save
          render json: serialize_post(@post), status: :created
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/forum_posts/:id
      def update
        if @post.user != current_user
          return render json: { error: 'Unauthorized. Only the author can edit this post.' }, status: :unauthorized
        end

        if @post.update(post_params.merge(edited_at: Time.current))
          render json: serialize_post(@post), status: :ok
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forum_posts/:id
      def destroy
        # Authors and forum owners (and future mods/admins) can delete
        is_author = @post.user == current_user
        is_owner = @post.forum.owner == current_user
        
        unless is_author || is_owner
          return render json: { error: 'Unauthorized to delete this post.' }, status: :unauthorized
        end

        # Soft delete
        if @post.update(deleted_at: Time.current)
          render json: { message: 'Post deleted successfully' }, status: :ok
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/forum_posts/:id/heart
      def heart
        heart = @post.forum_hearts.find_or_initialize_by(user: current_user)
        
        if heart.save
          render json: { message: 'Hearted successfully', heart_count: @post.heart_count }, status: :ok
        else
          render json: { errors: heart.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forum_posts/:id/unheart
      def unheart
        heart = @post.forum_hearts.find_by(user: current_user)
        
        if heart&.destroy
          render json: { message: 'Unhearted successfully', heart_count: @post.heart_count }, status: :ok
        else
          render json: { error: 'Not hearted' }, status: :not_found
        end
      end

      # POST /api/v1/forum_posts/:id/report
      def report
        report = @post.forum_reports.find_or_initialize_by(user: current_user)
        report.reason = params[:reason]

        if report.save
          render json: { message: 'Reported successfully' }, status: :ok
        else
          render json: { errors: report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_forum
        @forum = Forum.find(params[:forum_id])
      end

      def set_post
        @post = ForumPost.find(params[:id])
      end

      def post_params
        params.require(:post).permit(:body)
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

      def serialize_reply(reply)
        {
          id: reply.id,
          body: reply.deleted? ? '[Deleted]' : reply.body,
          created_at: reply.created_at,
          edited_at: reply.edited_at,
          user: reply.deleted? ? nil : {
            id: reply.user.id,
            username: reply.user.username,
            display_name: reply.user.display_name,
            avatar_url: reply.user.avatar_url_with_attachment
          },
          heart_count: reply.heart_count,
          reply_count: reply.replies.not_deleted.count,
          is_hearted: reply.hearted_by?(current_user)
        }
      end
    end
  end
end

