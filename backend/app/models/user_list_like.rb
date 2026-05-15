class UserListLike < ApplicationRecord
  belongs_to :user
  belongs_to :user_list

  validates :user_id, uniqueness: { scope: :user_list_id, message: 'has already liked this list' }

  # Users cannot like their own lists
  validate :cannot_like_own_list

  private

  def cannot_like_own_list
    if user_id == user_list&.user_id
      errors.add(:base, 'You cannot like your own list')
    end
  end
end
