class RefreshCityEventsJob < ApplicationJob
  queue_as :default

  def perform(city:, state:)
    Venue.where(city: city, state: state, active: true).find_each do |venue|
      FetchVenueEventsJob.perform_later(venue.id)
    end
  end
end

