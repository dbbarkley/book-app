module Api
  module V1
    class FeedController < BaseController
      def index
        page = params[:page]&.to_i || 1
        per_page = [params[:per_page]&.to_i || 50, 100].min
        activity_type = params[:activity_type]

        feed_items = current_user.feed_items
                                 .includes(:feedable)
                                 .recent

        feed_items = feed_items.by_activity_type(activity_type) if activity_type.present?

        total_count = feed_items.count
        offset = (page - 1) * per_page
        feed_items = feed_items.limit(per_page).offset(offset)
        total_pages = (total_count.to_f / per_page).ceil

        render json: {
          feed_items: serialize_feed_items(feed_items),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: total_pages,
            total_count: total_count
          }
        }, status: :ok
      end

      private

      def serialize_feed_items(feed_items)
        feed_items.map do |item|
          {
            id: item.id,
            activity_type: item.activity_type,
            metadata: item.metadata,
            feedable: serialize_feedable(item.feedable),
            created_at: item.created_at
          }
        end
      end

      def serialize_feedable(feedable)
        case feedable
        when Book
          serialize_book_payload(feedable).merge(type: 'Book')
        when Event
          {
            type: 'Event',
            id: feedable.id,
            title: feedable.title,
            event_type: feedable.event_type,
            starts_at: feedable.starts_at,
            author_name: feedable.author.name
          }
        when Author
          {
            type: 'Author',
            id: feedable.id,
            name: feedable.name,
            avatar_url: feedable.avatar_url
          }
        when User
          serialize_user(feedable)
        when UserBook
          serialize_user_book_feedable(feedable)
        end
      end

      def serialize_user(user)
        {
          type: 'User',
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      end

      def serialize_user_book_feedable(user_book)
        serialize_user_book_payload(user_book).merge(type: 'UserBook')
      end

      def serialize_book_payload(book)
        return {} unless book

        {
          id: book.id,
          title: book.title,
          author_name: book.author&.name,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date
        }
      end

      def serialize_user_book_payload(user_book)
        {
          id: user_book.id,
          book_id: user_book.book_id,
          status: user_book.status,
          shelf: user_book.shelf,
          visibility: user_book.visibility,
          pages_read: user_book.pages_read,
          total_pages: user_book.total_pages,
          completion_percentage: user_book.completion_percentage,
          rating: user_book.rating,
          review: user_book.review,
          dnf_reason: user_book.dnf_reason,
          dnf_page: user_book.dnf_page,
          started_at: user_book.started_at,
          finished_at: user_book.finished_at,
          created_at: user_book.created_at,
          updated_at: user_book.updated_at,
          book: serialize_book_payload(user_book.book)
        }
      end
    end
  end
end

