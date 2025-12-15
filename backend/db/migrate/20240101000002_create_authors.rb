class CreateAuthors < ActiveRecord::Migration[7.0]
  def change
    create_table :authors do |t|
      t.string :name, null: false
      t.text :bio
      t.string :avatar_url
      t.string :website_url

      t.timestamps
    end

    add_index :authors, :name
  end
end

