class RefreshUpcomingReleasesJob < ApplicationJob
  queue_as :default

  def perform
    lock_key = 'refresh_upcoming_releases_job_running'
    return if Rails.cache.read(lock_key)

    begin
      Rails.cache.write(lock_key, true, expires_in: 2.hours)

      # ── Step 1: ISBNdb (broad genre-based sweep) ────────────────────────────
      Rails.logger.info '[RefreshUpcomingReleasesJob] Starting ISBNdb upcoming releases refresh...'
      isbndb_result = IsbndbService.call

      if isbndb_result.success?
        Rails.logger.info "[RefreshUpcomingReleasesJob] ISBNdb complete — #{isbndb_result.data} books upserted"
      else
        Rails.logger.error "[RefreshUpcomingReleasesJob] ISBNdb failed: #{isbndb_result.errors.join(', ')}"
      end

      # ── Step 2: Penguin Random House (authoritative source, runs second) ────
      # PRH data takes precedence over ISBNdb. Running second means any book
      # present in both sources will be overwritten with the PRH version.
      Rails.logger.info '[RefreshUpcomingReleasesJob] Starting Penguin Random House upcoming releases refresh...'
      prh_result = PenguinRandomHouseService.call

      if prh_result.success?
        Rails.logger.info "[RefreshUpcomingReleasesJob] PRH complete — #{prh_result.data} books upserted"
      else
        Rails.logger.error "[RefreshUpcomingReleasesJob] PRH failed: #{prh_result.errors.join(', ')}"
      end

      Rails.logger.info '[RefreshUpcomingReleasesJob] All sources complete.'
    ensure
      Rails.cache.delete(lock_key)
    end
  end
end
