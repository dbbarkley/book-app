class CreateReadingBuddyMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :reading_buddy_messages do |t|
      t.references :reading_buddy_session, null: false, foreign_key: true
      t.references :user,                  null: false, foreign_key: true
      t.text       :content,               null: false

      t.timestamps
    end

    add_index :reading_buddy_messages, :created_at
  end
end
