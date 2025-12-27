class CreateForumHearts < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_hearts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :heartable, polymorphic: true, null: false

      t.timestamps
    end

    add_index :forum_hearts, [:user_id, :heartable_type, :heartable_id], unique: true, name: 'index_forum_hearts_on_user_and_heartable'
  end
end

