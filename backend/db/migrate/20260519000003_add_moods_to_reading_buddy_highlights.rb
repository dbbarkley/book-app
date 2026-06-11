class AddMoodsToReadingBuddyHighlights < ActiveRecord::Migration[7.1]
  def change
    add_column :reading_buddy_highlights, :moods, :text, array: true, default: []
  end
end
