module EventSources
  class LibraryAdapter < BaseAdapter
    # Generic adapter for library events.
    # Public libraries often use systems like Communico or LibraryMarket.
    def fetch_events(venue:)
      return [] unless venue.library?
      website = venue.website_url
      return [] if website.blank?
      
      Rails.logger.info "Checking library events for: #{venue.name}"
      
      # Libraries often have events at /events, /calendar, or specific subdomains
      paths = ["/events", "/calendar", "/programs-events", "/author-talks"]
      events = []

      paths.each do |path|
        begin
          url = URI.join(website, path).to_s
          response = HTTParty.get(url, timeout: 10, headers: { "User-Agent" => "Mozilla/5.0" })
          next unless response.success?

          doc = Nokogiri::HTML(response.body)
          
          # Libraries love JSON-LD for their calendars
          json_ld_events = scrape_json_ld(doc, url)
          if json_ld_events.any?
            events += json_ld_events
            break
          end

          # Generic selectors for library platforms (Communico, LibraryMarket, BiblioEvents, etc.)
          containers = doc.css(
            '.event-container, .event-list-item, .calendar-event, .biblio-event, ' \
            '.communico-event, .lm-event-card, .event-tile'
          )
          
          containers.each do |container|
            normalized = normalize_scraped_event(container, url)
            # Libraries have lots of events, filter for literary ones
            if normalized && literary_event?(normalized)
              events << normalized
            end
          end

          break if events.any?
        rescue StandardError => e
          Rails.logger.warn "Failed to scrape library #{url}: #{e.message}"
        end
      end

      events.compact.uniq { |e| e[:external_id] }
    end

    protected

    def scrape_json_ld(doc, source_url)
      events = []
      doc.css('script[type="application/ld+json"]').each do |script|
        begin
          data = JSON.parse(script.text)
          items = data.is_a?(Array) ? data : [data]
          
          items.each do |item|
            next unless item["@type"] == "Event" || item["@type"]&.include?("Event")
            
            # Libraries have many non-literary events (e.g., yoga, bridge club)
            # We filter by title/description keywords
            normalized = {
              title: item["name"],
              description: item["description"],
              event_type: "reading",
              starts_at: item["startDate"],
              ends_at: item["endDate"],
              external_url: item["url"] || source_url,
              external_source: "venue_site",
              external_id: item["@id"] || Digest::MD5.hexdigest(item["name"] + item["startDate"].to_s),
              status: "upcoming"
            }
            
            events << normalized if literary_event?(normalized)
          end
        rescue JSON::ParserError
          next
        end
      end
      events
    end

    def normalize_scraped_event(container, source_url)
      title_elem = container.at_css('h1, h2, h3, h4, .title, .event-title, .summary')
      title = title_elem&.text&.strip
      return nil if title.blank?

      link_elem = title_elem&.at_css('a') || container.at_css('a[href*="event"]') || container.at_css('a')
      url = absolute_url(link_elem&.[]('href'), source_url)

      date_text = container.css('.date, .start-date, .event-date, .time, .when').text.strip
      date_text = container.text if date_text.blank?

      {
        title: title,
        description: container.at_css('.description, .summary, .event-description, .content')&.text&.strip,
        event_type: "reading",
        starts_at: parse_date(date_text),
        external_url: url || source_url,
        external_source: "venue_site",
        external_id: Digest::MD5.hexdigest(title + (url || source_url)),
        status: "upcoming"
      }
    end

    private

    def literary_event?(event)
      keywords = ["author", "book", "reading", "signing", "writer", "literary", "novel", "poetry", "talk"]
      text = (event[:title].to_s + " " + event[:description].to_s).downcase
      keywords.any? { |kw| text.include?(kw) }
    end

    def parse_date(date_str)
      return nil if date_str.blank?
      Chronic.parse(date_str) || DateTime.parse(date_str) rescue nil
    end

    def absolute_url(href, base)
      return nil if href.blank?
      URI.join(base, href).to_s rescue href
    end
  end
end

