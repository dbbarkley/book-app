class CreateRecommendations < ActiveRecord::Migration[7.2]
  def change
    create_table :recommendations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :recommendable_type, null: false
      t.bigint :recommendable_id, null: false
      t.text :reason
      t.float :score, default: 0.0
      t.string :source
      t.jsonb :metadata, default: {}

      t.timestamps
    end
    add_index :recommendations, [:user_id, :recommendable_type, :recommendable_id], name: 'index_recommendations_on_user_and_recommendable', unique: true
  end
end

