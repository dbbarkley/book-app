class Event < ApplicationRecord
  validates :title, presence: true
  validates :event_type, presence: true
  validates :starts_at, presence: true
  validates :author_id, presence: true

  EVENT_TYPES = %w[book_release author_announcement signing reading interview].freeze

  validates :event_type, inclusion: { in: EVENT_TYPES }

  scope :upcoming, -> { where('starts_at > ?', Time.current) }
  scope :by_author, ->(author_id) { where(author_id: author_id) }
  scope :starts_after, ->(datetime) { where('starts_at > ?', datetime) }

  belongs_to :author
  belongs_to :book, optional: true
end

