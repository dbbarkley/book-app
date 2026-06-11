module Api
  module V1
    class BookNotesController < BaseController
      include Authenticable
      before_action :authenticate_user!
      before_action :set_user_book, except: [:all_for_user]
      before_action :set_note, only: [:update, :destroy]

      # GET /api/v1/user/books/:user_book_id/notes
      def index
        notes = @user_book.book_notes.recent
        render json: { notes: notes.map { |n| serialize_note(n) } }, status: :ok
      end

      # POST /api/v1/user/books/:user_book_id/notes
      def create
        note = @user_book.book_notes.build(note_params)
        note.user = current_user
        if note.save
          render json: { note: serialize_note(note) }, status: :created
        else
          render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/user/books/:user_book_id/notes/:id
      def update
        if @note.update(note_params)
          render json: { note: serialize_note(@note) }, status: :ok
        else
          render json: { errors: @note.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/user/books/:user_book_id/notes/:id
      def destroy
        @note.destroy
        head :no_content
      end

      # GET /api/v1/user/notes — all notes for the current user, with book info
      def all_for_user
        notes = current_user.book_notes
                            .includes(user_book: { book: :author })
                            .recent
        render json: { notes: notes.map { |n| serialize_note_with_book(n) } }, status: :ok
      end

      private

      def set_user_book
        @user_book = current_user.user_books.find(params[:user_book_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end

      def set_note
        @note = @user_book.book_notes.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end

      def note_params
        params.require(:note).permit(:content, :page_number)
      end

      def serialize_note(note)
        {
          id:          note.id,
          content:     note.content,
          page_number: note.page_number,
          created_at:  note.created_at,
          updated_at:  note.updated_at,
        }
      end

      def serialize_note_with_book(note)
        ub   = note.user_book
        book = ub&.book
        serialize_note(note).merge(
          user_book_id: note.user_book_id,
          book: book ? {
            id:              book.id,
            title:           book.title,
            author_name:     book.author&.name,
            cover_image_url: book.cover_image_url,
            google_books_id: book.google_books_id,
          } : nil
        )
      end
    end
  end
end
