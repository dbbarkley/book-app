class UserBook < ApplicationRecord
  STATUSES = %w[to_read reading read dnf].freeze
  VISIBILITIES = %w[public private].freeze

  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :visibility, presence: true, inclusion: { in: VISIBILITIES }
  validates :shelf, presence: true, inclusion: { in: STATUSES }
  validates :user_id, presence: true
  validates :book_id, presence: true
  validates :user_id, uniqueness: { scope: :book_id }
  validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }, allow_nil: true

  belongs_to :user
  belongs_to :book

  # Scopes
  scope :to_read, -> { where(status: 'to_read') }
  scope :reading, -> { where(status: 'reading') }
  scope :read, -> { where(status: 'read') }
  scope :dnf, -> { where(status: 'dnf') }
  scope :by_status, ->(status) { where(status: status) }
  scope :publicly_visible, -> { where(visibility: 'public') }
  scope :rated, -> { where.not(rating: nil) }
  scope :reviewed, -> { where.not(review: nil) }

  # Calculate completion percentage when pages are updated
  before_save :calculate_completion_percentage
  before_validation :sync_status_with_shelf

  private

  def sync_status_with_shelf
    if status.blank? && shelf.present?
      self.status = shelf
    end
    if status.present?
      self.shelf = status
    end
    self.visibility = 'public' if visibility.blank?
  end

  def calculate_completion_percentage
    if pages_read.present? && total_pages.present? && total_pages > 0
      self.completion_percentage = ((pages_read.to_f / total_pages) * 100).round
    end
  end
end

