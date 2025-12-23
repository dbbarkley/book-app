module VenueSources
  class GooglePlacesAdapter
    include HTTParty
    base_uri 'https://maps.googleapis.com/maps/api/place'

    # Google Places types relevant to literary events
    PLACE_TYPES = ["book_store", "library", "university"].freeze

    def initialize
      @api_key = ENV['GOOGLE_PLACES_API_KEY']
    end

    def fetch_venues(city: nil, state: nil, zipcode: nil)
      query = [city, state, zipcode].compact.join(" ")
      return [] if query.blank?

      venues = []

      PLACE_TYPES.each do |type|
        response = self.class.get("/textsearch/json", query: {
          query: "#{type} in #{query}",
          type: type,
          key: @api_key
        })

        if response.success?
          results = response.parsed_response["results"] || []
          # For each result, we fetch full details to get website and accurate lat/lng
          results.each do |result|
            venues << fetch_venue_details(result["place_id"])
          end
        else
          Rails.logger.error "GooglePlacesAdapter API error: #{response.code} - #{response.message}"
        end
      end

      venues.compact.uniq { |v| v[:external_id] }
    rescue StandardError => e
      Rails.logger.error "GooglePlacesAdapter error: #{e.message}"
      []
    end

    protected

    def fetch_venue_details(place_id)
      response = self.class.get("/details/json", query: {
        place_id: place_id,
        fields: "name,formatted_address,address_components,geometry,type,website,place_id",
        key: @api_key
      })

      return nil unless response.success?
      raw = response.parsed_response["result"]
      return nil unless raw

      {
        name: raw["name"],
        address: raw["formatted_address"],
        city: parse_address_component(raw, "locality"),
        state: parse_address_component(raw, "administrative_area_level_1"),
        zipcode: parse_address_component(raw, "postal_code"),
        latitude: raw.dig("geometry", "location", "lat"),
        longitude: raw.dig("geometry", "location", "lng"),
        website_url: raw["website"],
        venue_type: map_type(raw["types"]),
        source: "google_places",
        external_id: raw["place_id"]
      }
    end

    private

    def map_type(types)
      return :bookstore if types.include?("book_store")
      return :library if types.include?("library")
      return :university if types.include?("university")
      :other
    end

    def parse_address_component(raw, type)
      components = raw["address_components"] || []
      components.find { |c| c["types"]&.include?(type) }&.fetch("long_name", nil)
    end
  end
end
