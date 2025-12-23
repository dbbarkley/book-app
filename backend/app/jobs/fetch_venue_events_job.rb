class FetchVenueEventsJob < ApplicationJob
  queue_as :default

  def perform(venue_id)
    venue = Venue.find(venue_id)

    adapters = [
      EventSources::EventbriteAdapter.new,
      EventSources::BookstoreAdapter.new,
      EventSources::LibraryAdapter.new
    ]

    adapters.each do |adapter|
      events_data = adapter.fetch_events(venue: venue)
      
      events_data.each do |data|
        # Ensure required fields exist before processing
        next if data[:title].blank? || data[:starts_at].blank?

        event = Event.find_or_initialize_by(
          external_source: data[:external_source], 
          external_id: data[:external_id]
        )
        
        # Update event attributes and link to venue
        event.assign_attributes(data.merge(venue: venue))
        
        if event.save
          # Attempt to match authors for new or updated events
          EventAuthorMatcher.new(event).match_authors!
        else
          Rails.logger.error "[FetchVenueEventsJob] Failed to save event '#{event.title}': #{event.errors.full_messages.join(', ')}"
        end
      end
    end
    
    venue.update!(last_fetched_at: Time.current)
  end
end

