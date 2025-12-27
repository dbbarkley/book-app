class ForumFollow < ApplicationRecord
  belongs_to :forum
  belongs_to :user

  validates :user_id, uniqueness: { scope: :forum_id }
end

