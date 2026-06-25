module Api
  module V1
    class FeedController < BaseController
      include Authenticable
      before_action :authenticate_user!

      PERSONAL_NOTIFICATION_TYPES = %w[friend_request friend_accepted book_suggestion].freeze

      # GET /api/v1/feed
      def index
        page     = params[:page]&.to_i || 1
        per_page = [params[:per_page]&.to_i || 30, 100].min
        last_viewed = current_user.last_feed_viewed_at

        # Accurate totals from the DB for correct pagination metadata.
        feed_total  = current_user.feed_items.count
        notif_total = current_user.notifications
                                  .where(notification_type: PERSONAL_NOTIFICATION_TYPES).count
        total = feed_total + notif_total

        # Load enough rows from each source to cover the requested page.
        # Worst-case: every entry on this page comes from one source alone.
        load_limit = page * per_page

        # preload(:feedable) correctly groups by feedable_type and issues one
        # query per type, avoiding the N+1 that includes() causes on a polymorphic
        # association when sub-associations (:book, :author) don't exist on every type.
        feed_items = current_user.feed_items
                                 .preload(:feedable)
                                 .order(created_at: :desc)
                                 .limit(load_limit)
                                 .to_a

        # Preload :book for UserBook feedables in a single extra query.
        user_book_feedables = feed_items.filter_map { |fi| fi.feedable if fi.feedable.is_a?(UserBook) }
        ActiveRecord::Associations::Preloader.new(records: user_book_feedables, associations: :book).call if user_book_feedables.any?

        notifications = current_user.notifications
                                    .where(notification_type: PERSONAL_NOTIFICATION_TYPES)
                                    .includes(:notifiable)
                                    .order(created_at: :desc)
                                    .limit(load_limit)

        feed_entries = serialize_feed_items(feed_items, last_viewed) +
                       serialize_notifications(notifications, last_viewed)

        feed_entries.sort_by! { |e| e[:created_at] }.reverse!

        page_entries = feed_entries.slice((page - 1) * per_page, per_page) || []

        render json: {
          entries: page_entries,
          pagination: {
            page: page,
            per_page: per_page,
            total_count: total,
            total_pages: (total.to_f / per_page).ceil
          }
        }, status: :ok
      end

      # POST /api/v1/feed/mark_viewed
      def mark_viewed
        current_user.update_column(:last_feed_viewed_at, Time.current)
        render json: { ok: true }, status: :ok
      end

      # GET /api/v1/feed/unread_count
      def unread_count
        last_viewed = current_user.last_feed_viewed_at

        if last_viewed.nil?
          count = [current_user.feed_items.count +
                   current_user.notifications.where(notification_type: PERSONAL_NOTIFICATION_TYPES).count, 99].min
        else
          feed_count  = current_user.feed_items.where('created_at > ?', last_viewed).count
          notif_count = current_user.notifications
                                    .where(notification_type: PERSONAL_NOTIFICATION_TYPES)
                                    .where('created_at > ?', last_viewed).count
          count = [feed_count + notif_count, 99].min
        end

        render json: { count: count }, status: :ok
      end

      private

      def serialize_feed_items(feed_items, last_viewed)
        actor_ids = feed_items.map { |i| i.metadata&.dig('actor', 'id') }.compact.uniq
        actors    = User.where(id: actor_ids).index_by(&:id)

        feed_items.filter_map do |item|
          feedable = item.feedable
          next if feedable.is_a?(UserBook) && feedable.visibility == 'private'
          next if item.metadata&.dig('actor', 'id') == current_user.id

          metadata = item.metadata&.dup || {}
          if (actor_id = metadata.dig('actor', 'id')) && (actor = actors[actor_id])
            metadata['actor'] = {
              'id'           => actor.id,
              'username'     => actor.username,
              'display_name' => actor.display_name,
              'avatar_url'   => actor.avatar_url_with_attachment,
            }
          end

          {
            id:            "fi_#{item.id}",
            kind:          'activity',
            activity_type: item.activity_type,
            new:           last_viewed.nil? || item.created_at > last_viewed,
            metadata:      metadata,
            feedable:      serialize_feedable(feedable),
            created_at:    item.created_at,
          }
        end
      end

      def serialize_notifications(notifications, last_viewed)
        notifications.filter_map do |notif|
          payload = serialize_notification_payload(notif)
          next unless payload

          {
            id:            "no_#{notif.id}",
            kind:          'notification',
            activity_type: notif.notification_type,
            new:           last_viewed.nil? || notif.created_at > last_viewed,
            metadata:      payload,
            feedable:      nil,
            created_at:    notif.created_at,
          }
        end
      end

      def serialize_notification_payload(notif)
        case notif.notification_type
        when 'friend_request', 'friend_accepted'
          friendship = notif.notifiable
          return nil unless friendship
          other = if friendship.requester_id == current_user.id
            friendship.requestee
          else
            friendship.requester
          end
          return nil unless other
          {
            'friendship_id' => friendship.id,
            'user'          => serialize_user_mini(other),
          }
        when 'book_suggestion'
          suggestion = notif.notifiable
          return nil unless suggestion
          {
            'suggestion_id' => suggestion.id,
            'message'       => suggestion.message,
            'suggester'     => serialize_user_mini(suggestion.suggester),
            'book' => {
              'id'              => suggestion.book.id,
              'title'           => suggestion.book.title,
              'author_name'     => suggestion.book.author&.name,
              'cover_image_url' => suggestion.book.resolved_cover_url,
              'google_books_id' => suggestion.book.google_books_id,
            },
          }
        end
      end

      def serialize_user_mini(user)
        {
          'id'           => user.id,
          'username'     => user.username,
          'display_name' => user.display_name,
          'avatar_url'   => user.avatar_url_with_attachment,
        }
      end

      def serialize_feedable(feedable)
        case feedable
        when UserBook then serialize_user_book_feedable(feedable)
        when Book     then serialize_book_payload(feedable).merge('type' => 'Book')
        when Author   then { 'type' => 'Author', 'id' => feedable.id, 'name' => feedable.name, 'avatar_url' => feedable.avatar_url }
        when User     then serialize_user_mini(feedable).merge('type' => 'User')
        when Event
          {
            'type'         => 'Event',
            'id'           => feedable.id,
            'title'        => feedable.title,
            'event_type'   => feedable.event_type,
            'starts_at'    => feedable.starts_at,
            'location'     => feedable.location,
            'is_virtual'   => feedable.is_virtual,
            'image_url'    => feedable.image_url,
            'external_url' => feedable.external_url,
            'author_name'  => feedable.author&.name,
          }
        end
      end

      def serialize_user_book_feedable(ub)
        {
          'type'                  => 'UserBook',
          'id'                    => ub.id,
          'status'                => ub.status,
          'visibility'            => ub.visibility,
          'rating'                => ub.rating,
          'review'                => ub.review,
          'pages_read'            => ub.pages_read,
          'total_pages'           => ub.total_pages,
          'completion_percentage' => ub.completion_percentage,
          'finished_at'           => ub.finished_at,
          'book'                  => ub.book ? serialize_book_payload(ub.book) : nil,
        }
      end

      def serialize_book_payload(book)
        {
          'id'              => book.id,
          'title'           => book.title,
          'author_name'     => book.author&.name,
          'cover_image_url' => book.resolved_cover_url,
          'google_books_id' => book.google_books_id,
        }
      end
    end
  end
end
