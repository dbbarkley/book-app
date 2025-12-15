class Notification < ApplicationRecord
  validates :user_id, presence: true
  validates :notifiable_type, presence: true
  validates :notifiable_id, presence: true
  validates :notification_type, presence: true

  NOTIFICATION_TYPES = %w[new_follower book_release event_reminder author_announcement].freeze

  validates :notification_type, inclusion: { in: NOTIFICATION_TYPES }

  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :recent, -> { order(created_at: :desc) }

  belongs_to :user
  belongs_to :notifiable, polymorphic: true

  def read?
    read_at.present?
  end

  def mark_as_read!
    update(read_at: Time.current) unless read?
  end
end

