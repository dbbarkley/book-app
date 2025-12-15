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
          {
            type: 'Book',
            id: feedable.id,
            title: feedable.title,
            author_name: feedable.author.name,
            cover_image_url: feedable.cover_image_url,
            release_date: feedable.release_date
          }
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
        end
      end
    end
  end
end

