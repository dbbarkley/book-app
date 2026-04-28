class CreateReadingBuddySessions < ActiveRecord::Migration[7.1]
  def change
    create_table :reading_buddy_sessions do |t|
      t.references :book,      null: false, foreign_key: true
      t.references :initiator, null: false, foreign_key: { to_table: :users }
      t.references :invited,   null: false, foreign_key: { to_table: :users }
      t.string     :status,    null: false, default: 'pending'
      t.datetime   :started_at

      t.timestamps
    end

    # Prevent duplicate sessions between the same two users for the same book
    add_index :reading_buddy_sessions,
              [:initiator_id, :invited_id, :book_id],
              unique: true,
              name: 'index_reading_buddy_sessions_unique'

    add_index :reading_buddy_sessions, :status
  end
end
