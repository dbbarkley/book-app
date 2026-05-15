class UserList < ApplicationRecord
  LIST_TYPES   = %w[top_10 custom].freeze
  VISIBILITIES = %w[public private].freeze

  belongs_to :user
  has_many   :user_list_items, -> { order(:position) }, dependent: :destroy
  has_many   :books, through: :user_list_items
  has_many   :user_list_likes, dependent: :destroy

  validates :list_type,  presence: true, inclusion: { in: LIST_TYPES }
  validates :name,       presence: true, length: { maximum: 100 }
  validates :visibility, presence: true, inclusion: { in: VISIBILITIES }

  # Top 10 lists are capped at 10 items
  validate :top_10_item_count, if: :top_10?

  scope :public_lists, -> { where(visibility: 'public') }
  scope :top_10,       -> { where(list_type: 'top_10') }

  def top_10?
    list_type == 'top_10'
  end

  # Find or create the single Top 10 list for a user
  def self.find_or_create_top_10_for(user)
    find_or_create_by!(user: user, list_type: 'top_10') do |list|
      list.name       = 'My Top 10'
      list.visibility = 'public'
    end
  end

  def likes_count
    user_list_likes.count
  end

  # ── Feed fan-out ─────────────────────────────────────────────────────────────
  after_update_commit :fan_out_list_updated

  private

  def top_10_item_count
    # Allow validation during initial build; check persisted items + any
    # items being added via nested attributes or direct assignment.
    count = user_list_items.reject(&:marked_for_destruction?).size
    if count > 10
      errors.add(:base, 'Top 10 list cannot have more than 10 books')
    end
  end

  def fan_out_list_updated
    return unless visibility == 'public'
    return unless top_10?

    GenerateUserActivityFeedItemsJob.perform_later(
      user_id, 'UserList', id, 'user_updated_top_10', {}
    )
  end
end
