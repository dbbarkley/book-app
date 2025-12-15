class Follow < ApplicationRecord
  validates :follower_id, presence: true
  validates :followable_type, presence: true
  validates :followable_id, presence: true

  validates :followable_type, inclusion: { in: %w[User Author Book] }

  belongs_to :follower, class_name: 'User'
  belongs_to :followable, polymorphic: true
end

