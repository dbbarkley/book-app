module Api
  module V1
    class ReadingBuddyMessagesController < BaseController
      include Authenticable
      before_action :authenticate_user!
      before_action :set_session

      # POST /api/v1/reading_buddy/sessions/:session_id/messages
      def create
        unless @session.status == 'active'
          return render json: { error: 'Session is not active' }, status: :unprocessable_entity
        end

        message = @session.messages.create!(
          user:    current_user,
          content: params[:content].to_s.strip
        )

        render json: { message: serialize_message(message) }, status: :created

      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end

      private

      def set_session
        @session = ReadingBuddySession.involving(current_user).find(params[:reading_buddy_session_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Session not found' }, status: :not_found
      end

      def serialize_message(message)
        {
          id:         message.id,
          content:    message.content,
          user_id:    message.user_id,
          created_at: message.created_at,
          reactions:  [],
          user: {
            id:           message.user.id,
            username:     message.user.username,
            display_name: message.user.display_name,
            avatar_url:   message.user.avatar_url_with_attachment,
          }
        }
      end
    end
  end
end
