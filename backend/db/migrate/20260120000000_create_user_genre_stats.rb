class CreateUserGenreStats < ActiveRecord::Migration[7.2]
  def change
    create_table :user_genre_stats do |t|
      t.references :user, null: false, foreign_key: true
      t.string :genre, null: false
      t.integer :xp, default: 0, null: false

      t.timestamps
    end

    add_index :user_genre_stats, [:user_id, :genre], unique: true
  end
end

