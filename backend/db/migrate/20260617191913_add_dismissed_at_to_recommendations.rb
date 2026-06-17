class AddDismissedAtToRecommendations < ActiveRecord::Migration[7.2]
  def change
    add_column :recommendations, :dismissed_at, :datetime
    add_index  :recommendations, [:user_id, :dismissed_at]
  end
end
