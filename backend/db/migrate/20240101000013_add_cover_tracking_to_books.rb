class AddCoverTrackingToBooks < ActiveRecord::Migration[7.0]
  def change
    add_column :books, :cover_image_quality, :integer, default: 0
    add_column :books, :cover_image_source, :string
    add_column :books, :cover_last_enriched_at, :datetime
    
    add_index :books, :cover_image_quality
    add_index :books, :cover_last_enriched_at
  end
end

