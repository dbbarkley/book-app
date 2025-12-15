class CreateEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :events do |t|
      t.string :title, null: false
      t.text :description
      t.string :event_type, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at
      t.string :location
      t.references :author, null: false, foreign_key: true
      t.references :book, null: true, foreign_key: true

      t.timestamps
    end

    add_index :events, :author_id
    add_index :events, :book_id
    add_index :events, :starts_at
    add_index :events, [:event_type, :starts_at]
    add_index :events, [:starts_at, :ends_at]
  end
end

