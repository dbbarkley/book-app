class AddGoogleBooksIdToBooks < ActiveRecord::Migration[7.2]
  def change
    add_column :books, :google_books_id, :string
    add_index :books, :google_books_id, unique: true, where: "google_books_id IS NOT NULL"
  end
end

