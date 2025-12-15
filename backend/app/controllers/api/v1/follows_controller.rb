module Api
  module V1
    class FollowsController < BaseController
      def index
        follows = current_user.follows.includes(:followable).order(created_at: :desc)
        render json: serialize_follows(follows), status: :ok
      end

      def create
        result = FollowService.new(
          current_user,
          params[:followable_type],
          params[:followable_id]
        ).call

        if result.success?
          render json: serialize_follow(result.data), status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        result = UnfollowService.new(current_user, params[:id]).call

        if result.success?
          render json: { message: 'Unfollowed successfully' }, status: :ok
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      private

      def serialize_follow(follow)
        {
          id: follow.id,
          followable_type: follow.followable_type,
          followable_id: follow.followable_id,
          created_at: follow.created_at
        }
      end

      def serialize_follows(follows)
        follows.map { |follow| serialize_follow(follow) }
      end
    end
  end
end

