class CreateCuratedShelfBooks < ActiveRecord::Migration[7.1]
  def change
    create_table :curated_shelf_books do |t|
      t.string  :bisac_code,       null: false  # FK to bisac_categories.code
      t.string  :google_books_id,  null: false

      # Denormalised book metadata — cached so shelf renders without extra API calls.
      t.string  :title,            null: false
      t.string  :author_name
      t.string  :cover_image_url
      t.text    :description
      t.string  :published_date
      t.decimal :average_rating,   precision: 3, scale: 2
      t.integer :ratings_count,    default: 0

      # Position within the shelf (lower = higher priority).
      # BisacPopulatorJob sets this; can be overridden manually for editorial picks.
      t.integer :rank,             null: false, default: 0

      t.datetime :cached_at,       null: false

      t.timestamps
    end

    # Each book appears at most once per shelf
    add_index :curated_shelf_books, [:bisac_code, :google_books_id], unique: true, name: 'idx_curated_shelf_books_unique'
    add_index :curated_shelf_books, :bisac_code
    add_index :curated_shelf_books, :cached_at
  end
end
