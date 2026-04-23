class Friendship < ApplicationRecord
  STATUSES = %w[pending accepted].freeze

  belongs_to :requester, class_name: 'User'
  belongs_to :requestee, class_name: 'User'

  validates :status, inclusion: { in: STATUSES }
  validates :requester_id, uniqueness: { scope: :requestee_id, message: 'friendship already exists' }
  validate  :not_self_friendship

  scope :pending,  -> { where(status: 'pending') }
  scope :accepted, -> { where(status: 'accepted') }
  scope :involving, ->(user) {
    where('requester_id = ? OR requestee_id = ?', user.id, user.id)
  }
  scope :between, ->(user_a, user_b) {
    where(
      '(requester_id = ? AND requestee_id = ?) OR (requester_id = ? AND requestee_id = ?)',
      user_a.id, user_b.id, user_b.id, user_a.id
    )
  }

  def accepted?
    status == 'accepted'
  end

  def pending?
    status == 'pending'
  end

  def other_user(current_user)
    requester_id == current_user.id ? requestee : requester
  end

  private

  def not_self_friendship
    errors.add(:base, 'Cannot friend yourself') if requester_id == requestee_id
  end
end
