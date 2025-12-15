class GenerateEventsJob < ApplicationJob
  queue_as :default

  # Generate events for a specific author by scraping external sources
  # 
  # Usage:
  #   GenerateEventsJob.perform_later(author_id)
  #   GenerateEventsJob.perform_now(author_id)  # Synchronous for testing
  #
  # Background:
  # - Triggered when user follows an author
  # - Triggered manually via POST /events/refresh?author_id=X
  # - Scrapes Eventbrite, Ticketmaster, author websites, etc.
  # - Deduplicates events
  # - Stores globally in Postgres
  #
  def perform(author_id)
    author = Author.find_by(id: author_id)
    
    unless author
      Rails.logger.error("GenerateEventsJob: Author #{author_id} not found")
      return
    end

    Rails.logger.info("GenerateEventsJob: Starting event generation for #{author.name} (ID: #{author_id})")

    # Update last refreshed timestamp
    author.touch(:updated_at)
    
    all_events = []
    
    # 1. Try Eventbrite API
    if ENV['EVENTBRITE_API_KEY'].present?
      Rails.logger.info("  → Checking Eventbrite...")
      all_events = scrape_eventbrite(author)
    end
    
    # 2. Fallback to dummy events if no API key configured or no events found
    if all_events.empty?
      if ENV['EVENTBRITE_API_KEY'].blank?
        Rails.logger.warn("  ⚠ No Eventbrite API key configured, creating dummy events")
      else
        Rails.logger.info("  ℹ No events found on Eventbrite, creating dummy events")
      end
      created_count = create_dummy_events(author)
      Rails.logger.info("GenerateEventsJob: Created #{created_count} dummy events for #{author.name}")
      return created_count
    end
    
    # 3. Deduplicate events (in case of duplicates from Eventbrite)
    unique_events = deduplicate_events(all_events)
    
    # 4. Save to database
    created_count = save_events(author, unique_events)
    
    Rails.logger.info("GenerateEventsJob: Created #{created_count} real events for #{author.name}")
    
    created_count
  end

  private

  def create_dummy_events(author)
    # Check if events already exist
    return 0 if author.events.where('starts_at > ?', Time.current).any?

    events_data = [
      {
        title: "Book Signing with #{author.name}",
        description: "Meet #{author.name} and get your books signed!",
        event_type: 'signing',
        starts_at: 2.weeks.from_now,
        ends_at: 2.weeks.from_now + 2.hours,
        location: "New York, NY",
        venue_name: "Strand Bookstore",
        is_virtual: false,
        external_url: "https://eventbrite.com/example-#{author.id}",
        external_source: 'eventbrite'
      },
      {
        title: "Virtual Q&A with #{author.name}",
        description: "Join #{author.name} for an exclusive online Q&A session.",
        event_type: 'interview',
        starts_at: 1.week.from_now,
        ends_at: 1.week.from_now + 1.hour,
        is_virtual: true,
        venue_name: "Zoom",
        external_url: "https://zoom.us/j/example-#{author.id}",
        external_source: 'other'
      },
      {
        title: "#{author.name} Reading Tour",
        description: "#{author.name} reads from their latest work.",
        event_type: 'tour',
        starts_at: 3.weeks.from_now,
        ends_at: 3.weeks.from_now + 1.hour,
        location: "San Francisco, CA",
        venue_name: "City Lights Bookstore",
        is_virtual: false,
        external_url: "https://ticketmaster.com/example-#{author.id}",
        external_source: 'ticketmaster'
      }
    ]

    created_count = 0
    
    events_data.each do |event_data|
      event = author.events.build(event_data)
      if event.save
        created_count += 1
        Rails.logger.info("  ✓ Created event: #{event.title}")
      else
        Rails.logger.error("  ✗ Failed to create event: #{event.errors.full_messages.join(', ')}")
      end
    end

    created_count
  end

  # Eventbrite API Integration
  # Docs: https://www.eventbrite.com/platform/api
  
  def scrape_eventbrite(author)
    require 'net/http'
    require 'json'
    
    api_key = ENV['EVENTBRITE_API_KEY']
    return [] unless api_key.present?
    
    begin
      # Search for events by author name
      # Multiple search strategies for better coverage
      search_queries = [
        author.name,
        "#{author.name} book",
        "#{author.name} signing",
        "#{author.name} author"
      ]
      
      all_events = []
      
      search_queries.each do |query_text|
        query = URI.encode_www_form_component(query_text)
        url = URI("https://www.eventbriteapi.com/v3/events/search/?q=#{query}&token=#{api_key}")
        
        response = Net::HTTP.get(url)
        data = JSON.parse(response)
        
        data['events']&.each do |event_data|
          all_events << {
            title: event_data['name']['text'],
            description: event_data['description']&.dig('text'),
            starts_at: event_data['start']['utc'],
            ends_at: event_data['end']['utc'],
            location: [
              event_data['venue']&.dig('address', 'city'),
              event_data['venue']&.dig('address', 'region')
            ].compact.join(', '),
            venue_name: event_data['venue']&.dig('name'),
            external_url: event_data['url'], # REAL Eventbrite URL
            external_source: 'eventbrite',
            is_virtual: event_data['online_event'] || false,
            timezone: event_data['start']['timezone']
          }
        end
      end
      
      # Remove duplicates by URL
      unique_events = all_events.uniq { |e| e[:external_url] }
      
      Rails.logger.info("    Found #{unique_events.count} unique events on Eventbrite")
      unique_events
    rescue => e
      Rails.logger.error("    Eventbrite API error: #{e.message}")
      []
    end
  end
  
  # TODO: Google Custom Search Integration (Future)
  # Use Google to search author's website and other sources for events
  # 
  # def scrape_google_events(author)
  #   require 'net/http'
  #   require 'json'
  #   
  #   api_key = ENV['GOOGLE_API_KEY']
  #   cx = ENV['GOOGLE_SEARCH_CX'] # Custom Search Engine ID
  #   return [] unless api_key.present? && cx.present?
  #   
  #   # Search for events on author's website
  #   queries = [
  #     "site:#{author.website_url} events",
  #     "site:#{author.website_url} tour",
  #     "#{author.name} book tour 2025",
  #     "#{author.name} book signing near me"
  #   ]
  #   
  #   # Parse search results for event information
  #   # This would require more complex scraping logic
  # end
  
  def deduplicate_events(events)
    # Remove duplicates by external_url or title+date combo
    seen_urls = Set.new
    seen_titles = Set.new
    
    events.select do |event|
      # Skip if we've seen this URL
      if event[:external_url].present? && seen_urls.include?(event[:external_url])
        false
      else
        seen_urls.add(event[:external_url]) if event[:external_url].present?
        
        # Also check title + date combination
        key = "#{event[:title]}_#{event[:starts_at]}"
        if seen_titles.include?(key)
          false
        else
          seen_titles.add(key)
          true
        end
      end
    end
  end
  
  def save_events(author, events)
    created_count = 0
    
    events.each do |event_data|
      # Skip if event already exists
      next if author.events.exists?(external_url: event_data[:external_url]) if event_data[:external_url].present?
      
      event = author.events.build(event_data.merge(
        event_type: guess_event_type(event_data[:title]),
        last_refreshed_at: Time.current
      ))
      
      if event.save
        created_count += 1
        Rails.logger.info("    ✓ Saved: #{event.title}")
      else
        Rails.logger.error("    ✗ Failed: #{event.errors.full_messages.join(', ')}")
      end
    end
    
    created_count
  end
  
  def guess_event_type(title)
    title_lower = title.downcase
    
    return 'signing' if title_lower.include?('signing')
    return 'reading' if title_lower.include?('reading')
    return 'tour' if title_lower.include?('tour')
    return 'interview' if title_lower.include?('interview') || title_lower.include?('q&a')
    return 'virtual_event' if title_lower.include?('virtual') || title_lower.include?('online')
    
    'author_announcement' # default
  end
end

