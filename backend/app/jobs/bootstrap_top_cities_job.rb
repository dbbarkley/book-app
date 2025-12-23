class BootstrapTopCitiesJob < ApplicationJob
  queue_as :default

  TOP_CITIES = [
    # { city: "New York", state: "NY" },
    # { city: "Los Angeles", state: "CA" },
    # { city: "Chicago", state: "IL" },
    # { city: "Austin", state: "TX" },
    { city: "San Antonio", state: "TX" },
    # { city: "Seattle", state: "WA" },
    # { city: "San Francisco", state: "CA" }
  ].freeze

  def perform
    TOP_CITIES.each do |loc|
      # Only process if it needs a refresh
      if ProcessedLocation.needs_refresh?(loc[:city], loc[:state])
        # First discover venues in the city
        DiscoverVenuesJob.perform_later(city: loc[:city], state: loc[:state])
        
        # Mark as searched
        ProcessedLocation.mark_searched!(loc[:city], loc[:state])
      end
    end
  end
  
  # This job is intended to run once or periodically to seed the initial experience.
end

