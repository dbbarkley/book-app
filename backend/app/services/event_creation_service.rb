class EventCreationService < BaseService
  def initialize(author, event_params)
    @author = author
    @event_params = event_params
  end

  private

  def execute
    @event = @author.events.build(@event_params)

    if @event.save
      enqueue_feed_generation
      success!(@event)
    else
      failure!(@event.errors.full_messages)
    end
  end

  def enqueue_feed_generation
    activity_type = @event.event_type == 'author_announcement' ? 'author_announcement' : 'author_event'
    
    GenerateFeedItemsJob.perform_later(
      'Event',
      @event.id,
      activity_type,
      {
        event_title: @event.title,
        event_type: @event.event_type,
        starts_at: @event.starts_at.iso8601
      }
    )
  end
end

