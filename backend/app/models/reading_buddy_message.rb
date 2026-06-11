class ReadingBuddyMessage < ApplicationRecord
  belongs_to :reading_buddy_session
  belongs_to :user
  has_many   :reactions, class_name: 'ReadingBuddyMessageReaction', dependent: :destroy

  validates :content, presence: true, length: { maximum: 2000 }

  after_create_commit :broadcast_to_session

  private

  def broadcast_to_session
    ActionCable.server.broadcast(
      "reading_buddy_session_#{reading_buddy_session_id}",
      {
        type:    'new_message',
        message: {
          id:         id,
          content:    content,
          user_id:    user_id,
          created_at: created_at,
          reactions:  [],
          user: {
            id:           user.id,
            username:     user.username,
            display_name: user.display_name,
            avatar_url:   user.avatar_url_with_attachment,
          }
        }
      }
    )
  end
end
