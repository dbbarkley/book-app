class CreateForumFollows < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_follows do |t|
      t.references :forum, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :forum_follows, [:forum_id, :user_id], unique: true
  end
end

