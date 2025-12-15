class CreateImports < ActiveRecord::Migration[7.0]
  def change
    create_table :imports do |t|
      t.references :user, null: false, foreign_key: true
      t.string :source, null: false # 'goodreads', 'storygraph', etc.
      t.string :status, null: false, default: 'pending' # pending, processing, completed, failed
      t.string :filename
      t.integer :total_books, default: 0
      t.integer :processed_books, default: 0
      t.integer :successful_imports, default: 0
      t.integer :failed_imports, default: 0
      t.jsonb :metadata, default: {}
      t.text :error_message
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :imports, [:user_id, :status]
    add_index :imports, :created_at
  end
end

