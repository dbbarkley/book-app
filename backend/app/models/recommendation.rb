class Recommendation < ApplicationRecord
  belongs_to :user
  belongs_to :recommendable, polymorphic: true

  validates :recommendable_type, presence: true
  validates :recommendable_id, presence: true
  validates :reason, presence: true

  scope :books, -> { where(recommendable_type: 'Book') }
  scope :authors, -> { where(recommendable_type: 'Author') }
  scope :recent, -> { order(created_at: :desc) }

  def self.for_user(user)
    where(user: user).order(score: :desc)
  end
end

