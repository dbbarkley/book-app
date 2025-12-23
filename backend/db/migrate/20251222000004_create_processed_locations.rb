class CreateProcessedLocations < ActiveRecord::Migration[7.0]
  def change
    create_table :processed_locations do |t|
      t.string :city
      t.string :state
      t.string :zipcode
      t.datetime :last_searched_at

      t.timestamps
    end

    add_index :processed_locations, [:city, :state]
    add_index :processed_locations, :zipcode
    add_index :processed_locations, :last_searched_at
  end
end

