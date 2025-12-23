class LocationDiscoveryService < BaseService
  def initialize(zipcode)
    @zipcode = zipcode
  end

  def call
    Rails.logger.info "[LocationDiscoveryService] Starting discovery for zipcode: #{@zipcode}"
    return unless @zipcode.present?

    # Resolve zipcode to city/state
    results = Geocoder.search(@zipcode)
    
    if results.empty?
      Rails.logger.warn "[LocationDiscoveryService] No geocoding results found for zipcode: #{@zipcode}"
      return
    end

    result = results.first
    city = result.city
    state = result.state_code || result.state

    unless city.present? && state.present?
      Rails.logger.warn "[LocationDiscoveryService] Could not resolve city/state for zipcode: #{@zipcode} (Found: #{city}, #{state})"
      return
    end

    Rails.logger.info "[LocationDiscoveryService] Resolved #{@zipcode} to #{city}, #{state}"

    # Check if we've already searched this city recently
    if ProcessedLocation.needs_refresh?(city, state)
      Rails.logger.info "[LocationDiscoveryService] Triggering discovery for #{city}, #{state} (zip: #{@zipcode})"
      
      # Trigger the venue discovery job
      DiscoverVenuesJob.perform_later(city: city, state: state, zipcode: @zipcode)
      
      # Mark as searched
      ProcessedLocation.mark_searched!(city, state, @zipcode)
    else
      Rails.logger.info "[LocationDiscoveryService] #{city}, #{state} already searched recently. Skipping."
    end
  end
end

