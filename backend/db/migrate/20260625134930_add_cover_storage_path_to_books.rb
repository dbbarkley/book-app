class AddCoverStoragePathToBooks < ActiveRecord::Migration[7.2]
  def change
    add_column :books, :cover_storage_path, :string
  end
end
