module Api
  module V1
    class BookSuggestionsController < BaseController
      include Authenticable
      before_action :authenticate_user!

      # POST /api/v1/book_suggestions
      # Body: { book_id:, recipient_ids: [1,2,3], message: "..." }
      def create
        book = Book.find(params[:book_id])
        recipient_ids = Array(params[:recipient_ids]).map(&:to_i).uniq
        message = params[:message].presence

        if recipient_ids.empty?
          return render json: { error: 'At least one recipient is required' }, status: :unprocessable_entity
        end

        # Only allow suggesting to actual friends
        friend_ids = current_user.friends.pluck(:id)
        recipient_ids = recipient_ids & friend_ids

        if recipient_ids.empty?
          return render json: { error: 'Recipients must be friends' }, status: :unprocessable_entity
        end

        created = []
        skipped = []

        recipient_ids.each do |rid|
          suggestion = BookSuggestion.find_or_initialize_by(
            suggester: current_user,
            recipient_id: rid,
            book: book
          )

          if suggestion.new_record?
            suggestion.message = message
            suggestion.status = 'pending'
            if suggestion.save
              created << rid
              # Send notification
              recipient = User.find(rid)
              Notification.create!(
                user: recipient,
                notifiable: suggestion,
                notification_type: 'book_suggestion'
              )
            end
          else
            skipped << rid
          end
        end

        render json: {
          sent_count: created.length,
          skipped_count: skipped.length,
          message: created.length > 0 ? "Book suggested to #{created.length} friend#{'s' if created.length > 1}!" : "Already suggested to all selected friends"
        }, status: :ok
      end

      # GET /api/v1/book_suggestions/received
      def received
        suggestions = BookSuggestion
          .for_user(current_user)
          .where(status: ['pending', 'viewed'])
          .includes(:suggester, :book)
          .order(created_at: :desc)

        # Mark pending ones as viewed
        BookSuggestion.for_user(current_user).pending.update_all(status: 'viewed')

        render json: { suggestions: suggestions.map { |s| serialize_suggestion(s) } }, status: :ok
      end

      # PATCH /api/v1/book_suggestions/:id/dismiss
      def dismiss
        suggestion = BookSuggestion.for_user(current_user).find(params[:id])
        suggestion.dismiss!
        render json: { success: true }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not found' }, status: :not_found
      end

      private

      def serialize_suggestion(suggestion)
        {
          id: suggestion.id,
          status: suggestion.status,
          message: suggestion.message,
          created_at: suggestion.created_at,
          suggester: {
            id: suggestion.suggester.id,
            username: suggestion.suggester.username,
            display_name: suggestion.suggester.display_name,
            avatar_url: suggestion.suggester.avatar_url_with_attachment,
          },
          book: {
            id: suggestion.book.id,
            title: suggestion.book.title,
            author_name: suggestion.book.author&.name,
            cover_image_url: suggestion.book.resolved_cover_url,
            google_books_id: suggestion.book.google_books_id,
          }
        }
      end
    end
  end
end
