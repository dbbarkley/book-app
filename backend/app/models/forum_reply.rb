class ForumReply < ApplicationRecord
  belongs_to :forum_post
  belongs_to :user
  belongs_to :parent, class_name: 'ForumReply', optional: true
  has_many :replies, class_name: 'ForumReply', foreign_key: 'parent_id', dependent: :destroy
  
  has_many :forum_hearts, as: :heartable, dependent: :destroy
  has_many :forum_reports, as: :reportable, dependent: :destroy

  validates :body, presence: true

  scope :not_deleted, -> { where(deleted_at: nil) }

  def deleted?
    deleted_at.present?
  end

  def heart_count
    forum_hearts.count
  end

  def hearted_by?(user)
    return false unless user
    forum_hearts.exists?(user_id: user.id)
  end
end

