class AddCategoriesToBooks < ActiveRecord::Migration[7.2]
  def change
    add_column :books, :categories, :jsonb, default: []
    add_index :books, :categories, using: :gin
  end
end

