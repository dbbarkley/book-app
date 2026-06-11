class CreateReadingBuddyMessageReactions < ActiveRecord::Migration[7.0]
  def change
    create_table :reading_buddy_message_reactions do |t|
      t.references :reading_buddy_message, null: false, foreign_key: true,  index: false
      t.references :user,                  null: false, foreign_key: true
      t.string     :emoji,                 null: false

      t.timestamps
    end

    add_index :reading_buddy_message_reactions,
              [:reading_buddy_message_id, :user_id, :emoji],
              unique: true,
              name: 'idx_rb_msg_reactions_unique'
  end
end
