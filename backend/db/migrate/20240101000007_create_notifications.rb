class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :notifiable_type, null: false
      t.bigint :notifiable_id, null: false
      t.string :notification_type, null: false
      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, :user_id
    add_index :notifications, [:notifiable_type, :notifiable_id]
    add_index :notifications, [:user_id, :read_at, :created_at]
    add_index :notifications, [:user_id, :notification_type, :created_at]
  end
end

