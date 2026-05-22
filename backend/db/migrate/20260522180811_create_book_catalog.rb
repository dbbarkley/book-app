class CreateBookCatalog < ActiveRecord::Migration[7.2]
  def up
    create_table :book_catalog do |t|
      t.string  :google_books_id, null: false
      t.string  :isbn
      t.string  :title,           null: false
      t.string  :author_name
      t.string  :cover_image_url
      t.text    :description
      t.string  :published_date
      t.integer :page_count
      t.decimal :average_rating,  precision: 3, scale: 2
      t.integer :ratings_count,   default: 0,   null: false
      t.jsonb   :categories,      default: [], null: false
      t.string  :source
      t.datetime :cached_at,      null: false

      t.timestamps
    end

    add_index :book_catalog, :google_books_id, unique: true
    add_index :book_catalog, :isbn, unique: true, where: 'isbn IS NOT NULL'
    add_index :book_catalog, :cached_at

    execute <<~SQL
      ALTER TABLE book_catalog
        ADD COLUMN search_vector tsvector
          GENERATED ALWAYS AS (
            to_tsvector('english',
              coalesce(title, '') || ' ' || coalesce(author_name, ''))
          ) STORED;
    SQL

    execute "CREATE INDEX index_book_catalog_on_search_vector ON book_catalog USING gin(search_vector);"
  end

  def down
    drop_table :book_catalog
  end
end
