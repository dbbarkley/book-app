class AddWorkIdToBooks < ActiveRecord::Migration[7.2]
  def change
    add_reference :books, :work, foreign_key: true, null: true, index: true
  end
end
