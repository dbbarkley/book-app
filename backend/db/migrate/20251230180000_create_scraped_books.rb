class CreateScrapedBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :scraped_books do |t|
      t.string :title
      t.string :author_name
      t.string :cover_image_url
      t.string :external_url
      t.string :source
      t.string :genre
      t.string :category
      t.timestamps
    end

    add_index :scraped_books, :genre
    add_index :scraped_books, :category
    add_index :scraped_books, [:title, :author_name], unique: true
  end
end

