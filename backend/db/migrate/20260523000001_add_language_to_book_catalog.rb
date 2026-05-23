class AddLanguageToBookCatalog < ActiveRecord::Migration[7.2]
  def change
    add_column :book_catalog, :language, :string
    add_index  :book_catalog, :author_name
  end
end
