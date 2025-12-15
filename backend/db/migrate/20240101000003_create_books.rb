class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title, null: false
      t.string :isbn
      t.text :description
      t.string :cover_image_url
      t.date :release_date, null: false
      t.references :author, null: false, foreign_key: true

      t.timestamps
    end

    add_index :books, :release_date
    add_index :books, :isbn, unique: true, where: "isbn IS NOT NULL"
    add_index :books, [:title, :author_id]
  end
end

