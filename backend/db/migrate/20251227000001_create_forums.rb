class CreateForums < ActiveRecord::Migration[7.0]
  def change
    create_table :forums do |t|
      t.string :title, null: false
      t.text :description
      t.integer :visibility, default: 0 # 0: public, 1: private
      t.references :owner, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end

