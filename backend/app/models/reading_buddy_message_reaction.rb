class ReadingBuddyMessageReaction < ApplicationRecord
  belongs_to :reading_buddy_message
  belongs_to :user

  ALLOWED_EMOJIS = ['❤️', '😂', '🤯', '👀', '💔'].freeze

  validates :emoji, presence: true, inclusion: { in: ALLOWED_EMOJIS }
  validates :user_id, uniqueness: { scope: [:reading_buddy_message_id, :emoji] }
end
