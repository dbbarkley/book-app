module Api
  module V1
    class ForumRepliesController < BaseController
      before_action :authenticate_user!, except: [:index]
      before_action :set_post, only: [:index, :create]
      before_action :set_reply, only: [:update, :destroy, :heart, :unheart, :report, :thread]

      # GET /api/v1/forum_posts/:forum_post_id/replies
      def index
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        
        # Get only top-level replies for this post (parent_id is nil)
        replies = @post.forum_replies.not_deleted
                       .where(parent_id: nil)
                       .includes(:user)
                       .order(created_at: :asc)
        
        total_count = replies.count
        paginated_replies = replies.limit(per_page).offset((page - 1) * per_page)

        render json: {
          replies: paginated_replies.map { |reply| serialize_reply(reply) },
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # POST /api/v1/forum_posts/:post_id/replies
      def create
        # Check forum visibility (redundant but safe)
        forum = @post.forum
        if forum.private_access? && !forum.following?(current_user) && forum.owner != current_user
          return render json: { error: 'You must follow this private forum to reply.' }, status: :forbidden
        end

        @reply = @post.forum_replies.build(reply_params)
        @reply.user = current_user

        if @reply.save
          render json: serialize_reply(@reply), status: :created
        else
          render json: { errors: @reply.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/forum_replies/:id
      def update
        if @reply.user != current_user
          return render json: { error: 'Unauthorized. Only the author can edit this reply.' }, status: :unauthorized
        end

        if @reply.update(reply_params.merge(edited_at: Time.current))
          render json: serialize_reply(@reply), status: :ok
        else
          render json: { errors: @reply.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forum_replies/:id
      def destroy
        # Authors and forum owners can delete
        is_author = @reply.user == current_user
        is_owner = @reply.forum_post.forum.owner == current_user
        
        unless is_author || is_owner
          return render json: { error: 'Unauthorized to delete this reply.' }, status: :unauthorized
        end

        # Soft delete
        if @reply.update(deleted_at: Time.current)
          render json: { message: 'Reply deleted successfully' }, status: :ok
        else
          render json: { errors: @reply.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/forum_replies/:id/heart
      def heart
        heart = @reply.forum_hearts.find_or_initialize_by(user: current_user)
        
        if heart.save
          render json: { message: 'Hearted successfully', heart_count: @reply.heart_count }, status: :ok
        else
          render json: { errors: heart.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/forum_replies/:id/unheart
      def unheart
        heart = @reply.forum_hearts.find_by(user: current_user)
        
        if heart&.destroy
          render json: { message: 'Unhearted successfully', heart_count: @reply.heart_count }, status: :ok
        else
          render json: { error: 'Not hearted' }, status: :not_found
        end
      end

      # POST /api/v1/forum_replies/:id/report
      def report
        report = @reply.forum_reports.find_or_initialize_by(user: current_user)
        report.reason = params[:reason]

        if report.save
          render json: { message: 'Reported successfully' }, status: :ok
        else
          render json: { errors: report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/forum_replies/:id/thread
      def thread
        replies = @reply.replies.not_deleted.includes(:user).order(created_at: :asc)
        render json: {
          parent: serialize_reply(@reply),
          replies: replies.map { |r| serialize_reply(r) }
        }, status: :ok
      end

      private

      def set_post
        @post = ForumPost.find(params[:forum_post_id])
      end

      def set_reply
        @reply = ForumReply.find(params[:id])
      end

      def reply_params
        params.require(:reply).permit(:body, :parent_id)
      end

      def serialize_reply(reply)
        {
          id: reply.id,
          forum_post_id: reply.forum_post_id,
          parent_id: reply.parent_id,
          body: reply.deleted? ? '[Deleted]' : reply.body,
          created_at: reply.created_at,
          edited_at: reply.edited_at,
          deleted_at: reply.deleted_at,
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

