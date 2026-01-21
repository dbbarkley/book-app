class ScrapedBook < ApplicationRecord
  validates :title, presence: true
  validates :author_name, presence: true
  validates :external_url, presence: true, uniqueness: true

  # Support multiple genres stored as a comma-separated string in the existing 'genre' column
  # e.g. "fiction, sci-fi"
  
  scope :by_genre, ->(genre_name) { where("genre LIKE ?", "%#{genre_name.downcase}%") }
  scope :by_category, ->(category) { where(category: category.to_s) }

  def add_genre(new_genre)
    return if new_genre.blank?
    current_genres = genre.to_s.split(',').map(&:strip).reject(&:blank?)
    self.genre = (current_genres + [new_genre.downcase]).uniq.join(',')
  end

  def genre_list
    genre.to_s.split(',').map(&:strip)
  end
end
