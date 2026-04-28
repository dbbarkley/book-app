module Api
  module V1
    class ReadingBuddySessionsController < BaseController
      include Authenticable
      before_action :authenticate_user!
      before_action :set_session, only: [:show, :update]

      # GET /api/v1/reading_buddy/sessions
      def index
        sessions = ReadingBuddySession
          .involving(current_user)
          .includes(:book, :initiator, :invited)
          .order(updated_at: :desc)

        render json: { sessions: sessions.map { |s| serialize_session(s) } }, status: :ok
      end

      # POST /api/v1/reading_buddy/sessions
      def create
        book   = Book.find(params[:book_id])
        invited = User.find(params[:invited_id])

        unless current_user.friends_with?(invited)
          return render json: { error: 'You can only invite friends' }, status: :unprocessable_entity
        end

        # Check for existing open session between these two for this book
        existing = ReadingBuddySession
          .open
          .where(book: book)
          .where(
            '(initiator_id = ? AND invited_id = ?) OR (initiator_id = ? AND invited_id = ?)',
            current_user.id, invited.id, invited.id, current_user.id
          ).first

        if existing
          return render json: {
            error:   'A session already exists for this book',
            session: serialize_session(existing)
          }, status: :unprocessable_entity
        end

        session = ReadingBuddySession.create!(
          book:      book,
          initiator: current_user,
          invited:   invited,
          status:    'pending'
        )

        Notification.create!(
          user:              invited,
          notifiable:        session,
          notification_type: 'reading_buddy_invite'
        )

        render json: { session: serialize_session(session) }, status: :created

      rescue ActiveRecord::RecordNotFound => e
        render json: { error: 'Not found' }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end

      # GET /api/v1/reading_buddy/sessions/:id
      def show
        messages = @session.messages
          .includes(:user)
          .order(created_at: :asc)
          .last(100)

        highlights = @session.highlights
          .includes(:user)
          .order(page_number: :asc, created_at: :asc)

        render json: {
          session:    serialize_session(@session),
          messages:   messages.map { |m| serialize_message(m) },
          highlights: highlights.map { |h| serialize_highlight(h) }
        }, status: :ok
      end

      # PATCH /api/v1/reading_buddy/sessions/:id
      # body: { action_type: 'accept' | 'decline' | 'dnf' }
      def update
        case params[:action_type]
        when 'accept'
          return render json: { error: 'Only the invited user can accept' }, status: :forbidden unless @session.invited_id == current_user.id
          return render json: { error: 'Session is not pending' }, status: :unprocessable_entity unless @session.status == 'pending'
          @session.accept!

        when 'decline'
          return render json: { error: 'Only the invited user can decline' }, status: :forbidden unless @session.invited_id == current_user.id
          return render json: { error: 'Session is not pending' }, status: :unprocessable_entity unless @session.status == 'pending'
          @session.decline!

        when 'dnf'
          return render json: { error: 'Session is not active' }, status: :unprocessable_entity unless @session.status == 'active'
          @session.dnf!

        else
          return render json: { error: 'Invalid action. Use accept, decline, or dnf' }, status: :unprocessable_entity
        end

        render json: { session: serialize_session(@session) }, status: :ok
      end

      private

      def set_session
        @session = ReadingBuddySession.involving(current_user).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Session not found' }, status: :not_found
      end

      def serialize_session(session)
        initiator_book = UserBook.find_by(user: session.initiator, book: session.book)
        invited_book   = UserBook.find_by(user: session.invited,   book: session.book)

        {
          id:           session.id,
          status:       session.status,
          started_at:   session.started_at,
          created_at:   session.created_at,
          updated_at:   session.updated_at,
          is_initiator: session.initiator_id == current_user.id,
          book: {
            id:              session.book.id,
            title:           session.book.title,
            author_name:     session.book.author&.name,
            cover_image_url: session.book.cover_image_url,
            google_books_id: session.book.google_books_id,
          },
          initiator: serialize_participant(session.initiator, initiator_book),
          invited:   serialize_participant(session.invited,   invited_book),
        }
      end

      def serialize_participant(user, user_book)
        {
          id:           user.id,
          username:     user.username,
          display_name: user.display_name,
          avatar_url:   user.avatar_url_with_attachment,
          progress:     user_book ? {
            status:                user_book.status,
            pages_read:            user_book.pages_read,
            total_pages:           user_book.total_pages,
            completion_percentage: user_book.completion_percentage,
          } : nil
        }
      end

      def serialize_message(message)
        {
          id:         message.id,
          content:    message.content,
          user_id:    message.user_id,
          created_at: message.created_at,
          user: {
            id:           message.user.id,
            username:     message.user.username,
            display_name: message.user.display_name,
            avatar_url:   message.user.avatar_url_with_attachment,
          }
        }
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
