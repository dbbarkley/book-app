class ReadingBuddyHighlight < ApplicationRecord
  belongs_to :reading_buddy_session
  belongs_to :user

  # Optional: attach the original page photo via ActiveStorage
  has_one_attached :page_image

  validates :page_number,      presence: true, numericality: { greater_than: 0 }
  validates :extracted_text,   presence: true
  validates :highlighted_text, presence: true
  validates :char_start,       presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :char_end,         presence: true, numericality: { greater_than: 0 }
  validate  :char_end_after_char_start
  validate  :user_is_participant

  after_create_commit :broadcast_to_session

  private

  def char_end_after_char_start
    return unless char_start && char_end
    errors.add(:char_end, 'must be greater than char_start') if char_end <= char_start
  end

  def user_is_participant
    return unless reading_buddy_session && user
    unless reading_buddy_session.participant?(user)
      errors.add(:user, 'must be a participant in the session')
    end
  end

  def broadcast_to_session
    # Always broadcast as locked when spoiler_lock is set — the creator already
    # has the full highlight from their POST response (store deduplicates by id).
    ActionCable.server.broadcast(
      "reading_buddy_session_#{reading_buddy_session_id}",
      { type: 'new_highlight', highlight: serialize(locked: spoiler_lock?) }
    )
  end

  def serialize(locked: false)
    base = {
      id:           id,
      page_number:  page_number,
      char_start:   char_start,
      char_end:     char_end,
      spoiler_lock: spoiler_lock,
      locked:       locked,
      created_at:   created_at,
      user: {
        id:           user.id,
        username:     user.username,
        display_name: user.display_name,
        avatar_url:   user.avatar_url_with_attachment,
      }
    }
    return base if locked

    base.merge(
      extracted_text:   extracted_text,
      highlighted_text: highlighted_text,
      note:             note,
      moods:            moods || [],
      page_image_url:   page_image.attached? ? Rails.application.routes.url_helpers.rails_blob_url(page_image, only_path: true) : nil,
    )
  end
end
