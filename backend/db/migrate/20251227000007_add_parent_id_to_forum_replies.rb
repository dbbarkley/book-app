class AddParentIdToForumReplies < ActiveRecord::Migration[7.2]
  def change
    add_column :forum_replies, :parent_id, :bigint
    add_index :forum_replies, :parent_id
  end
end

