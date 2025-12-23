class SetupVenueEventsSystem < ActiveRecord::Migration[7.2]
  def change
    # 1. Create venues table
    create_table :venues do |t|
      t.string :name, null: false
      t.string :venue_type, default: "other" # bookstore, library, theater, university, other
      t.string :address
      t.string :city
      t.string :state
      t.string :zipcode
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.string :website_url
      t.string :source
      t.string :external_id
      t.boolean :active, default: true
      t.datetime :last_fetched_at

      t.timestamps
    end

    add_index :venues, [:source, :external_id], unique: true
    add_index :venues, [:city, :state]
    add_index :venues, :zipcode
    add_index :venues, :active

    # 2. Create event_authors join table
    create_table :event_authors do |t|
      t.references :event, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: true
      t.float :confidence_score, default: 1.0

      t.timestamps
    end

    # 3. Update events table
    # Make author_id optional (was null: false)
    change_column_null :events, :author_id, true
    
    # Add new columns
    add_reference :events, :venue, foreign_key: true
    add_column :events, :external_id, :string
    add_column :events, :status, :string, default: "upcoming" # upcoming, cancelled, past

    # Add indexes for new columns
    add_index :events, [:external_source, :external_id], unique: true
    add_index :events, :status
  end
end

