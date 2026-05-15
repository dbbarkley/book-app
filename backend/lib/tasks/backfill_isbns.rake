require 'net/http'
require 'uri'
require 'json'

namespace :books do
  desc <<~DESC
    Backfill ISBN-13 for books that have a google_books_id but no isbn.

    Fetches each book's volume data from Google Books and writes the ISBN-13
    (preferred) or ISBN-10 into the isbn column.

    Books with an ol_ prefix (Open Library) are skipped — they don't resolve
    via the Google Books volumes endpoint. Run with DRY_RUN=1 to preview
    without writing to the database.

    Usage:
      rails books:backfill_isbns
      rails books:backfill_isbns DRY_RUN=1
      rails books:backfill_isbns BATCH_SIZE=50
  DESC
  task backfill_isbns: :environment do
    dry_run    = ENV['DRY_RUN'].present?
    batch_size = (ENV['BATCH_SIZE'] || 25).to_i
    api_key    = ENV['GOOGLE_BOOKS_API_KEY']
    timeout    = 8  # seconds per request

    puts dry_run ? "=== DRY RUN — no changes will be saved ===" : "=== Backfilling ISBNs ==="
    puts

    # Scope: books missing an ISBN that we can look up via Google Books.
    # ol_ books are excluded — they need a different resolution path.
    scope = Book.where(isbn: nil)
                .where.not(google_books_id: nil)
                .where("google_books_id NOT LIKE 'ol_%'")

    total   = scope.count
    updated = 0
    skipped = 0
    failed  = 0

    puts "Found #{total} books with google_books_id but no isbn."
    puts

    scope.in_batches(of: batch_size) do |batch|
      batch.each do |book|
        print "  [#{book.id}] #{book.title.truncate(50)} (#{book.google_books_id}) … "

        isbn = fetch_isbn_from_google(book.google_books_id, api_key, timeout)

        if isbn.nil?
          puts "no ISBN found — skipped"
          skipped += 1
          next
        end

        # Guard: another book already has this ISBN (edge case with duplicate
        # editions). Don't overwrite — just log and move on.
        if Book.where(isbn: isbn).where.not(id: book.id).exists?
          puts "ISBN #{isbn} already taken by another record — skipped"
          skipped += 1
          next
        end

        if dry_run
          puts "would set isbn = #{isbn}"
        else
          book.update_column(:isbn, isbn)
          puts "set isbn = #{isbn}"
        end

        updated += 1

        # Polite rate-limiting: Google Books allows ~1 req/s without a key,
        # ~10 req/s with one. Sleep briefly between calls to avoid 429s.
        sleep(api_key.present? ? 0.12 : 1.1)

      rescue => e
        puts "ERROR — #{e.message}"
        failed += 1
      end
    end

    puts
    puts "=== Done ==="
    puts "  Updated : #{updated}"
    puts "  Skipped : #{skipped}"
    puts "  Failed  : #{failed}"
    puts "  Total   : #{total}"
    puts "(dry run — no changes were written)" if dry_run
  end

  private

  def fetch_isbn_from_google(google_books_id, api_key, timeout)
    url = "https://www.googleapis.com/books/v1/volumes/#{URI.encode_www_form_component(google_books_id)}"
    url += "?key=#{api_key}" if api_key.present?

    uri  = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.read_timeout = timeout
    http.open_timeout = timeout

    response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
    return nil unless response.is_a?(Net::HTTPSuccess)

    data        = JSON.parse(response.body)
    identifiers = Array(data.dig('volumeInfo', 'industryIdentifiers'))

    # Prefer ISBN-13; fall back to ISBN-10
    isbn13 = identifiers.find { |i| i['type'] == 'ISBN_13' }&.dig('identifier')
    isbn10 = identifiers.find { |i| i['type'] == 'ISBN_10' }&.dig('identifier')

    isbn13 || isbn10
  rescue => e
    Rails.logger.warn("[backfill_isbns] Google Books lookup failed for #{google_books_id}: #{e.message}")
    nil
  end
end
