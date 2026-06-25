# frozen_string_literal: true

class EnrichBookCoversJob < ApplicationJob
  queue_as :low_priority

  BATCH_SIZE    = 50
  REQUEST_DELAY = 0.5.seconds

  # book_ids: array of DB integer ids OR google_books_id strings (e.g. "hc_454009").
  # source:   "serper", "google", or "openlibrary" — pin to one source.
  #           Omit to use the default priority order (serper → google → openlibrary).
  # When ids are given explicitly, needs_enrichment? is bypassed.
  def perform(book_ids = nil, source = nil)
    force = book_ids.present?

    books = if book_ids.present?
      int_ids = book_ids.select { |id| id.to_s =~ /\A\d+\z/ }.map(&:to_i)
      ext_ids = book_ids.reject { |id| id.to_s =~ /\A\d+\z/ }

      by_pk  = int_ids.any? ? Book.where(id: int_ids) : Book.none
      by_ext = ext_ids.any? ? Book.where(google_books_id: ext_ids) : Book.none

      missing = ext_ids - by_ext.pluck(:google_books_id)
      if missing.any?
        msg = "[EnrichBookCoversJob] IDs not found in books table: #{missing.inspect}"
        Rails.logger.warn(msg)
        puts msg
      end

      Book.where(id: (by_pk + by_ext).map(&:id))
    else
      Book.all
    end

    log "Starting — #{books.count} book(s) to process (force=#{force} source=#{source || 'auto'})"

    enriched = skipped = failed = 0

    books.find_each(batch_size: BATCH_SIZE) do |book|
      unless force || BookCoverService.new(book).needs_enrichment?
        log "  skip  book=#{book.id} (#{book.title.inspect}) — already enriched"
        skipped += 1
        next
      end

      log "  start book=#{book.id} (#{book.title.inspect}) google_books_id=#{book.google_books_id.inspect}"

      if CoverDownloadService.new(book, source: source).call
        log "  done  book=#{book.id} cover_storage_path=#{book.reload.cover_storage_path.inspect}"
        enriched += 1
      else
        log "  fail  book=#{book.id}"
        failed += 1
      end

      sleep REQUEST_DELAY
    end

    log "Done — #{enriched} enriched, #{skipped} skipped, #{failed} failed"
  end

  private

  def log(msg)
    tagged = "[EnrichBookCoversJob] #{msg}"
    Rails.logger.info(tagged)
    puts tagged
  end
end
