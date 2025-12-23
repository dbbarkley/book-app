class ProcessedLocation < ApplicationRecord
  validates :city, presence: true
  validates :state, presence: true
  
  # Check if a location needs a refresh (e.g., if it was searched more than 30 days ago)
  def self.needs_refresh?(city, state)
    location = find_by(city: city, state: state)
    return true unless location
    
    location.last_searched_at < 30.days.ago
  end

  def self.mark_searched!(city, state, zipcode = nil)
    location = find_or_initialize_by(city: city, state: state)
    location.zipcode = zipcode if zipcode
    location.last_searched_at = Time.current
    location.save!
  end
end

