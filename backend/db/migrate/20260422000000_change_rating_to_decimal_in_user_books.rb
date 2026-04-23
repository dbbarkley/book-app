class ChangeRatingToDecimalInUserBooks < ActiveRecord::Migration[7.1]
  def up
    change_column :user_books, :rating, :decimal, precision: 3, scale: 2
  end

  def down
    change_column :user_books, :rating, :integer
  end
end
