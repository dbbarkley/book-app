class CreateUserLists < ActiveRecord::Migration[7.2]
  def change
    create_table :user_lists do |t|
      t.references :user, null: false, foreign_key: true
      t.string  :list_type,   null: false, default: 'custom'
      t.string  :name,        null: false
      t.text    :description
      t.string  :visibility,  null: false, default: 'public'

      t.timestamps
    end

    add_index :user_lists, [:user_id, :list_type]
    # Enforce one Top 10 list per user at the database level
    add_index :user_lists, [:user_id, :list_type],
              unique: true,
              where: "list_type = 'top_10'",
              name: 'index_user_lists_one_top_10_per_user'
  end
end
