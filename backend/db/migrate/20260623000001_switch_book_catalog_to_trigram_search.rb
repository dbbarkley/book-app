class SwitchBookCatalogToTrigramSearch < ActiveRecord::Migration[7.1]
  def up
    enable_extension 'pg_trgm'

    # Remove the FTS generated column and its index — replaced by trigrams below.
    remove_index  :book_catalog, name: 'index_book_catalog_on_search_vector'
    remove_column :book_catalog, :search_vector

    # GIN trigram indexes support partial-word matching, typo tolerance, and
    # phrase fragments. lower() keeps the index case-insensitive without needing
    # citext or manual downcasing at query time.
    execute "CREATE INDEX idx_book_catalog_title_trgm  ON book_catalog USING gin (lower(title) gin_trgm_ops)"
    execute "CREATE INDEX idx_book_catalog_author_trgm ON book_catalog USING gin (lower(author_name) gin_trgm_ops)"
  end

  def down
    remove_index :book_catalog, name: 'idx_book_catalog_title_trgm'
    remove_index :book_catalog, name: 'idx_book_catalog_author_trgm'

    execute <<~SQL
      ALTER TABLE book_catalog
        ADD COLUMN search_vector tsvector
          GENERATED ALWAYS AS (
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(author_name, '')), 'B')
          ) STORED
    SQL
    add_index :book_catalog, :search_vector, using: :gin, name: 'index_book_catalog_on_search_vector'
  end
end
