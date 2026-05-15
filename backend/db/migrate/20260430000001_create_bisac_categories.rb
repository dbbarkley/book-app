class CreateBisacCategories < ActiveRecord::Migration[7.1]
  def change
    create_table :bisac_categories do |t|
      # The BISAC code, e.g. "FIC027000" — used as the stable external identifier.
      # Not the PK (we use a serial id) but must be unique and indexed.
      t.string  :code,          null: false
      t.string  :name,          null: false   # "Romance / General"
      t.string  :parent_code                  # "FIC027000" for sub-shelves, null for top-level
      t.string  :color,         null: false, default: '#6B8FD6'  # hex for UI tile

      # Ordered array of terms used to build the Google Books subject query.
      # e.g. ["romance", "historical", "scottish", "highlander"]
      # First term is used as the subject: anchor; rest narrow the keyword search.
      t.jsonb   :query_terms,   null: false, default: []

      t.integer :display_order, null: false, default: 0
      t.boolean :active,        null: false, default: true

      # Set after BisacPopulatorJob runs for this category.
      # Used to determine staleness (repopulate if older than 7 days).
      t.datetime :last_populated_at

      t.timestamps
    end

    add_index :bisac_categories, :code,         unique: true
    add_index :bisac_categories, :parent_code
    add_index :bisac_categories, :active
    add_index :bisac_categories, :display_order
  end
end
