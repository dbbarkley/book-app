class BookCatalog < ApplicationRecord
  self.table_name = 'book_catalog'

  validates :google_books_id, presence: true, uniqueness: true
  validates :title, presence: true

  scope :full_text_search, ->(q) {
    tsquery = Arel.sql("plainto_tsquery('english', #{connection.quote(q)})")
    where("search_vector @@ #{tsquery}")
      .order(Arel.sql("ts_rank(search_vector, #{tsquery}) DESC"))
  }

  scope :prefix_search, ->(q) {
    pattern = "%#{sanitize_sql_like(q)}%"
    where("title ILIKE ? OR author_name ILIKE ?", pattern, pattern)
  }

  def self.search(q, limit: 20)
    return none if q.blank?
    # For very short queries, tsvector lexing gives no tokens — fall back to ILIKE.
    results = q.length < 3 ? prefix_search(q) : full_text_search(q)
    results.limit(limit)
  end

  def self.upsert_book(book_hash)
    gid = book_hash[:google_books_id].to_s
    return if gid.blank? || book_hash[:title].blank?

    now = Time.current
    record = build_record(book_hash, now)

    upsert(record,
      unique_by: :google_books_id,
      update_only: %i[isbn title author_name cover_image_url description published_date
                       page_count average_rating ratings_count categories source cached_at])
  end

  def self.upsert_many(books, source:)
    return if books.blank?
    now = Time.current
    records = books.filter_map do |b|
      next if b[:google_books_id].blank? || b[:title].blank?
      build_record(b.merge(source: source), now)
    end
    return if records.empty?

    upsert_all(records,
      unique_by: :google_books_id,
      update_only: %i[isbn title author_name cover_image_url description published_date
                       page_count average_rating ratings_count categories source cached_at])
  end

  def to_api_hash
    {
      id:              nil,
      google_books_id: google_books_id,
      isbn:            isbn,
      title:           title,
      author_name:     author_name,
      cover_image_url: cover_image_url,
      description:     description,
      release_date:    published_date,
      page_count:      page_count,
      average_rating:  average_rating,
      ratings_count:   ratings_count,
      categories:      categories || [],
      # Fields present in serialize_book_detail but not in catalog — send nil/zero
      # so the frontend can safely access them without undefined-access errors.
      author_id:       nil,
      author:          nil,
      followers_count: 0,
    }
  end

  private_class_method def self.build_record(book_hash, now)
    {
      google_books_id: book_hash[:google_books_id].to_s,
      isbn:            book_hash[:isbn].presence,
      title:           book_hash[:title].to_s.truncate(500),
      author_name:     book_hash[:author_name].presence,
      cover_image_url: book_hash[:cover_image_url].presence,
      description:     book_hash[:description].presence,
      published_date:  book_hash[:published_date].presence,
      page_count:      book_hash[:page_count]&.to_i.presence,
      average_rating:  book_hash[:average_rating]&.to_f&.round(2),
      ratings_count:   book_hash[:ratings_count].to_i,
      categories:      Array(book_hash[:categories]),
      source:          book_hash[:source].to_s.presence || 'unknown',
      cached_at:       now,
      created_at:      now,
      updated_at:      now,
    }
  end
end
