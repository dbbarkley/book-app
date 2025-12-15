class FeedItem < ApplicationRecord
  validates :user_id, presence: true
  validates :feedable_type, presence: true
  validates :feedable_id, presence: true
  validates :activity_type, presence: true

  ACTIVITY_TYPES = %w[book_release author_event author_announcement].freeze

  validates :activity_type, inclusion: { in: ACTIVITY_TYPES }

  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :by_activity_type, ->(type) { where(activity_type: type) }
  scope :recent, -> { order(created_at: :desc) }

  belongs_to :user
  belongs_to :feedable, polymorphic: true
end

