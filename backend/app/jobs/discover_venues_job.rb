class DiscoverVenuesJob < ApplicationJob
  queue_as :default

  def perform(city: nil, state: nil, zipcode: nil)
    adapter = VenueSources::GooglePlacesAdapter.new
    venues_data = adapter.fetch_venues(city: city, state: state, zipcode: zipcode)

    venues_data.each do |data|
      venue = Venue.find_or_initialize_by(source: data[:source], external_id: data[:external_id])
      venue.update!(data.merge(last_fetched_at: Time.current))
      
      # Once a venue is discovered, immediately fetch its events
      FetchVenueEventsJob.perform_later(venue.id) if venue.persisted?
    end
  end
end

