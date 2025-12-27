class Venue < ApplicationRecord
  enum :venue_type, {
    bookstore: "bookstore",
    library: "library",
    theater: "theater",
    university: "university",
    other: "other"
  }, default: "other"

  has_many :events, dependent: :destroy

  geocoded_by :full_address
  # after_validation :geocode, if: ->(obj){ obj.address_changed? || obj.city_changed? || obj.state_changed? || obj.zipcode_changed? }

  validates :name, presence: true
  validates :source, presence: true
  validates :external_id, presence: true, uniqueness: { scope: :source }

  scope :active, -> { where(active: true) }
  scope :by_location, ->(city, state = nil) { 
    if state.present?
      where(city: city, state: state)
    else
      where(city: city)
    end
  }
  scope :by_zipcode, ->(zipcode, radius = nil) { 
    if radius.present?
      # Try to find a venue with this zipcode to use its coordinates as center
      # to avoid hitting external geocoding APIs frequently
      center_venue = Venue.find_by(zipcode: zipcode)
      coords = if center_venue && center_venue.latitude && center_venue.longitude
                 [center_venue.latitude, center_venue.longitude]
               elsif Rails.env.development?
                 # Development fallback for common testing zipcodes
                 {
                   "78701" => [30.2716, -97.7437],
                   "78704" => [30.2444, -97.7637],
                   "78205" => [29.4241, -98.4936],
                   "78260" => [29.7400, -98.4500]
                 }[zipcode.to_s]
               end

      if coords
        near(coords, radius.to_i)
      else
        near(zipcode, radius.to_i) rescue where(zipcode: zipcode)
      end
    else
      where(zipcode: zipcode)
    end
  }

  # Venues are the anchor for event discovery.
  # They are globally cached and shared across users to prevent redundant API calls.
  def full_address
    [address, city, state, zipcode].compact.join(', ')
  end
end

