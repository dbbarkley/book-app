class GenerateFeedItemsJob < ApplicationJob
  queue_as :default

  def perform(feedable_type, feedable_id, activity_type, metadata = {})
    service = FeedGenerationService.new(
      feedable_type,
      feedable_id,
      activity_type,
      metadata
    )

    result = service.call

    unless result.success?
      Rails.logger.error("Feed generation failed: #{result.errors.join(', ')}")
      raise StandardError, "Feed generation failed: #{result.errors.join(', ')}"
    end
  end
end

