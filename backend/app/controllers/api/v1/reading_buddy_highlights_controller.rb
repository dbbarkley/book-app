module Api
  module V1
    class ReadingBuddyHighlightsController < BaseController
      include Authenticable
      before_action :authenticate_user!
      before_action :set_session

      # GET /api/v1/reading_buddy/sessions/:session_id/highlights
      def index
        highlights = @session.highlights
          .includes(:user)
          .order(page_number: :asc, created_at: :asc)

        render json: { highlights: highlights.map { |h| serialize_highlight(h) } }, status: :ok
      end

      # POST /api/v1/reading_buddy/sessions/:session_id/highlights
      def create
        unless @session.status == 'active'
          return render json: { error: 'Session is not active' }, status: :unprocessable_entity
        end

        highlight = @session.highlights.build(highlight_params)
        highlight.user = current_user

        # Attach the page image if provided
        if params[:page_image].present?
          highlight.page_image.attach(params[:page_image])
        end

        if highlight.save
          render json: { highlight: serialize_highlight(highlight) }, status: :created
        else
          render json: { error: highlight.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def set_session
        @session = ReadingBuddySession.involving(current_user).find(params[:reading_buddy_session_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Session not found' }, status: :not_found
      end

      def highlight_params
        params.permit(:page_number, :extracted_text, :highlighted_text, :char_start, :char_end)
      end

      def serialize_highlight(highlight)
        {
          id:               highlight.id,
          page_number:      highlight.page_number,
          extracted_text:   highlight.extracted_text,
          highlighted_text: highlight.highlighted_text,
          char_start:       highlight.char_start,
          char_end:         highlight.char_end,
          created_at:       highlight.created_at,
          page_image_url:   highlight.page_image.attached? ? rails_blob_path(highlight.page_image, only_path: true) : nil,
          user: {
            id:           highlight.user.id,
            username:     highlight.user.username,
            display_name: highlight.user.display_name,
            avatar_url:   highlight.user.avatar_url_with_attachment,
          }
        }
      end
    end
  end
end
