class CreateReadingBuddyHighlights < ActiveRecord::Migration[7.1]
  def change
    create_table :reading_buddy_highlights do |t|
      t.references :reading_buddy_session, null: false, foreign_key: true
      t.references :user,                  null: false, foreign_key: true
      t.integer    :page_number,           null: false
      t.text       :extracted_text,        null: false  # full OCR output for the page
      t.text       :highlighted_text,      null: false  # the selected passage
      t.integer    :char_start,            null: false  # offset within extracted_text
      t.integer    :char_end,              null: false  # offset within extracted_text

      t.timestamps
    end

    add_index :reading_buddy_highlights, [:reading_buddy_session_id, :page_number],
              name: 'index_rb_highlights_on_session_and_page'
    add_index :reading_buddy_highlights, [:reading_buddy_session_id, :created_at],
              name: 'index_rb_highlights_on_session_and_created'
  end
end
