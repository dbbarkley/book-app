class UserBook < ApplicationRecord
  validates :shelf, presence: true, inclusion: { in: %w[to_read reading read] }
  validates :user_id, presence: true
  validates :book_id, presence: true
  validates :user_id, uniqueness: { scope: :book_id }
  validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }, allow_nil: true

  belongs_to :user
  belongs_to :book

  # Scopes
  scope :to_read, -> { where(shelf: 'to_read') }
  scope :reading, -> { where(shelf: 'reading') }
  scope :read, -> { where(shelf: 'read') }
  scope :by_shelf, ->(shelf) { where(shelf: shelf) }
  scope :rated, -> { where.not(rating: nil) }
  scope :reviewed, -> { where.not(review: nil) }

  # Calculate completion percentage when pages are updated
  before_save :calculate_completion_percentage

  private

  def calculate_completion_percentage
    if pages_read.present? && total_pages.present? && total_pages > 0
      self.completion_percentage = ((pages_read.to_f / total_pages) * 100).round
    end
  end
end

