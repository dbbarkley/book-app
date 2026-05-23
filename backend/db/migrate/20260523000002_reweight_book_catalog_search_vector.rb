class ReweightBookCatalogSearchVector < ActiveRecord::Migration[7.2]
  def up
    execute "DROP INDEX IF EXISTS index_book_catalog_on_search_vector;"
    execute "ALTER TABLE book_catalog DROP COLUMN IF EXISTS search_vector;"
    execute <<~SQL
      ALTER TABLE book_catalog
        ADD COLUMN search_vector tsvector
          GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(author_name, '')), 'B')
          ) STORED;
    SQL
    execute "CREATE INDEX index_book_catalog_on_search_vector ON book_catalog USING gin(search_vector);"
  end

  def down
    execute "DROP INDEX IF EXISTS index_book_catalog_on_search_vector;"
    execute "ALTER TABLE book_catalog DROP COLUMN IF EXISTS search_vector;"
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
end
