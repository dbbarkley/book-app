class AddFormatToScrapedBooks < ActiveRecord::Migration[7.0]
  def change
    add_column :scraped_books, :format, :string, default: 'Physical'
    add_index :scraped_books, :format
  end
end

