class AddNoteToReadingBuddyHighlights < ActiveRecord::Migration[7.1]
  def change
    add_column :reading_buddy_highlights, :note, :text
  end
end
