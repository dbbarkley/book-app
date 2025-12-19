class GenerateUserActivityFeedItemsJob < ApplicationJob
  queue_as :default

  def perform(actor_id, feedable_type, feedable_id, activity_type, metadata = {})
    actor = User.find(actor_id)
    feedable_class = feedable_type.constantize
    feedable = feedable_class.find(feedable_id)

    result = UserActivityFeedService.new(
      actor: actor,
      feedable: feedable,
      activity_type: activity_type,
      metadata: metadata
    ).call

    unless result.success?
      Rails.logger.error("User activity feed generation failed: #{result.errors.join(', ')}")
      raise StandardError, "User activity feed generation failed: #{result.errors.join(', ')}"
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("User activity feed generation failed: #{e.message}")
  end
end
