# frozen_string_literal: true

# EnrichBookCoversJob - Background job to fetch and update book covers
#
# This job runs after Goodreads import or can be scheduled periodically
# to improve cover quality for all books.
#
# Features:
# - Processes books in batches to avoid overwhelming APIs
# - Rate limits API requests
# - Skips books that don't need enrichment
# - Can be run for specific books or all books
class EnrichBookCoversJob < ApplicationJob
  queue_as :default

  # Batch size to avoid memory issues
  BATCH_SIZE = 50
  
  # Delay between API requests (rate limiting)
  REQUEST_DELAY = 0.5.seconds

  # Enrich covers for specific books or all books
  # @param book_ids [Array<Integer>] Optional array of book IDs to enrich
  def perform(book_ids = nil)
    books = if book_ids.present?
              Book.where(id: book_ids)
            else
              Book.all
            end

    total_books = books.count
    enriched_count = 0
    skipped_count = 0
    failed_count = 0

    Rails.logger.info("Starting cover enrichment for #{total_books} books")

    books.find_each(batch_size: BATCH_SIZE) do |book|
      service = BookCoverService.new(book)
      
      # Skip if enrichment not needed
      unless service.needs_enrichment?
        skipped_count += 1
        next
      end

      begin
        result = service.enrich_cover!
        
        if result[:url].present?
          enriched_count += 1
          Rails.logger.info("Enriched cover for '#{book.title}' from #{result[:source]}")
        else
          skipped_count += 1
          Rails.logger.info("No cover found for '#{book.title}'")
        end

        # Rate limit to be respectful to APIs
        sleep REQUEST_DELAY
      rescue StandardError => e
        failed_count += 1
        Rails.logger.error("Failed to enrich cover for book #{book.id}: #{e.message}")
      end

      # Log progress every 50 books
      if (enriched_count + skipped_count + failed_count) % 50 == 0
        progress = enriched_count + skipped_count + failed_count
        Rails.logger.info("Progress: #{progress}/#{total_books} books processed")
      end
    end

    Rails.logger.info(
      "Cover enrichment complete: #{enriched_count} enriched, " \
      "#{skipped_count} skipped, #{failed_count} failed"
    )

    {
      total: total_books,
      enriched: enriched_count,
      skipped: skipped_count,
      failed: failed_count
    }
  end
end

