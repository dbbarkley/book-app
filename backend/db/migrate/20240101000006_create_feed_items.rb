class CreateFeedItems < ActiveRecord::Migration[7.0]
  def change
    create_table :feed_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :feedable_type, null: false
      t.bigint :feedable_id, null: false
      t.string :activity_type, null: false
      t.jsonb :metadata

      t.timestamps
    end

    add_index :feed_items, :user_id
    add_index :feed_items, [:feedable_type, :feedable_id]
    add_index :feed_items, [:user_id, :created_at], name: 'index_feed_items_user_created'
    add_index :feed_items, [:user_id, :activity_type, :created_at]
    add_index :feed_items, :created_at
  end
end

