module EventSources
  class BookstoreAdapter < BaseAdapter
    # Generic adapter for bookstore websites.
    # Many independent bookstores use IndieCommerce or similar platforms.
    def fetch_events(venue:)
      return [] unless venue.bookstore?
      website = venue.website_url
      return [] if website.blank?

      Rails.logger.info "Checking bookstore events for: #{venue.name}"
      
      # We check the current month and the next 2 months (total 3 months)
      months_to_check = [Time.current, Time.current + 1.month, Time.current + 2.months]
      events = []

      # 1. Try IndieCommerce/Drupal month-based paths
      months_to_check.each do |date|
        path = "/events/#{date.year}/#{date.strftime('%m')}"
        events += scrape_path(website, path, venue)
      end

      # 2. Try generic paths if we found very few events
      if events.size < 5
        generic_paths = ["/events", "/upcoming-events", "/calendar", "/events-calendar"]
        generic_paths.each do |path|
          scraped = scrape_path(website, path, venue)
          events += scraped if scraped.any?
        end
      end

      events.compact.uniq { |e| e[:external_id] }
    end

    protected

    def scrape_path(website, path, venue)
      url = URI.join(website, path).to_s
      response = HTTParty.get(url, timeout: 10, headers: { "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" })
      return [] unless response.success?

      doc = Nokogiri::HTML(response.body)
      path_events = []

      # 1. Collect structured data
      path_events += scrape_json_ld(doc, url)

      # 2. Specific logic for IndieCommerce
      # Broadened selector to catch more variants of IndieCommerce/Drupal layouts
      articles = doc.css('article.event-list, .view-events .views-row, .view-upcoming-events .views-row')
      articles.each do |article|
        event = normalize_indiecommerce_event(article, url)
        path_events << event if event
      end

      # 3. Generic Heuristic Scraping (only if we still have nothing or very little)
      if path_events.compact.reject { |e| e[:title].blank? }.size < 3
        containers = doc.css(
          '.event-item, .views-row, .tribe-events-list-event, .eventlist-event, ' \
          '.event-list-item, .type-tribe_events, .sqs-events-collection-item, ' \
          '.event-card, .event-summary, .ee-event-list-item'
        )
        
        containers.each do |container|
          event = normalize_scraped_event(container, url)
          path_events << event if event
        end
      end

      # 4. Handle Pagination (IndieCommerce/Drupal usually use ?page=X)
      # If we haven't followed a pager yet and we see one, try to get the next page
      # To prevent infinite loops, we only check up to 3 pages
      unless url.include?("page=")
        next_link = doc.at_css('ul.pager__items li.pager__item--next a, ul.pagination li.next a, a[rel="next"]')
        if next_link && next_link['href']
          next_url = absolute_url(next_link['href'], url)
          # Simple check to avoid circular links
          if next_url != url
            path_events += scrape_path(website, next_url, venue)
          end
        end
      end

      path_events.compact.uniq { |e| e[:external_id] }
    rescue StandardError => e
      Rails.logger.warn "Failed to scrape #{url}: #{e.message}"
      []
    end

    def normalize_indiecommerce_event(article, source_url)
      # Try several common title selectors for IndieCommerce
      title_elem = article.at_css('.event-list__title a, h3 a, .views-field-title a, .title a')
      title = title_elem&.text&.strip
      
      # Fallback to heading if link not found
      title ||= article.at_css('h1, h2, h3, h4, .title')&.text&.strip
      
      return nil if title.blank?

      # Extract specific date/time details
      details = article.css('.event-list__details--item, .views-field')
      date_str = ""
      time_str = ""
      location_detail = ""

      details.each do |item|
        label_elem = item.at_css('.event-list__details--label, .views-label')
        label = label_elem&.text&.downcase || ""
        text_content = item.text.strip
        
        if label.include?("date") || text_content.start_with?("Date:")
          date_str = text_content.gsub(/Date:\s*/i, "").strip
        elsif label.include?("time") || text_content.start_with?("Time:")
          time_str = text_content.gsub(/Time:\s*/i, "").strip
        elsif label.include?("place") || text_content.start_with?("Place:")
          # Try to get structured address if available, otherwise take full text
          location_detail = item.at_css('.address-line1')&.text&.strip || 
                           text_content.gsub(/Place:\s*/i, "").strip
        end
      end

      # Fallback to month/day indicators if Date label missing
      if date_str.blank?
        month = article.at_css('.event-list__date--month, .date-month')&.text&.strip
        day = article.at_css('.event-list__date--day, .date-day')&.text&.strip
        year = article.at_css('.event-list__date--year, .date-year')&.text&.strip || Time.current.year
        date_str = "#{month} #{day} #{year}" if month && day
      end

      # Extract start and end times
      start_time_str = time_str.split('-').first&.strip || ""
      end_time_str = time_str.split('-').last&.strip if time_str.include?("-")

      full_date_str = "#{date_str} #{start_time_str}".strip
      starts_at = parse_date(full_date_str)
      
      # If we can't parse a date, this is likely not a valid event or a malformed one
      # We skip instead of defaulting to Time.current to avoid duplicates/junk
      return nil if starts_at.nil?

      ends_at = nil
      if end_time_str.present?
        ends_at = parse_date("#{date_str} #{end_time_str}")
      end

      # Virtual detection
      is_virtual = title.downcase.include?("virtual") || 
                   location_detail.downcase.include?("zoom") || 
                   location_detail.downcase.include?("online") ||
                   location_detail.downcase.include?("email")

      # Find the best link
      link = article.at_css('.event-list__links--rsvp, .event-list__links--event, .views-field-view-node a') || title_elem
      url = absolute_url(link&.[]('href'), source_url)

      # Extract image
      image_elem = article.at_css('.event-list__image img, .views-field-field-image img, img')
      image_url = absolute_url(image_elem&.[]('src'), source_url)

      # Map tags to event types and audience
      tag_text = article.css('.event-tag__term, .views-field-field-event-tags').text.downcase
      
      event_type = if tag_text.include?("signing") then "signing"
                   elsif tag_text.include?("storytime") then "storytime"
                   elsif tag_text.include?("reading") then "reading"
                   elsif tag_text.include?("interview") then "interview"
                   elsif tag_text.include?("book club") then "reading"
                   else "reading"
                   end

      audience_type = if tag_text.include?("children") || tag_text.include?("kids") || tag_text.include?("storytime")
                        "kids"
                      elsif tag_text.include?("young adult") || tag_text.include?("teen")
                        "young_adult"
                      else
                        "adult"
                      end

      {
        title: title,
        description: article.at_css('.event-list__body, .views-field-body, .description')&.text&.strip,
        event_type: event_type,
        audience_type: audience_type,
        starts_at: starts_at,
        ends_at: ends_at,
        location: location_detail,
        is_virtual: is_virtual,
        image_url: image_url,
        external_url: url,
        external_source: "venue_site",
        external_id: article['id'] || Digest::MD5.hexdigest("#{title}-#{date_str}-#{start_time_str}"),
        status: "upcoming"
      }
    end

    def scrape_json_ld(doc, source_url)
      events = []
      doc.css('script[type="application/ld+json"]').each do |script|
        begin
          data = JSON.parse(script.text)
          
          # JSON-LD can be a single object or an array
          items = data.is_a?(Array) ? data : [data]
          
          items.each do |item|
            # We look for Schema.org Event type
            next unless item["@type"] == "Event" || item["@type"]&.include?("Event")
            
            title = item["name"]
            starts_at = item["startDate"]
            location_name = item.dig("location", "name") || ""
            
            is_virtual = item["eventAttendanceMode"]&.include?("Virtual") || 
                         location_name.downcase.include?("zoom") ||
                         location_name.downcase.include?("online")

            events << {
              title: title,
              description: item["description"],
              event_type: "reading",
              audience_type: "adult", # JSON-LD rarely specifies this, default to adult
              starts_at: starts_at,
              ends_at: item["endDate"],
              location: location_name,
              is_virtual: is_virtual,
              image_url: item["image"].is_a?(Array) ? item["image"].first : item["image"],
              external_url: item["url"] || source_url,
              external_source: "venue_site",
              external_id: item["@id"] || Digest::MD5.hexdigest("#{title}-#{starts_at}"),
              status: "upcoming"
            }
          end
        rescue JSON::ParserError
          next
        end
      end
      events
    end

    def normalize_scraped_event(container, source_url)
      # More aggressive title search
      title_elem = container.at_css('h1, h2, h3, h4, .title, .event-title, .entry-title, .summary, .views-field-title a')
      title = title_elem&.text&.strip
      return nil if title.blank?

      # Find the link
      link_elem = title_elem&.at_css('a') || 
                  container.at_css('a[href*="event"]') || 
                  container.at_css('.views-field-view-node a') ||
                  container.at_css('a')
      url = absolute_url(link_elem&.[]('href'), source_url)

      # Extract date from various locations
      date_elem = container.at_css('.date, .start-date, .event-date, .dtstart, .time-details, .event-time, .when, .views-field-field-event-date')
      date_text = date_elem&.text&.strip || container.text
      
      starts_at = parse_date(date_text)
      return nil if starts_at.nil?

      # Extract image
      image_elem = container.at_css('img[class*="event"], img[src*="event"], .event-image img, .image img, .views-field-field-image img, img')
      image_url = absolute_url(image_elem&.[]('src'), source_url) if image_elem

      # Virtual detection
      is_virtual = title.downcase.include?("virtual") || 
                   container.text.downcase.include?("zoom") || 
                   container.text.downcase.include?("online")

      {
        title: title,
        description: container.at_css('.description, .summary, .event-description, .entry-content, .event-content, .views-field-body')&.text&.strip,
        event_type: "reading",
        audience_type: title.downcase.include?("kids") || title.downcase.include?("storytime") ? "kids" : "adult",
        starts_at: starts_at,
        is_virtual: is_virtual,
        image_url: image_url,
        external_url: url || source_url,
        external_source: "venue_site",
        external_id: Digest::MD5.hexdigest("#{title}-#{starts_at.to_date}"),
        status: "upcoming"
      }
    end

    private

    def parse_date(date_str)
      return nil if date_str.blank?
      
      # 1. Clean up string - remove day names which often confuse numeric parsers
      # e.g., "Sun, 1/4/2026" -> "1/4/2026"
      clean_str = date_str.gsub(/^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)[a-z]*,?\s*/i, "").strip
      
      # 2. Prefer US numeric format (MM/DD/YYYY) if we see slashes
      if clean_str =~ %r{^\d{1,2}/\d{1,2}/\d{2,4}}
        begin
          # Extract date and time parts
          parts = clean_str.split(/\s+/, 2)
          date_part = parts[0]
          time_part = parts[1]
          
          # Force M/D/Y parsing
          year_format = date_part.split('/').last.length == 4 ? "%Y" : "%y"
          parsed_date = Date.strptime(date_part, "%m/%d/#{year_format}")
          
          if time_part.present?
            # Re-combine with standardized date for Chronic to handle time
            return Chronic.parse("#{parsed_date.strftime('%Y-%m-%d')} #{time_part}") || parsed_date.to_datetime
          else
            return parsed_date.to_datetime
          end
        rescue StandardError
          # Fallback if manual parsing fails
        end
      end

      # 3. Use Chronic with explicit US preference
      Chronic.parse(clean_str, endian_precedence: [:middle, :little]) || 
      Chronic.parse(date_str, endian_precedence: [:middle, :little]) ||
      DateTime.parse(date_str) rescue nil
    end

    def absolute_url(href, base)
      return nil if href.blank?
      URI.join(base, href).to_s rescue href
    end
  end
end

