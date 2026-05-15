class ReleaseReminder < ApplicationRecord
  belongs_to :user
  belongs_to :upcoming_release

  validates :user_id, uniqueness: { scope: :upcoming_release_id }
end
