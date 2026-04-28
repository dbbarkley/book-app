class ReadingBuddySession < ApplicationRecord
  STATUSES = %w[pending active declined dnf].freeze

  belongs_to :book
  belongs_to :initiator, class_name: 'User'
  belongs_to :invited,   class_name: 'User'
  has_many   :messages,
             class_name:  'ReadingBuddyMessage',
             foreign_key: :reading_buddy_session_id,
             dependent:   :destroy
  has_many   :highlights,
             class_name:  'ReadingBuddyHighlight',
             foreign_key: :reading_buddy_session_id,
             dependent:   :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :initiator_id, uniqueness: {
    scope:   [:invited_id, :book_id],
    message: 'already has a session for this book with this user'
  }
  validate :not_self_session
  validate :must_be_friends

  scope :pending,   -> { where(status: 'pending') }
  scope :active,    -> { where(status: 'active') }
  scope :involving, ->(user) {
    where('initiator_id = ? OR invited_id = ?', user.id, user.id)
  }
  scope :open, -> { where(status: %w[pending active]) }

  # ── Helpers ─────────────────────────────────────────────────────────────────

  def other_user(current_user)
    initiator_id == current_user.id ? invited : initiator
  end

  def participant?(user)
    initiator_id == user.id || invited_id == user.id
  end

  def accept!
    update!(status: 'active', started_at: Time.current)
  end

  def decline!
    update!(status: 'declined')
  end

  def dnf!
    update!(status: 'dnf')
  end

  private

  def not_self_session
    errors.add(:base, 'Cannot create a reading buddy session with yourself') if initiator_id == invited_id
  end

  def must_be_friends
    return unless initiator && invited
    unless initiator.friends_with?(invited)
      errors.add(:base, 'You can only start a reading buddy session with a friend')
    end
  end
end
