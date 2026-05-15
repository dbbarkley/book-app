class MakeUserBooksWorkIdNotNull < ActiveRecord::Migration[7.2]
  def change
    change_column_null :user_books, :work_id, false
  end
end
