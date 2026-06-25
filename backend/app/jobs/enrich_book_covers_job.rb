# frozen_string_literal: true

class EnrichBookCoversJob < ApplicationJob
  queue_as :low_priority

  BATCH_SIZE    = 50
  REQUEST_DELAY = 0.5.seconds

  def perform(book_ids = nil)
    books = book_ids.present? ? Book.where(id: book_ids) : Book.all

    enriched = skipped = failed = 0

    books.find_each(batch_size: BATCH_SIZE) do |book|
      unless BookCoverService.new(book).needs_enrichment?
        skipped += 1
        next
      end

      if CoverDownloadService.new(book).call
        enriched += 1
      else
        failed += 1
      end

      sleep REQUEST_DELAY
    end

    Rails.logger.info(
      "EnrichBookCoversJob done: #{enriched} enriched, #{skipped} skipped, #{failed} failed"
    )
  end
end
