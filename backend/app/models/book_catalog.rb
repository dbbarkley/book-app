class BookCatalog < ApplicationRecord
  self.table_name = 'book_catalog'

  belongs_to :series, optional: true

  scope :in_series, ->(series_id) {
    where(series_id: series_id).order(:series_position)
  }

  validates :google_books_id, presence: true, uniqueness: true
  validates :title, presence: true

  scope :full_text_search, ->(q) {
    q_lower  = q.downcase
    tsquery  = Arel.sql("plainto_tsquery('english', #{connection.quote(q_lower)})")
    q_exact  = connection.quote(q_lower)
    q_prefix = connection.quote("#{sanitize_sql_like(q_lower)}%")
    boost    = Arel.sql(
      "CASE WHEN lower(title) = #{q_exact}     THEN 2.0
            WHEN lower(title) LIKE #{q_prefix} THEN 1.0
            ELSE 0.0 END"
    )
    where("search_vector @@ #{tsquery}")
      .order(Arel.sql("(#{boost} + ts_rank(search_vector, #{tsquery})) DESC"))
  }

  scope :prefix_search, ->(q) {
    pattern = "%#{sanitize_sql_like(q)}%"
    where("title ILIKE ? OR author_name ILIKE ?", pattern, pattern)
  }

  MIN_PUBLISH_YEAR = 1930

  def self.search(q, limit: 20)
    return none if q.blank?
    # For very short queries, tsvector lexing gives no tokens — fall back to ILIKE.
    results = q.length < 3 ? prefix_search(q) : full_text_search(q)
    # Exclude pre-1930 books — blank/null published_date passes through (benefit of the doubt).
    results
      .where("published_date IS NULL OR published_date = '' OR LEFT(published_date, 4) >= '1930'")
      .limit(limit)
  end

  def self.upsert_book(book_hash)
    gid = book_hash[:google_books_id].to_s
    return if gid.blank? || book_hash[:title].blank?

    now = Time.current
    record = build_record(book_hash, now)

    upsert(record,
      unique_by: :google_books_id,
      update_only: %i[isbn title author_name cover_image_url description published_date
                       page_count average_rating ratings_count categories language
                       source cached_at])
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
                       page_count average_rating ratings_count categories language
                       source cached_at])
  end

  def self.upsert_author_works(works, author:)
    return if works.blank?
    book_hashes = works.filter_map do |w|
      next if w[:key].blank? || w[:title].blank?
      {
        google_books_id: w[:key],
        title:           w[:title],
        author_name:     author,
        cover_image_url: w[:cover_url],
        published_date:  w[:year]&.to_s,
        average_rating:  w[:ratings_average],
        ratings_count:   w[:ratings_count].to_i,
        language:        w[:language],
        isbn:            w[:isbn],
        description:     w[:description],
        page_count:      w[:page_count],
      }
    end
    upsert_many(book_hashes, source: 'google_books')
  end

  def self.upsert_series_books(book_data_array, series:)
    return if book_data_array.blank?
    now = Time.current

    records = book_data_array.map do |b|
      {
        google_books_id: b[:google_books_id].to_s,
        isbn:            b[:isbn].presence,
        title:           b[:title].to_s.truncate(500),
        author_name:     b[:author_name].presence,
        cover_image_url: b[:cover_image_url].presence,
        series_id:       series.id,
        series_position: b[:position],
        source:          'hardcover',
        ratings_count:   0,
        categories:      [],
        cached_at:       now,
        created_at:      now,
        updated_at:      now,
      }
    end

    upsert_all(records,
      unique_by: :google_books_id,
      update_only: %i[isbn title author_name cover_image_url series_id series_position cached_at updated_at])
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
      author_id:       nil,
      author:          author_name.present? ? { id: nil, name: author_name, avatar_url: nil } : nil,
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
      language:        book_hash[:language].presence,
      source:          book_hash[:source].to_s.presence || 'unknown',
      cached_at:       now,
      created_at:      now,
      updated_at:      now,
    }
  end
end
