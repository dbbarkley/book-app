class AddZipcodeToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :zipcode, :string
  end
end

