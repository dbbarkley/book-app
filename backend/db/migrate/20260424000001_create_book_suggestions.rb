class CreateBookSuggestions < ActiveRecord::Migration[7.2]
  def change
    create_table :book_suggestions do |t|
      t.references :suggester, null: false, foreign_key: { to_table: :users }
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.references :book,      null: false, foreign_key: true
      t.text    :message
      t.string  :status, null: false, default: 'pending'
      t.timestamps
    end

    add_index :book_suggestions, [:suggester_id, :recipient_id, :book_id], unique: true,
              name: 'index_book_suggestions_unique'
    add_index :book_suggestions, :status
  end
end
