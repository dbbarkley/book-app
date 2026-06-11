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

        my_book  = UserBook.find_by(user: current_user, book: @session.book)
        my_pages = my_book&.pages_read || 0

        render json: { highlights: highlights.map { |h| serialize_highlight(h, my_pages) } }, status: :ok
      end

      # POST /api/v1/reading_buddy/sessions/:session_id/highlights
      def create
        unless @session.status == 'active'
          return render json: { error: 'Session is not active' }, status: :unprocessable_entity
        end

        highlight = @session.highlights.build(highlight_params)
        highlight.user = current_user

        if params[:page_image].present?
          highlight.page_image.attach(params[:page_image])
        end

        if highlight.save
          # Creator always gets the full highlight back (never locked for own content)
          render json: { highlight: serialize_highlight(highlight, Float::INFINITY) }, status: :created
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
        params.permit(:page_number, :extracted_text, :highlighted_text, :char_start, :char_end, :note, :spoiler_lock, moods: [])
      end

      def serialize_highlight(highlight, my_pages = nil)
        my_pages ||= begin
          my_book = UserBook.find_by(user: current_user, book: @session.book)
          my_book&.pages_read || 0
        end

        is_mine = highlight.user_id == current_user.id
        locked  = highlight.spoiler_lock? && !is_mine && my_pages < highlight.page_number

        base = {
          id:           highlight.id,
          page_number:  highlight.page_number,
          char_start:   highlight.char_start,
          char_end:     highlight.char_end,
          spoiler_lock: highlight.spoiler_lock,
          locked:       locked,
          created_at:   highlight.created_at,
          user: {
            id:           highlight.user.id,
            username:     highlight.user.username,
            display_name: highlight.user.display_name,
            avatar_url:   highlight.user.avatar_url_with_attachment,
          }
        }
        return base if locked

        base.merge(
          extracted_text:   highlight.extracted_text,
          highlighted_text: highlight.highlighted_text,
          note:             highlight.note,
          moods:            highlight.moods || [],
          page_image_url:   highlight.page_image.attached? ? rails_blob_path(highlight.page_image, only_path: true) : nil,
        )
      end
    end
  end
end
