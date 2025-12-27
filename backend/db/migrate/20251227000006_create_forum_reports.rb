class CreateForumReports < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_reports do |t|
      t.references :user, null: false, foreign_key: true
      t.references :reportable, polymorphic: true, null: false
      t.string :reason, null: false

      t.timestamps
    end

    add_index :forum_reports, [:user_id, :reportable_type, :reportable_id], unique: true, name: 'index_forum_reports_on_user_and_reportable'
  end
end

