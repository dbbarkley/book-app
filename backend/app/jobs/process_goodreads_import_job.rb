# frozen_string_literal: true

require 'csv'

# ProcessGoodreadsImportJob handles the async processing of Goodreads CSV imports
#
# This job:
# 1. Parses the CSV file
# 2. Creates/matches Authors
# 3. Creates/matches Books
# 4. Creates UserBooks with reading status and ratings
# 5. Updates import progress in real-time
#
# Idempotency: 
# - Books are matched by ISBN or title+author to avoid duplicates
# - UserBooks use upsert logic to prevent duplicate shelf entries
class ProcessGoodreadsImportJob < ApplicationJob
  queue_as :default

  # Goodreads CSV columns we care about
  # Title, Author, ISBN, ISBN13, My Rating, Average Rating, 
  # Publisher, Year Published, Date Read, Date Added, Bookshelves, Exclusive Shelf
  
  def perform(import_id, csv_file_path)
    import = Import.find(import_id)
    import.mark_as_processing!

    csv_content = File.read(csv_file_path)
    csv_data = CSV.parse(csv_content, headers: true)

    successful = 0
    failed = 0
    errors = []

    csv_data.each_with_index do |row, index|
      begin
        process_book_row(row, import.user)
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
          processed: index + 1,
          successful: successful,
          failed: failed
        )
      end
    end

    # Final progress update
    import.update_progress!(
      processed: csv_data.length,
      successful: successful,
      failed: failed
    )

    # Store any errors in metadata
    if errors.any?
      import.update!(metadata: import.metadata.merge(errors: errors.first(10)))
    end

    import.mark_as_completed!

    # Clean up temp file
    File.delete(csv_file_path) if File.exist?(csv_file_path)

    # Enrich book covers in background (non-blocking)
    # This will fetch high-quality covers from Open Library or Google Books
    book_ids = import.user.user_books.pluck(:book_id).uniq
    EnrichBookCoversJob.perform_later(book_ids) if book_ids.any?

  rescue StandardError => e
    Rails.logger.error("Import #{import_id} failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    import.mark_as_failed!(e.message)
    
    # Clean up temp file even on failure
    File.delete(csv_file_path) if File.exist?(csv_file_path)
  end

  private

  def process_book_row(row, user)
    # Extract book data
    title = row['Title']&.strip
    author_name = row['Author']&.strip
    
    # Goodreads sometimes wraps ISBNs in ="..." format to preserve leading zeros
    # Clean them by removing =, quotes, dashes, and spaces
    isbn = clean_isbn(row['ISBN'])
    isbn13 = clean_isbn(row['ISBN13'])
    
    my_rating = row['My Rating']&.to_i || 0
    avg_rating = row['Average Rating']&.to_f || 0.0
    publisher = row['Publisher']&.strip
    
    # Parse year - handle both "Year Published" and "Original Publication Year"
    year_str = row['Year Published'] || row['Original Publication Year']
    year = year_str&.strip&.to_i
    year = nil if year && year < 1000 # Invalid year
    
    date_read = parse_date(row['Date Read'])
    date_added = parse_date(row['Date Added'])
    exclusive_shelf = row['Exclusive Shelf']&.strip # read, currently-reading, to-read
    
    return if title.blank? || author_name.blank?

    # Find or create author
    author = find_or_create_author(author_name)

    # Find or create book
    book = find_or_create_book(
      title: title,
      author: author,
      isbn: isbn,
      isbn13: isbn13,
      publisher: publisher,
      year: year,
      avg_rating: avg_rating
    )

    # Convert Goodreads shelf to our shelf status
    status = convert_shelf_to_status(exclusive_shelf, row)

    # Create or update user book
    user_book = UserBook.find_or_initialize_by(user: user, book: book)
    user_book.assign_attributes(
      status: status,
      shelf: status,
      rating: my_rating > 0 ? my_rating : nil,
      started_at: date_added,
      finished_at: date_read
    )
    user_book.save!

    book
  end

  def find_or_create_author(name)
    # Try to find by exact name
    author = Author.find_by('LOWER(name) = ?', name.downcase)
    return author if author

    # Create new author
    Author.create!(name: name)
  end

  def find_or_create_book(title:, author:, isbn: nil, isbn13: nil, publisher: nil, year: nil, avg_rating: 0.0)
    # Try to find by ISBN13 first (most reliable)
    if isbn13.present? && isbn13.length == 13
      book = Book.find_by(isbn: isbn13)
      return book if book
    end

    # Try ISBN10
    if isbn.present? && (isbn.length == 10 || isbn.length == 13)
      book = Book.find_by(isbn: isbn)
      return book if book
    end

    # Try by title and author
    book = Book.joins(:author).where(
      'LOWER(books.title) = ? AND authors.id = ?', 
      title.downcase, 
      author.id
    ).first
    return book if book

    # Create new book
    # Note: Publisher and page_count aren't in the schema, can be added later
    # Using release_date (not published_date) as per schema
    # If no year, use a placeholder date (Jan 1, 1900) to satisfy NOT NULL constraint
    release_date = if year && year > 1000
                     Date.new(year, 1, 1)
                   else
                     Date.new(1900, 1, 1) # Placeholder for unknown release dates
                   end
    
    Book.create!(
      title: title,
      author: author,
      isbn: isbn13 || isbn,
      release_date: release_date,
      description: nil, # Can be enriched later via Google Books API
      cover_image_url: nil
    )
  end

  def convert_shelf_to_status(shelf, row = nil)
    status = case shelf&.downcase&.strip
             when 'read'
               'read'
             when 'currently-reading', 'reading', 'currently reading'
               'reading'
             when 'to-read', 'to read', 'wishlist'
               'to_read'
             when 'dnf', 'did-not-finish', 'dropped'
               'dnf'
             else
               nil
             end

    # Fallback: If status is still unclear but there's a Date Read, it's definitely 'read'
    if status.nil? && row && row['Date Read'].present?
      status = 'read'
    end

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
    
    # Goodreads exports sometimes use ="1234567890" format
    # Remove =, quotes, dashes, spaces, and keep only digits and X (for ISBN-10)
    cleaned = isbn_string.to_s.strip
    cleaned = cleaned.gsub(/^=["']?/, '').gsub(/["']$/, '') # Remove ="..." wrapper
    cleaned = cleaned.gsub(/[^0-9X]/i, '') # Keep only numbers and X
    
    return nil if cleaned.blank?
    cleaned
  end
end

