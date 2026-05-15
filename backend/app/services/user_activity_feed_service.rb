class UserActivityFeedService < BaseService
  def initialize(actor:, feedable:, activity_type:, metadata: {})
    @actor = actor
    @feedable = feedable
    @activity_type = activity_type
    @metadata = metadata || {}
  end

  private

  def execute
    # Collect recipient IDs using pluck to avoid loading full User records into memory.
    recipient_ids = Set.new
    recipient_ids.merge(@actor.followers.pluck(:id))
    recipient_ids.merge(@actor.friends.pluck(:id))
    recipient_ids << @actor.id
    recipient_ids << @feedable.id if @feedable.is_a?(User)

    payload = @metadata.deep_dup
    payload[:actor] = actor_payload

    created_items = recipient_ids.map do |uid|
      item = FeedItem.find_or_initialize_by(
        user_id:       uid,
        feedable_type: @feedable.class.name,
        feedable_id:   @feedable.id,
        activity_type: @activity_type
      )
      item.metadata = payload
      item.save
      item
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
