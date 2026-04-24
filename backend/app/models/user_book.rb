class UserBook < ApplicationRecord
  STATUSES = %w[to_read reading read dnf].freeze
  VISIBILITIES = %w[public private].freeze

  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :visibility, presence: true, inclusion: { in: VISIBILITIES }
  validates :shelf, presence: true, inclusion: { in: STATUSES }
  validates :user_id, presence: true
  validates :book_id, presence: true
  validates :user_id, uniqueness: { scope: :book_id }
  validates :rating, numericality: { greater_than_or_equal_to: 0.25, less_than_or_equal_to: 5 }, allow_nil: true

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

  # ── Feed fan-out ─────────────────────────────────────────────────────────────
  after_create_commit  :fan_out_added_to_shelf
  after_update_commit  :fan_out_status_or_review_change

  private

  def fan_out_added_to_shelf
    return if visibility == 'private'
    return unless %w[to_read reading].include?(status)

    GenerateUserActivityFeedItemsJob.perform_later(
      user_id, 'UserBook', id, 'user_added_book',
      { 'book' => book_metadata }
    )
  end

  def fan_out_status_or_review_change
    return if visibility == 'private'

    if saved_change_to_status?
      old_status, new_status = saved_change_to_status
      if new_status == 'read' && old_status != 'read'
        GenerateUserActivityFeedItemsJob.perform_later(
          user_id, 'UserBook', id, 'user_finished_book',
          { 'book' => book_metadata }
        )
      end
    end

    if saved_change_to_review? && review.present? && saved_changes['review'].first.blank?
      GenerateUserActivityFeedItemsJob.perform_later(
        user_id, 'UserBook', id, 'user_review',
        { 'book' => book_metadata, 'rating' => rating, 'review' => review }
      )
    end
  end

  def book_metadata
    {
      'id'             => book.id,
      'title'          => book.title,
      'author_name'    => book.author&.name,
      'cover_image_url'=> book.cover_image_url,
      'google_books_id'=> book.google_books_id,
    }
  end

  # def update_genre_xp
  #   if saved_change_to_pages_read?
  #     old_pages, new_pages = saved_change_to_pages_read
  #     delta = new_pages.to_i - old_pages.to_i
  #     GenreXpService.award_xp(user, book, delta, self) if delta > 0
  #   end
  # end

  def sync_status_with_shelf
    # If status is default or blank, and shelf is something else, trust shelf
    if (status == 'to_read' || status.blank?) && shelf.present? && shelf != 'to_read'
      self.status = shelf
    end

    # Keep them in sync
    if status.present?
      self.shelf = status
    elsif shelf.present?
      self.status = shelf
    end

    self.status ||= 'to_read'
    self.shelf ||= status
    self.visibility = 'public' if visibility.blank?
  end

  def calculate_completion_percentage
    if pages_read.present? && total_pages.present? && total_pages > 0
      self.completion_percentage = ((pages_read.to_f / total_pages) * 100).round
    end
  end
end

