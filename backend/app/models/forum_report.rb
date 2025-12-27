class ForumReport < ApplicationRecord
  belongs_to :user
  belongs_to :reportable, polymorphic: true

  validates :reason, presence: true
  validates :user_id, uniqueness: { scope: [:reportable_type, :reportable_id] }
end

