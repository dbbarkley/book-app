class CreateUserGenreStatBooks < ActiveRecord::Migration[7.2]
  def up
    unless table_exists?(:user_genre_stat_books)
      create_table :user_genre_stat_books do |t|
        t.references :user_genre_stat, null: false, foreign_key: true
        t.references :user_book, null: false, foreign_key: true
        t.integer :xp_contributed, default: 0, null: false

        t.timestamps
      end
    end

    # Add unique index if it doesn't exist
    unless index_exists?(:user_genre_stat_books, [:user_genre_stat_id, :user_book_id], name: 'index_user_genre_stat_books_unique')
      add_index :user_genre_stat_books, [:user_genre_stat_id, :user_book_id], unique: true, name: 'index_user_genre_stat_books_unique'
    end

    # Remove duplicate index if it exists (Rails auto-creates one for t.references)
    if index_exists?(:user_genre_stat_books, :user_book_id, name: 'index_user_genre_stat_books_on_user_book_id')
      remove_index :user_genre_stat_books, name: 'index_user_genre_stat_books_on_user_book_id'
    end
  end

  def down
    drop_table :user_genre_stat_books if table_exists?(:user_genre_stat_books)
  end
end

