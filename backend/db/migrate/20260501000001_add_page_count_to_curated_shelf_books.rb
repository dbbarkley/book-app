class AddPageCountToCuratedShelfBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :curated_shelf_books, :page_count, :integer
  end
end
