class Event < ApplicationRecord
  # Status enum for event lifecycle
  enum :status, {
    upcoming: "upcoming",
    cancelled: "cancelled",
    past: "past"
  }, default: "upcoming"

  # Associations
  belongs_to :venue, optional: true
  belongs_to :author, optional: true # Legacy/Direct association
  belongs_to :book, optional: true
  
  has_many :event_authors, dependent: :destroy
  has_many :authors, through: :event_authors

  # Validations
  validates :title, presence: true
  validates :event_type, presence: true
  validates :starts_at, presence: true
  validates :external_source, presence: true
  validates :external_id, presence: true, uniqueness: { scope: :external_source }, allow_nil: true

  # Constants
  EVENT_TYPES = %w[book_release author_announcement signing reading storytime interview tour virtual_event].freeze
  EVENT_AUDIENCES = %w[kids young_adult adult].freeze

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :audience_type, inclusion: { in: EVENT_AUDIENCES }, allow_nil: true

  # Scopes
  scope :upcoming, -> { where(status: :upcoming).where('starts_at > ?', Time.current) }
  scope :by_author, ->(author_id) { 
    left_outer_joins(:event_authors)
      .where("events.author_id = ? OR event_authors.author_id = ?", author_id, author_id)
      .distinct 
  }
  scope :by_zipcode, ->(zipcode, radius = nil) { 
    if radius.present?
      # Try to find a venue with this zipcode to use its coordinates as center
      # This avoids hitting external geocoding APIs which can be slow or blocked
      center_venue = Venue.find_by(zipcode: zipcode)
      coords = if center_venue && center_venue.latitude && center_venue.longitude
                 [center_venue.latitude, center_venue.longitude]
               elsif Rails.env.development?
                 # Development fallback for common testing zipcodes if geocoding is blocked
                 {
                   "78701" => [30.2716, -97.7437],
                   "78704" => [30.2444, -97.7637],
                   "78205" => [29.4241, -98.4936],
                   "78260" => [29.7400, -98.4500]
                 }[zipcode.to_s]
               end

      if coords
        venue_ids = Venue.near(coords, radius.to_i).reorder(nil).pluck(:id)
        where(venue_id: venue_ids)
      else
        # Fallback to geocoding if no venue found with that zip and no mock
        begin
          venue_ids = Venue.near(zipcode, radius.to_i).reorder(nil).pluck(:id)
          where(venue_id: venue_ids)
        rescue StandardError => e
          Rails.logger.error "Geocoding failed for #{zipcode}: #{e.message}"
          joins(:venue).where(venues: { zipcode: zipcode }) # Last fallback: exact match
        end
      end
    else
      joins(:venue).where(venues: { zipcode: zipcode }) 
    end
  }
  scope :by_city, ->(city, state) { joins(:venue).where(venues: { city: city, state: state }) }
  scope :starts_after, ->(datetime) { where('starts_at > ?', datetime) }

  # Events belong to venues and may optionally be linked to authors.
  # This multi-author support via join table allows for panels and festivals.
end
