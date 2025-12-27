class Forum < ApplicationRecord
  enum :visibility, { public_access: 0, private_access: 1 }

  belongs_to :owner, class_name: 'User'
  has_many :forum_follows, dependent: :destroy
  has_many :followers, through: :forum_follows, source: :user
  has_many :forum_posts, dependent: :destroy

  validates :title, presence: true
  validates :visibility, presence: true

  scope :visible_for, ->(user) {
    if user
      # 1. Public forums
      # 2. Forums the user explicitly follows
      # 3. Forums the user owns
      # 4. Forums owned by users the current user follows
      where(visibility: :public_access)
        .or(where(id: user.forum_follows.select(:forum_id)))
        .or(where(owner_id: user.id))
        .or(where(owner_id: user.follows.where(followable_type: 'User').select(:followable_id)))
    else
      where(visibility: :public_access)
    end
  }

  def follower_count
    forum_follows.count
  end

  def following?(user)
    return false unless user
    forum_follows.exists?(user_id: user.id)
  end
end

