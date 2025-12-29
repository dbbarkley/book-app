class UserActivityFeedService < BaseService
  def initialize(actor:, feedable:, activity_type:, metadata: {})
    @actor = actor
    @feedable = feedable
    @activity_type = activity_type
    @metadata = metadata || {}
  end

  private

  def execute
    recipients = @actor.followers.to_a
    recipients << @actor
    recipients << @feedable if @feedable.is_a?(User)

    recipients.uniq!

    payload = @metadata.deep_dup
    payload[:actor] = actor_payload

    created_items = recipients.map do |recipient|
      FeedItem.find_or_create_by(
        user: recipient,
        feedable: @feedable,
        activity_type: @activity_type
      ) do |item|
        item.metadata = payload
      end
    end

    success!(created_items.select(&:persisted?))
  end

  def actor_payload
    {
      id: @actor.id,
      username: @actor.username,
      display_name: @actor.display_name,
      avatar_url: @actor.avatar_url_with_attachment
    }
  end
end
