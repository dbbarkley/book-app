class CreateBookNotes < ActiveRecord::Migration[7.2]
  def change
    create_table :book_notes do |t|
      t.bigint  :user_id,      null: false
      t.bigint  :user_book_id, null: false
      t.text    :content,      null: false
      t.integer :page_number

      t.timestamps
    end

    add_index :book_notes, :user_id
    add_index :book_notes, :user_book_id
    add_index :book_notes, [:user_id, :created_at]

    add_foreign_key :book_notes, :users,      on_delete: :cascade
    add_foreign_key :book_notes, :user_books, on_delete: :cascade
  end
end
