class AddPreferencesToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :onboarding_completed, :boolean, default: false, null: false
    add_column :users, :preferences, :jsonb, default: {}, null: false
    
    add_index :users, :onboarding_completed
    add_index :users, :preferences, using: :gin
  end
end

