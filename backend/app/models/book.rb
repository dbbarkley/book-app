class Book < ApplicationRecord
  validates :title, presence: true
  validates :release_date, presence: true
  validates :author_id, presence: true
  validates :isbn, uniqueness: true, allow_nil: true
  validates :google_books_id, uniqueness: true, allow_nil: true

  scope :upcoming, -> { where('release_date > ?', Date.current) }
  scope :by_author, ->(author_id) { where(author_id: author_id) }
  scope :recently_released, -> { where('release_date <= ? AND release_date >= ?', Date.current, 30.days.ago) }

  belongs_to :author
  has_many :follows, as: :followable, dependent: :destroy
  has_many :followers, through: :follows, source: :follower
  has_many :events, dependent: :destroy
  has_many :user_books, dependent: :destroy

  # Categories are stored as a JSONB array of strings
  # Example: ["Fiction", "Fantasy", "Young Adult"]
end

