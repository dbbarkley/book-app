class AddSpoilerLockToReadingBuddyHighlights < ActiveRecord::Migration[7.1]
  def change
    add_column :reading_buddy_highlights, :spoiler_lock, :boolean, default: false, null: false
  end
end
