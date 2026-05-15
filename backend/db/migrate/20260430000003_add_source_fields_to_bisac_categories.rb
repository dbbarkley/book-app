class AddSourceFieldsToBisacCategories < ActiveRecord::Migration[7.1]
  def change
    change_table :bisac_categories do |t|
      # Which API backs this category.
      # Supported values: 'hardcover', 'nyt', 'open_library'
      # Default is 'hardcover' — the primary source for genre/subcategory shelves.
      t.string  :data_source,       null: false, default: 'hardcover'

      # The source-specific identifier used to query this category.
      # hardcover   → tag slug, e.g. "romance", "cozy-mystery", "historical-romance"
      # nyt         → list slug, e.g. "combined-print-and-e-book-fiction"
      # open_library→ subject slug, e.g. "romance", "science_fiction"
      #
      # If nil, the populator falls back to the first entry in query_terms.
      t.string  :source_identifier

      # How many hours before this shelf is considered stale and eligible
      # for repopulation. Allows per-category control:
      #   168 = weekly (default, safe starting point)
      #    24 = daily (for high-traffic top-level categories later)
      #     0 = manual-only (never auto-repopulate)
      t.integer :stale_hours, null: false, default: 168
    end

    add_index :bisac_categories, :data_source
  end
end
