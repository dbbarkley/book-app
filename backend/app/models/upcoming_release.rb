class UpcomingRelease < ApplicationRecord
  validates :isbn13, presence: true, uniqueness: true
  validates :title,  presence: true

  # ── Scopes ──────────────────────────────────────────────────────────────────

  # jsonb_build_array avoids the ? vs JSONB operator ambiguity and works
  # whether genres is stored as a JSONB array (correct) or string (legacy).
  scope :by_genre, ->(genre) {
    where("genres @> jsonb_build_array(?::text)", genre.to_s.downcase.strip)
  }

  scope :upcoming, -> {
    where("date_published >= ?", Date.current)
      .order(date_published: :asc)
  }

  scope :from_date, ->(date) {
    where("date_published >= ?", date).order(date_published: :asc)
  }

  scope :within_days, ->(days) {
    where(date_published: Date.current..(Date.current + days.days))
      .order(date_published: :asc)
  }

  scope :hardcover_first, -> {
    order(
      Arel.sql("CASE WHEN binding = 'Hardcover' THEN 0 ELSE 1 END"),
      date_published: :asc
    )
  }

  # Deduplicate by normalized title + first author at query time.
  # Picks one row per (title, author) pair — hardcover preferred, then earliest date.
  # This is a belt-and-suspenders guard; IsbndbService also deduplicates before
  # upserting, but this handles any duplicates already in the table.
  scope :deduped, -> {
    best_ids = unscoped
      .select(Arel.sql(
        "DISTINCT ON (lower(trim(title)), lower(trim(COALESCE(authors->>0, '')))) id"
      ))
      .order(Arel.sql(
        "lower(trim(title)), " \
        "lower(trim(COALESCE(authors->>0, ''))), " \
        "CASE WHEN binding = 'Hardcover' THEN 0 ELSE 1 END ASC, " \
        "date_published ASC"
      ))
    where(id: best_ids)
  }

  # ── Helpers ─────────────────────────────────────────────────────────────────

  def primary_author
    authors.first
  end

  def release_month
    date_published&.strftime('%B %Y')
  end

  def days_until_release
    return nil unless date_published
    (date_published - Date.current).to_i
  end

  # Returns the Book shape expected by the mobile/web detail screen.
  # Used when a book is looked up by ISBN but hasn't been saved to books table yet.
  def as_book_json
    {
      id:              nil,  # not in our books table yet
      title:           title,
      isbn:            isbn13,
      description:     synopsis,
      cover_image_url: cover_image_url,
      release_date:    date_published&.iso8601,
      page_count:      pages,
      author_name:     authors.first,
      author:          nil,
      followers_count: 0,
      categories:      genres,
    }
  end

  def as_api_json
    {
      id:              id,
      isbn13:          isbn13,
      title:           title,
      authors:         authors,
      publisher:       publisher,
      date_published:  date_published&.iso8601,
      binding:         binding,
      synopsis:        synopsis,
      cover_image_url: cover_image_url,
      subjects:        subjects,
      genres:          genres,
      msrp:            msrp&.to_f,
      days_until:      days_until_release,
    }
  end
end
