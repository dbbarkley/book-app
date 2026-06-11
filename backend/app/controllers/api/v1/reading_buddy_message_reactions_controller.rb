module Api
  module V1
    class ReadingBuddyMessageReactionsController < BaseController
      include Authenticable
      before_action :authenticate_user!
      before_action :set_session
      before_action :set_message

      # POST /api/v1/reading_buddy/sessions/:session_id/messages/:message_id/reactions/toggle
      def toggle
        emoji = params[:emoji].to_s.strip

        unless ReadingBuddyMessageReaction::ALLOWED_EMOJIS.include?(emoji)
          return render json: { error: 'Invalid emoji' }, status: :unprocessable_entity
        end

        existing = @message.reactions.find_by(user: current_user, emoji: emoji)
        if existing
          existing.destroy
        else
          @message.reactions.create!(user: current_user, emoji: emoji)
        end

        reactions = serialize_reactions(@message.reactions.reload)

        ActionCable.server.broadcast(
          "reading_buddy_session_#{@session.id}",
          { type: 'reaction_update', message_id: @message.id, reactions: reactions }
        )

        render json: { reactions: reactions }
      end

      private

      def set_session
        @session = ReadingBuddySession.involving(current_user).find(params[:reading_buddy_session_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Session not found' }, status: :not_found
      end

      def set_message
        @message = @session.messages.find(params[:reading_buddy_message_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Message not found' }, status: :not_found
      end

      def serialize_reactions(reactions)
        reactions.group_by(&:emoji).map do |emoji, rs|
          { emoji: emoji, user_ids: rs.map(&:user_id) }
        end
      end
    end
  end
end
