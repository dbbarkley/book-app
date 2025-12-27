class ForumPost < ApplicationRecord
  belongs_to :forum
  belongs_to :user
  has_many :forum_replies, dependent: :destroy
  has_many :forum_hearts, as: :heartable, dependent: :destroy
  has_many :forum_reports, as: :reportable, dependent: :destroy

  validates :body, presence: true

  scope :not_deleted, -> { where(deleted_at: nil) }

  after_create :auto_follow_forum

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

  private

  def auto_follow_forum
    user.forum_follows.find_or_create_by(forum: forum)
  end
end

