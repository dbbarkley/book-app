class CreateUpcomingReleases < ActiveRecord::Migration[7.1]
  def change
    create_table :upcoming_releases do |t|
      t.string   :isbn13,          null: false
      t.string   :isbn10
      t.string   :title,           null: false
      t.jsonb    :authors,         null: false, default: []
      t.string   :publisher
      t.date     :date_published
      t.string   :binding
      t.text     :synopsis
      t.string   :cover_image_url
      t.jsonb    :subjects,        null: false, default: []
      t.jsonb    :genres,          null: false, default: []
      t.decimal  :msrp,            precision: 8, scale: 2
      t.datetime :fetched_at,      null: false, default: -> { 'NOW()' }

      t.timestamps
    end

    add_index :upcoming_releases, :isbn13,        unique: true
    add_index :upcoming_releases, :date_published
    add_index :upcoming_releases, :genres,         using: :gin
    add_index :upcoming_releases, :publisher
  end
end
