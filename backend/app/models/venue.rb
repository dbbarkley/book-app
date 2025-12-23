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
  scope :by_location, ->(city, state) { where(city: city, state: state) }
  scope :by_zipcode, ->(zipcode) { where(zipcode: zipcode) }

  # Venues are the anchor for event discovery.
  # They are globally cached and shared across users to prevent redundant API calls.
  def full_address
    [address, city, state, zipcode].compact.join(', ')
  end
end

