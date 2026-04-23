class AddNotesToUserBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :user_books, :notes, :text
  end
end
