class CreateUserBooks < ActiveRecord::Migration[7.2]
  def change
    create_table :user_books do |t|
      t.references :user, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true
      t.string :shelf, null: false # 'to_read', 'reading', 'read'
      t.integer :pages_read
      t.integer :total_pages
      t.integer :completion_percentage, default: 0
      t.integer :rating # 1-5 stars
      t.text :review
      t.datetime :started_at
      t.datetime :finished_at

      t.timestamps
      
      t.index [:user_id, :book_id], unique: true
      t.index [:user_id, :shelf]
    end
  end
end

