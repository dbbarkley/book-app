class CreateForumReplies < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_replies do |t|
      t.references :forum_post, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :body, null: false
      t.datetime :edited_at
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :forum_replies, :deleted_at
  end
end

