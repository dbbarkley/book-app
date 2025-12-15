class BackfillFeedItemsJob < ApplicationJob
  queue_as :default

  def perform(user_id, followable_type, followable_id)
    user = User.find(user_id)
    followable = followable_type.constantize.find(followable_id)

    # Backfill recent items (last 30 days)
    recent_items = find_recent_feedable_items(followable)

    recent_items.each do |item|
      FeedItem.find_or_create_by(
        user: user,
        feedable: item,
        activity_type: determine_activity_type(item)
      )
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("Backfill failed: #{e.message}")
  end

  private

  def find_recent_feedable_items(followable)
    case followable
    when Author
      # Recent books and events
      books = followable.books.where('release_date > ?', 30.days.ago)
      events = followable.events.where('created_at > ?', 30.days.ago)
      books + events
    when Book
      # Just this book if recently released
      followable.release_date > 30.days.ago ? [followable] : []
    else
      []
    end
  end

  def determine_activity_type(item)
    case item
    when Book
      'book_release'
    when Event
      'author_event'
    else
      'unknown'
    end
  end
end

