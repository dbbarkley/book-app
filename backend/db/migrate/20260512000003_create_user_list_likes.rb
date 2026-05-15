class CreateUserListLikes < ActiveRecord::Migration[7.2]
  def change
    create_table :user_list_likes do |t|
      t.references :user,      null: false, foreign_key: true
      t.references :user_list, null: false, foreign_key: true

      t.timestamps
    end

    # A user can only like a given list once
    add_index :user_list_likes, [:user_id, :user_list_id], unique: true
  end
end
