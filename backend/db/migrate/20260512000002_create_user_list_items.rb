class CreateUserListItems < ActiveRecord::Migration[7.2]
  def change
    create_table :user_list_items do |t|
      t.references :user_list, null: false, foreign_key: true
      t.references :book,      null: false, foreign_key: true
      t.integer    :position,  null: false

      t.timestamps
    end

    # A book can only appear once per list
    add_index :user_list_items, [:user_list_id, :book_id], unique: true
    # Each position slot is unique within a list (prevents rank collisions)
    add_index :user_list_items, [:user_list_id, :position], unique: true
  end
end
