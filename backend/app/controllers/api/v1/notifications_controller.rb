module Api
  module V1
    class NotificationsController < BaseController
      def index
        notifications = current_user.notifications.recent
        render json: serialize_notifications(notifications), status: :ok
      end

      def unread
        notifications = current_user.notifications.unread.recent
        render json: serialize_notifications(notifications), status: :ok
      end

      def read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!
        render json: serialize_notification(notification), status: :ok
      end

      def read_all
        current_user.notifications.unread.update_all(read_at: Time.current)
        render json: { message: 'All notifications marked as read' }, status: :ok
      end

      private

      def serialize_notifications(notifications)
        notifications.map { |notification| serialize_notification(notification) }
      end

      def serialize_notification(notification)
        {
          id: notification.id,
          notification_type: notification.notification_type,
          read: notification.read?,
          read_at: notification.read_at,
          notifiable: serialize_notifiable(notification.notifiable),
          created_at: notification.created_at
        }
      end

      def serialize_notifiable(notifiable)
        case notifiable
        when Book
          {
            type: 'Book',
            id: notifiable.id,
            title: notifiable.title,
            cover_image_url: notifiable.cover_image_url
          }
        when Author
          {
            type: 'Author',
            id: notifiable.id,
            name: notifiable.name,
            avatar_url: notifiable.avatar_url
          }
        when User
          {
            type: 'User',
            id: notifiable.id,
            username: notifiable.username,
            display_name: notifiable.display_name,
            avatar_url: notifiable.avatar_url_with_attachment
          }
        end
      end
    end
  end
end

