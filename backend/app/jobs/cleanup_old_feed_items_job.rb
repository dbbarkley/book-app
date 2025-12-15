class CleanupOldFeedItemsJob < ApplicationJob
  queue_as :low_priority

  def perform(retention_days = 90)
    cutoff_date = retention_days.days.ago

    deleted_count = FeedItem.where('created_at < ?', cutoff_date).delete_all

    Rails.logger.info("Cleaned up #{deleted_count} feed items older than #{retention_days} days")
  end
end

