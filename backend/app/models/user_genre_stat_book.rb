class UserGenreStatBook < ApplicationRecord
  belongs_to :user_genre_stat
  belongs_to :user_book

  validates :xp_contributed, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :user_genre_stat_id, uniqueness: { scope: :user_book_id }
end

