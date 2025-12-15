class CreateFollows < ActiveRecord::Migration[7.0]
  def change
    create_table :follows do |t|
      t.references :follower, null: false, foreign_key: { to_table: :users }
      t.string :followable_type, null: false
      t.bigint :followable_id, null: false

      t.timestamps
    end

    add_index :follows, :follower_id
    add_index :follows, [:followable_type, :followable_id]
    add_index :follows, [:follower_id, :followable_type, :followable_id], 
              unique: true, 
              name: 'index_follows_unique'
    add_index :follows, [:followable_type, :followable_id, :created_at]
  end
end

