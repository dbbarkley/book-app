class ForumHeart < ApplicationRecord
  belongs_to :user
  belongs_to :heartable, polymorphic: true

  validates :user_id, uniqueness: { scope: [:heartable_type, :heartable_id] }
end

