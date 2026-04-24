class AddLastFeedViewedAtToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :last_feed_viewed_at, :datetime
  end
end
