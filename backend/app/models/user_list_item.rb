class UserListItem < ApplicationRecord
  belongs_to :user_list
  belongs_to :book

  validates :position, presence: true,
                       numericality: { only_integer: true, greater_than: 0 }
  validates :book_id,  uniqueness: { scope: :user_list_id, message: 'is already in this list' }
  validates :position, uniqueness: { scope: :user_list_id, message: 'is already taken' }

  # Additional guard: Top 10 lists can only go up to position 10
  validate :position_within_bounds

  scope :ordered, -> { order(:position) }

  private

  def position_within_bounds
    return unless user_list&.top_10?
    if position.to_i > 10
      errors.add(:position, 'cannot exceed 10 for a Top 10 list')
    end
  end
end
