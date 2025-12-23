class NotificationService < BaseService
  def initialize(notifiable, notification_type, metadata = {})
    @notifiable = notifiable
    @notification_type = notification_type
    @metadata = metadata
  end

  def create_for_user(user)
    notification = Notification.create(
      user: user,
      notifiable: @notifiable,
      notification_type: @notification_type
    )

    notification.persisted? ? success!(notification) : failure!(notification.errors.full_messages)
  end

  def create_for_followers
    followers = find_followers
    return success!([]) if followers.empty?

    notifications = followers.map do |follower|
      Notification.create(
        user: follower,
        notifiable: @notifiable,
        notification_type: @notification_type
      )
    end

    success!(notifications.select(&:persisted?))
  end

  private

  def find_followers
    case @notifiable
    when Book
      # Followers of book + users who have the book on their shelf
      book_followers = User.joins(:follows)
                          .where(follows: { followable: @notifiable })
      
      shelf_users = User.joins(:user_books)
                        .where(user_books: { book_id: @notifiable.id })
      
      (book_followers + shelf_users).uniq
    when Author
      User.joins(:follows)
          .where(follows: { followable: @notifiable })
          .distinct
    when User
      User.joins(:follows)
          .where(follows: { followable: @notifiable })
          .distinct
    else
      []
    end
  end
end

