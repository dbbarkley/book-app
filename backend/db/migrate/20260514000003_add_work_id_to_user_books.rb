class AddWorkIdToUserBooks < ActiveRecord::Migration[7.2]
  def change
    add_reference :user_books, :work, foreign_key: true, null: true, index: true
  end
end
