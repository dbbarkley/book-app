class AddStatusAndVisibilityToUserBooks < ActiveRecord::Migration[7.2]
  class MigrationUserBook < ActiveRecord::Base
    self.table_name = 'user_books'
  end

  def up
    add_column :user_books, :status, :string, null: false, default: 'to_read'
    add_column :user_books, :visibility, :string, null: false, default: 'public'
    add_column :user_books, :dnf_reason, :string
    add_column :user_books, :dnf_page, :integer

    add_index :user_books, :status
    add_index :user_books, :visibility

    reversible do |dir|
      dir.up do
        MigrationUserBook.reset_column_information
        MigrationUserBook.find_each do |user_book|
          user_book.update_columns(
            status: user_book.shelf,
            visibility: user_book.visibility || 'public'
          )
        end
      end
    end
  end

  def down
    remove_index :user_books, :visibility
    remove_index :user_books, :status

    remove_column :user_books, :dnf_page
    remove_column :user_books, :dnf_reason
    remove_column :user_books, :visibility
    remove_column :user_books, :status
  end
end

