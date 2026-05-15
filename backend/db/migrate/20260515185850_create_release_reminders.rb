class CreateReleaseReminders < ActiveRecord::Migration[7.0]
  def change
    create_table :release_reminders do |t|
      t.references :user,             null: false, foreign_key: true
      t.references :upcoming_release, null: false, foreign_key: true
      t.datetime   :reminded_at

      t.timestamps
    end

    add_index :release_reminders, [:user_id, :upcoming_release_id], unique: true
    add_index :release_reminders, :reminded_at
  end
end
