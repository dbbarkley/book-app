class Series < ApplicationRecord
  has_many :book_catalogs, foreign_key: :series_id, dependent: :nullify

  validates :name,                presence: true
  validates :hardcover_series_id, presence: true, uniqueness: true

  STALE_AFTER = 90.days

  def stale?
    fetched_at.nil? || fetched_at < STALE_AFTER.ago
  end
end
