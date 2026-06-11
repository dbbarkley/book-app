class AddReadingStreakToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :reading_streak, :integer, default: 0, null: false
    add_column :users, :last_read_date, :date
  end
end
