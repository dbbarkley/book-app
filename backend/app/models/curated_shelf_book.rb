class CuratedShelfBook < ApplicationRecord
  belongs_to :bisac_category, foreign_key: :bisac_code, primary_key: :code

  validates :bisac_code,      presence: true
  validates :google_books_id, presence: true
  validates :title,           presence: true
  validates :cached_at,       presence: true

  scope :for_shelf,  ->(code) { where(bisac_code: code) }
  scope :ranked,     -> { order(:rank, average_rating: :desc) }
  scope :with_cover, -> { where.not(cover_image_url: [nil, '']) }

  # Returns a hash shaped like BooksController#serialize_book_detail so that
  # show_by_google can serve curated-shelf books without a Google Books round-trip.
  # Fields that only exist on persisted DB books (id, author_id, followers_count,
  # categories) are returned as nil / empty so the client treats them as browse-only.
  def as_book_json
    {
      id:              nil,
      google_books_id: google_books_id,
      title:           title,
      isbn:            nil,
      description:     description,
      cover_image_url: cover_image_url,
      release_date:    published_date,
      page_count:      page_count,
      author_name:     author_name,
      author_id:       nil,
      author:          author_name.present? ? { id: nil, name: author_name, avatar_url: nil } : nil,
      followers_count: 0,
      categories:      [],
      average_rating:  average_rating,
      ratings_count:   ratings_count,
    }
  end

  def as_api_json
    {
      google_books_id: google_books_id,
      title:           title,
      author_name:     author_name,
      cover_image_url: cover_image_url,
      description:     description,
      published_date:  published_date,
      page_count:      page_count,
      average_rating:  average_rating,
      ratings_count:   ratings_count,
      rank:            rank,
    }
  end
end
