class AddAudienceTypeToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :audience_type, :string
    add_index :events, :audience_type
  end
end

