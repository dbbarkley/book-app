class ScrapeNewReleasesJob < ApplicationJob
  queue_as :default
  
  GENRES = ['fiction', 'non-fiction', 'mystery', 'sci-fi', 'romance', 'thriller', 'fantasy', 'horror', 'biography', 'business', 'young-adult', 'children'].freeze

  def perform
    lock_key = "scrape_new_releases_job_running"
    return if Rails.cache.read(lock_key)
    
    begin
      Rails.cache.write(lock_key, true, expires_in: 1.hour)
      Rails.logger.info "[ScrapeNewReleasesJob] Starting full scrape of new releases..."
      
      GENRES.each do |genre|
        # 1. Fetch from Amazon
        amz_service = AmazonScraperService.new(:new_releases, genre, 40)
        amz_url = amz_service.send(:build_url)
        Rails.logger.info "[ScrapeNewReleasesJob] Scraping #{genre} from Amazon: #{amz_url}"
        amz_result = amz_service.call
        
        # 2. Fetch from B&N
        bn_service = BarnesAndNobleScraperService.new(:new_releases, genre, 40)
        bn_url = bn_service.send(:build_url)
        Rails.logger.info "[ScrapeNewReleasesJob] Scraping #{genre} from B&N: #{bn_url}"
        bn_result = bn_service.call
        
        all_books = []
        all_books += amz_result.data if amz_result.success?
        all_books += bn_result.data if bn_result.success?
        
        if all_books.empty?
          Rails.logger.warn "[ScrapeNewReleasesJob] No books found for #{genre}."
          next
        end

        # 3. Deduplicate
        dedup_result = BookDeduplicationService.new(all_books).call
        
        # 4. Save to Database
        save_books(dedup_result.data, genre, 'new_releases')
      end

      # Also scrape "Coming Soon" (B&N only for now)
      Rails.logger.info "[ScrapeNewReleasesJob] Scraping coming soon..."
      bn_service = BarnesAndNobleScraperService.new(:coming_soon, nil, 50)
      bn_result = bn_service.call
      if bn_result.success?
        # For coming soon, we use nil as genre but don't overwrite specific genres
        save_books(bn_result.data, nil, 'coming_soon')
      end

      Rails.logger.info "[ScrapeNewReleasesJob] Full scrape completed."
    ensure
      Rails.cache.delete(lock_key)
    end
  end

  private

  def save_books(books_data, genre, category)
    Rails.logger.info "[ScrapeNewReleasesJob] Attempting to save #{books_data.length} books for genre: #{genre}, category: #{category}"
    
    saved_count = 0
    books_data.each do |data|
      # Use title and author_name to find or create
      book = ScrapedBook.find_or_initialize_by(
        title: data[:title],
        author_name: data[:author_name]
      )
      
      # IMPORTANT: We ADD the genre instead of overwriting it
      book.add_genre(genre) if genre
      
      book.assign_attributes(
        cover_image_url: data[:cover_image_url],
        external_url: data[:external_url],
        source: data[:source],
        category: category, # Category (new_release vs coming_soon) can be overwritten as it's the current "status"
        format: data[:format] || "Physical" # Default to physical if not specified
      )
      
      if book.save
        saved_count += 1
      else
        Rails.logger.error "[ScrapeNewReleasesJob] Failed to save book '#{data[:title]}' from #{data[:source]}: #{book.errors.full_messages.join(', ')}"
      end
    end
    Rails.logger.info "[ScrapeNewReleasesJob] Successfully saved #{saved_count} books for genre: #{genre}"
  end
end
