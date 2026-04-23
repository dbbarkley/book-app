class CreateFriendships < ActiveRecord::Migration[7.2]
  def change
    create_table :friendships do |t|
      t.references :requester,  null: false, foreign_key: { to_table: :users }
      t.references :requestee,  null: false, foreign_key: { to_table: :users }
      t.string     :status,     null: false, default: 'pending'

      t.timestamps
    end

    # One friendship record per pair — requester→requestee direction is canonical
    add_index :friendships, [:requester_id, :requestee_id], unique: true
    add_index :friendships, :status
  end
end
