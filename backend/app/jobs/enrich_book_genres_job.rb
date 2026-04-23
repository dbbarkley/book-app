# Enriches book categories using a three-tier lookup:
#   1. Google Books  — re-fetches by volume ID; returns rich slash-separated
#                      strings like "Fiction / Science Fiction / Space Opera"
#   2. Wikidata      — clean genre labels, best for mainstream/known books
#   3. Open Library  — broader coverage, noisier subjects
#
# Targets books with no categories or only a bare top-level tag (Fiction, etc.)
#
# Usage:
#   EnrichBookGenresJob.perform_later          # all books needing enrichment
#   EnrichBookGenresJob.perform_later([1,2,3]) # specific book IDs
#
class EnrichBookGenresJob < ApplicationJob
  queue_as :default

  NEEDS_ENRICHMENT = <<~SQL.freeze
    categories IS NULL
    OR categories::text = '[]'
    OR categories::text = '["Fiction"]'
    OR categories::text = '["Nonfiction"]'
    OR categories::text = '["Non-fiction"]'
  SQL

  def perform(book_ids = nil)
    # Always apply NEEDS_ENRICHMENT so we never re-process books that already
    # have good category data, whether called for specific IDs or the full table.
    scope = Book.where(NEEDS_ENRICHMENT)
    scope = scope.where(id: book_ids) if book_ids.present?
    total = scope.count

    Rails.logger.info "EnrichBookGenresJob: enriching #{total} books"

    enriched = 0
    failed   = 0

    scope.find_each.with_index do |book, i|
      prefix = "  [#{i + 1}/#{total}] #{book.title.truncate(50)}"

      # 1. Google Books — re-fetch by volume ID for richer category strings
      genres = GoogleBooksGenreService.fetch_genres(book)
      source = 'GoogleBooks'

      # 2. Wikidata — clean genre labels, best for mainstream/known books
      if genres.blank?
        genres = WikidataGenreService.fetch_genres(book)
        source = 'Wikidata'
      end

      # 3. Open Library — broader coverage, noisier subjects
      if genres.blank?
        genres = OpenLibraryGenreService.fetch_subjects(book)
        source = 'OpenLibrary'
      end

      if genres.present?
        book.update_columns(categories: genres)
        enriched += 1
        Rails.logger.info "#{prefix} [#{source}] → #{genres.first(3).join(', ')}"
      else
        failed += 1
        Rails.logger.info "#{prefix} – not found"
      end

      # Polite rate-limiting (~1 req/sec across all services)
      sleep 0.8
    end

    Rails.logger.info "EnrichBookGenresJob done: #{enriched} enriched, #{failed} not found"
  end
end
