class AddExternalFieldsToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :is_virtual, :boolean, default: false, null: false
    add_column :events, :venue_name, :string
    add_column :events, :external_url, :string
    add_column :events, :external_source, :string
    add_column :events, :timezone, :string
    add_column :events, :last_refreshed_at, :datetime
    
    # Add indexes for common queries
    add_index :events, :is_virtual
    add_index :events, :external_source
    add_index :events, :last_refreshed_at
  end
end

