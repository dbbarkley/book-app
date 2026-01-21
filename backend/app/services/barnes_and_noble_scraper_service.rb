class BarnesAndNobleScraperService < BaseService
  # Barnes & Noble URLs
  # N-1s is the code for "New Releases"
  # N-26 is the code for "Coming Soon"
  # N-29Z8q8 is the code for "Books"
  
  GENRE_MAP = {
    'fiction' => '10h8',
    'non-fiction' => '1py2',
    'mystery' => '16g4',
    'thriller' => '2zzl',
    'romance' => '17y3',
    'sci-fi' => '180l',
    'fantasy' => '180l', # B&N combines Sci-Fi & Fantasy
    'horror' => '14x6',
    'historical' => '10nf',
    'biography' => '1pxp',
    'business' => '1pzc',
    'philosophy' => '1pzm',
    'poetry' => '1pzp',
    'young-adult' => '19zn',
    'children' => '19ys',
    'graphic-novel' => '1pyd'
  }.freeze

  USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0"
  ].freeze

  def initialize(category = :new_releases, genre = nil, limit = 40)
    @category = category.to_sym
    @genre_id = genre ? GENRE_MAP[genre.downcase] : nil
    @limit = limit
  end

  private

  def execute
    url = build_url
    Rails.logger.info "[BarnesAndNobleScraperService] Fetching: #{url}"
    
    # Lower timeout to 8s. B&N often tarpits (stalls) bots. 
    # If they don't respond in 8s, they likely won't.
    response = HTTParty.get(url, 
      timeout: 8,
      headers: {
        "User-Agent" => USER_AGENTS.sample,
        "Accept-Language" => "en-US,en;q=0.9",
        "Referer" => "https://www.barnesandnoble.com/",
        "Accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Connection" => "keep-alive",
        "Upgrade-Insecure-Requests" => "1"
      }
    )

    unless response.success?
      Rails.logger.error "[BarnesAndNobleScraperService] HTTP Error: #{response.code} for #{url}"
      return failure!("Failed to fetch from Barnes & Noble (#{@category} - #{@genre_id})")
    end

    doc = Nokogiri::HTML(response.body)
    books = []

    # B&N sometimes changes layout. We'll look for several possible containers.
    container = doc.at_css('#searchGrid') || doc.at_css('.search-results-content') || doc.at_css('#product-filter-grid') || doc.at_css('.product-shelf-grid')
    search_context = container || doc

    items = search_context.css('.product-shelf-tile, .product-view, .product-shelf-tile-book')
    Rails.logger.info "[BarnesAndNobleScraperService] Found #{items.length} potential items in container"

    items.each do |tile|
      break if books.length >= @limit

      # Ensure the tile is part of the actual results, not a sidebar or footer
      next if tile.ancestors('.featured-carousel, .promo-grid, .recommendations, .related-items, .top-picks, .trending, .secondary-results').any?

      title_el = tile.at_css('.product-info-title a, .product-shelf-title a, .title a, h3.product-info-title a')
      next unless title_el

      title = title_el.text.strip
      path = title_el['href']
      # Strip B&N tracking params
      path = path.split(';').first if path.include?(';')
      url = path.start_with?('http') ? path : "https://www.barnesandnoble.com#{path}"
      
      author_el = tile.at_css('.product-shelf-author a, .product-info-author a, .author a, .product-shelf-author')
      author = author_el ? author_el.text.strip : "Unknown Author"

      img_el = tile.at_css('noscript img') || tile.at_css('.product-shelf-image img, .product-image img, img.lp-lazy, img.full-res')
      
      image_url = if img_el
        img_el['data-src'] || img_el['src'] || img_el['data-original']
      end

      # Fallback to EAN-based high-res image if we have the EAN in the URL
      if !image_url && path =~ /ean=(\d+)/
        ean = $1
        image_url = "https://prodimage.images-bn.com/pimages/#{ean}_p0_v1_s600x900.jpg"
      end

      if image_url&.start_with?("//")
        image_url = "https:#{image_url}"
      elsif image_url&.start_with?("/") && !image_url.start_with?("//")
        image_url = "https://www.barnesandnoble.com#{image_url}"
      end

      books << {
        title: title,
        author_name: author,
        cover_image_url: image_url,
        external_url: url,
        source: 'B&N',
        category: @category.to_s.humanize
      }
    end

    success!(books)
  rescue Net::ReadTimeout, Net::OpenTimeout => e
    failure!("B&N Timeout error: #{e.message}")
  rescue StandardError => e
    failure!("B&N Scraping error: #{e.message}")
  end

  def build_url
    base = "https://www.barnesandnoble.com/b/books/_/"
    category_code = @category == :coming_soon ? "N-26" : "N-1s"
    filter = "#{category_code}Z29Z8q8"
    filter += "Z#{@genre_id}" if @genre_id
    "#{base}#{filter}"
  end
end
