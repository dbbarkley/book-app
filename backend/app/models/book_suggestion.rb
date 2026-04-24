class BookSuggestion < ApplicationRecord
  STATUSES = %w[pending viewed dismissed].freeze

  belongs_to :suggester, class_name: 'User'
  belongs_to :recipient, class_name: 'User'
  belongs_to :book

  validates :status, inclusion: { in: STATUSES }
  validates :suggester_id, uniqueness: {
    scope: [:recipient_id, :book_id],
    message: 'already suggested this book to this friend'
  }
  validate :not_self_suggestion

  scope :pending,   -> { where(status: 'pending') }
  scope :for_user,  ->(user) { where(recipient: user) }
  scope :from_user, ->(user) { where(suggester: user) }

  def mark_viewed!
    update(status: 'viewed') if status == 'pending'
  end

  def dismiss!
    update(status: 'dismissed')
  end

  private

  def not_self_suggestion
    errors.add(:base, "You can't suggest a book to yourself") if suggester_id == recipient_id
  end
end
