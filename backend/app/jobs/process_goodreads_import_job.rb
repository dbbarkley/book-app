# frozen_string_literal: true

require 'csv'

# ProcessGoodreadsImportJob handles the async processing of Goodreads CSV imports
#
# Performance design:
# - @author_cache    : in-memory hash keyed by lowercase name.  Eliminates one
#                      SELECT per author per row; most imports share 200-500 authors.
# - @isbn_book_cache : bulk-preloaded from every ISBN in the CSV before the loop
#                      starts.  Turns 2-3 DB hits per row into an O(1) Hash lookup
#                      for the common case where the book already exists.
# - No synchronous API calls in the loop.  Metadata (categories, page_count,
#   google_books_id) is populated by EnrichBookCoversJob which runs in the
#   background after the import completes.
class ProcessGoodreadsImportJob < ApplicationJob
  queue_as :default

  def perform(import_id, csv_file_path)
    import = Import.find(import_id)
    import.mark_as_processing!

    csv_content = File.read(csv_file_path)
    csv_data    = CSV.parse(csv_content, headers: true)

    # ── In-memory caches (scoped to this job run) ───────────────────────────
    @author_cache    = {}
    @work_cache      = {}
    @isbn_book_cache = build_isbn_book_cache(csv_data)

    successful = 0
    failed     = 0
    errors     = []
    book_ids   = []

    Thread.current[:skip_feed_fanout] = true
    csv_data.each_with_index do |row, index|
      begin
        book = process_book_row(row, import.user)
        book_ids << book.id if book
        successful += 1
      rescue StandardError => e
        failed += 1
        error_msg = "Row #{index + 1} (#{row['Title']}): #{e.message}"
        errors << error_msg
        Rails.logger.error("Import #{import_id} - #{error_msg}")
        Rails.logger.error(e.backtrace.first(5).join("\n")) if Rails.env.development?
      end

      # Update progress every 10 books
      if (index + 1) % 10 == 0
        import.update_progress!(
          processed:  index + 1,
          successful: successful,
          failed:     failed
        )
      end
    end
    Thread.current[:skip_feed_fanout] = nil

    import.update_progress!(
      processed:  csv_data.length,
      successful: successful,
      failed:     failed
    )

    import.update!(metadata: import.metadata.merge(errors: errors.first(10))) if errors.any?

    if successful == 0 && failed > 0
      import.mark_as_failed!("No books could be imported — #{failed} row#{'s' if failed != 1} failed. Check that your file is a valid Goodreads CSV export.")
    else
      import.mark_as_completed!
    end

    File.delete(csv_file_path) if File.exist?(csv_file_path)

    # Enrich covers and genres in the background for just the books touched by
    # this import. EnrichBookGenresJob skips any that already have good categories.
    book_ids.uniq!
    if book_ids.any?
      EnrichBookCoversJob.perform_later(book_ids)
      EnrichBookGenresJob.perform_later(book_ids)
    end

  rescue StandardError => e
    Rails.logger.error("Import #{import_id} failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    import.mark_as_failed!(e.message)
    File.delete(csv_file_path) if File.exist?(csv_file_path)
  ensure
    Thread.current[:skip_feed_fanout] = nil
  end

  private

  # ── Cache setup ─────────────────────────────────────────────────────────────

  # Collect every ISBN from the CSV, then load matching DB books in one query.
  # Returns a Hash { isbn_string => Book } used by find_or_create_book.
  def build_isbn_book_cache(csv_data)
    isbns = csv_data.flat_map { |row| [clean_isbn(row['ISBN']), clean_isbn(row['ISBN13'])] }
                    .compact
                    .uniq
    return {} if isbns.empty?

    Book.where(isbn: isbns).index_by(&:isbn)
  end

  # ── Row processing ──────────────────────────────────────────────────────────

  def process_book_row(row, user)
    title       = row['Title']&.strip
    author_name = row['Author']&.strip
    return if title.blank? || author_name.blank?

    isbn   = clean_isbn(row['ISBN'])
    isbn13 = clean_isbn(row['ISBN13'])

    my_rating  = row['My Rating']&.to_i || 0
    avg_rating = row['Average Rating']&.to_f || 0.0
    publisher  = row['Publisher']&.strip
    page_count = row['Number of Pages']&.to_i.presence  # nil if 0 or blank

    year_str = row['Year Published'] || row['Original Publication Year']
    year     = year_str&.strip&.to_i
    year     = nil if year && year < 1000

    date_read   = parse_date(row['Date Read'])
    date_added  = parse_date(row['Date Added'])
    exclusive_shelf = row['Exclusive Shelf']&.strip

    author = find_or_create_author(author_name)
    book   = find_or_create_book(
      title:      title,
      author:     author,
      isbn:       isbn,
      isbn13:     isbn13,
      publisher:  publisher,
      year:       year,
      avg_rating: avg_rating,
      page_count: page_count
    )

    work = find_or_create_work(title, author_name, isbn13 || isbn)
    book.update_column(:work_id, work.id) if book.work_id.nil?

    status = convert_shelf_to_status(exclusive_shelf, row)

    user_book = UserBook.find_or_initialize_by(user: user, book: book)
    user_book.assign_attributes(
      status:      status,
      shelf:       status,
      work_id:     work.id,
      rating:      my_rating > 0 ? my_rating : nil,
      total_pages: page_count || book.page_count,
      started_at:  date_added,
      finished_at: date_read
    )
    user_book.save!

    # Set cover from ISBN immediately (no network call).
    # Books created fresh in find_or_create_book already have cover_image_url
    # set; this call only fires for pre-existing books that had no cover.
    populate_cover_from_isbn(book, isbn13 || isbn)

    book
  end

  # ── Author handling ─────────────────────────────────────────────────────────

  # Uses @author_cache to avoid a SELECT for every row.
  # First encounter: hits the DB (find or create). All subsequent rows with the
  # same author name are served from the hash — no extra queries.
  def find_or_create_author(name)
    key = name.downcase
    return @author_cache[key] if @author_cache.key?(key)

    author = Author.find_by('LOWER(name) = ?', key) || Author.create!(name: name)
    @author_cache[key] = author
    author
  end

  # ── Work handling ───────────────────────────────────────────────────────────

  # Caches by normalized title+author to avoid a DB hit for every row when
  # the same work appears across multiple editions in a single import.
  def find_or_create_work(title, author_name, isbn = nil)
    key = "#{WorkResolutionService.normalize_title(title)}|#{WorkResolutionService.normalize_author(author_name)}"
    return @work_cache[key] if @work_cache.key?(key)

    work = WorkResolutionService.resolve(title: title, author: author_name, isbn: isbn)
    @work_cache[key] = work
    work
  end

  # ── Book handling ───────────────────────────────────────────────────────────

  def find_or_create_book(title:, author:, isbn: nil, isbn13: nil,
                           publisher: nil, year: nil, avg_rating: 0.0, page_count: nil)
    # 1. ISBN13 cache hit (no DB query)
    if isbn13.present?
      book = @isbn_book_cache[isbn13]
      if book
        book.update_column(:page_count, page_count) if page_count.present? && book.page_count.blank?
        return book
      end
    end

    # 2. ISBN10 cache hit (no DB query)
    if isbn.present?
      book = @isbn_book_cache[isbn]
      if book
        book.update_column(:page_count, page_count) if page_count.present? && book.page_count.blank?
        return book
      end
    end

    # 3. Title + author (cache missed — book may not have an ISBN or wasn't in DB at start)
    book = Book.joins(:author).where(
      'LOWER(books.title) = ? AND authors.id = ?',
      title.downcase,
      author.id
    ).first
    if book
      book.update_column(:page_count, page_count) if page_count.present? && book.page_count.blank?
      return book
    end

    # 4. Create new book
    release_date = (year && year > 1000) ? Date.new(year, 1, 1) : Date.new(1900, 1, 1)

    best_isbn    = isbn13.presence || isbn.presence
    ol_cover_url = best_isbn.present? \
      ? "https://covers.openlibrary.org/b/isbn/#{best_isbn}-L.jpg" \
      : nil

    create_params = {
      title:                  title,
      author:                 author,
      isbn:                   isbn13 || isbn,
      release_date:           release_date,
      description:            nil,
      cover_image_url:        ol_cover_url,
      cover_image_quality:    ol_cover_url ? 5 : 0,
      cover_image_source:     ol_cover_url ? 'open_library' : nil,
      cover_last_enriched_at: ol_cover_url ? Time.current : nil,
    }
    create_params[:page_count] = page_count if Book.column_names.include?('page_count') && page_count.present?

    Book.create!(create_params)
  end

  # ── Cover handling ──────────────────────────────────────────────────────────

  # Constructs an Open Library cover URL from the ISBN and saves it.
  # No network call — onError in BookCoverImage handles missing covers gracefully.
  # Skips if the book already has a cover or has no ISBN.
  def populate_cover_from_isbn(book, isbn)
    return if isbn.blank?
    return if book.cover_image_url.present?

    book.update_columns(
      cover_image_url:        "https://covers.openlibrary.org/b/isbn/#{isbn}-L.jpg",
      cover_image_quality:    5,
      cover_image_source:     'open_library',
      cover_last_enriched_at: Time.current
    )
  rescue ActiveRecord::ActiveRecordError => e
    Rails.logger.warn("populate_cover_from_isbn failed for book #{book.id}: #{e.message}")
  end

  # ── Status / date helpers ───────────────────────────────────────────────────

  def convert_shelf_to_status(shelf, row = nil)
    status = case shelf&.downcase&.strip
             when 'read'                                          then 'read'
             when 'currently-reading', 'reading', 'currently reading' then 'reading'
             when 'to-read', 'to read', 'wishlist'               then 'to_read'
             when 'dnf', 'did-not-finish', 'dropped'             then 'dnf'
             end

    status = 'read' if status.nil? && row && row['Date Read'].present?
    status || 'to_read'
  end

  def parse_date(date_string)
    return nil if date_string.blank?
    Date.parse(date_string)
  rescue ArgumentError
    nil
  end

  def clean_isbn(isbn_string)
    return nil if isbn_string.blank?

    cleaned = isbn_string.to_s.strip
    cleaned = cleaned.gsub(/^=["']?/, '').gsub(/["']$/, '')  # strip ="..." wrapper
    cleaned = cleaned.gsub(/[^0-9X]/i, '')                   # keep digits and X

    cleaned.blank? ? nil : cleaned
  end
end
