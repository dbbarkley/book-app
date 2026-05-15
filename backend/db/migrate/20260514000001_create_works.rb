class CreateWorks < ActiveRecord::Migration[7.2]
  def change
    create_table :works do |t|
      t.string  :canonical_title,    null: false
      t.string  :canonical_author,   null: false
      t.string  :normalized_title,   null: false
      t.string  :normalized_author,  null: false
      t.bigint  :hardcover_id
      t.string  :hardcover_slug
      t.string  :ol_work_id
      t.text    :description
      t.string  :cover_image_url
      t.integer :page_count
      t.integer :first_published_year

      t.timestamps
    end

    add_index :works, %i[normalized_title normalized_author], unique: true
    add_index :works, :hardcover_id,   unique: true, where: 'hardcover_id IS NOT NULL'
    add_index :works, :ol_work_id,     unique: true, where: 'ol_work_id IS NOT NULL'
    add_index :works, :hardcover_slug, unique: true, where: 'hardcover_slug IS NOT NULL'
  end
end
