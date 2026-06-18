class CreateSeriesAndAddSeriesToBookCatalog < ActiveRecord::Migration[7.2]
  def change
    create_table :series do |t|
      t.string  :name,                null: false
      t.bigint  :hardcover_series_id, null: false
      t.integer :total_books
      t.datetime :fetched_at

      t.timestamps
    end

    add_index :series, :hardcover_series_id, unique: true

    add_column :book_catalog, :series_id,       :bigint
    add_column :book_catalog, :series_position,  :decimal, precision: 4, scale: 1

    add_index :book_catalog, :series_id
    add_index :book_catalog, [:series_id, :series_position]
    add_foreign_key :book_catalog, :series, on_delete: :nullify
  end
end
