class AmazonScraperService < BaseService
  AMAZON_BASE_URL = "https://www.amazon.com"
  
  # Mapping user genres to Amazon's New Release category IDs
  GENRE_MAP = {
    'fiction' => '17', # Literature & Fiction
    'non-fiction' => '53', # Nonfiction
    'mystery' => '18', # Mystery, Thriller & Suspense
    'thriller' => '18',
    'romance' => '23', # Romance
    'sci-fi' => '25', # Science Fiction & Fantasy
    'fantasy' => '25',
    'horror' => '10159286011', # Horror
    'historical' => '9', # History
    'biography' => '2', # Biographies & Memoirs
    'business' => '3', # Business & Money
    'philosophy' => '11019', # Philosophy
    'poetry' => '10159298011', # Poetry
    'young-adult' => '28', # Teen & Young Adult
    'children' => '4', # Children's Books
    'graphic-novel' => '4366' # Comics & Graphic Novels
  }.freeze

  USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0"
  ].freeze

  def initialize(category = :new_releases, genre = nil, limit = 40)
    @category = category.to_sym
    @genre_id = genre ? GENRE_MAP[genre.downcase] : nil
    @limit = limit
  end

  private

  def execute
    return failure!("Amazon only supports new releases for now") unless @category == :new_releases
    
    url = build_url
    Rails.logger.info "[AmazonScraperService] Fetching: #{url}"

    # Lower timeout to 10s. If Amazon is slow, we don't want to hang.
    response = HTTParty.get(url, 
      timeout: 10,
      headers: {
        "User-Agent" => USER_AGENTS.sample,
        "Accept-Language" => "en-US,en;q=0.9",
        "Accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Referer" => "https://www.amazon.com/",
        "Device-Memory" => "8",
        "Viewport-Width" => "1440"
      }
    )

    unless response.success?
      Rails.logger.error "[AmazonScraperService] HTTP Error: #{response.code} for #{url}"
      return failure!("Failed to fetch from Amazon (#{@genre_id})")
    end

    doc = Nokogiri::HTML(response.body)
    books = []

    # Amazon New Releases often uses a grid with data-client-recs-list
    # and items are often inside divs with class 'p13n-grid-content'
    items = doc.css('.zg-grid-general-faceout, [id^="gridItemRoot"], .p13n-sc-un-indexed-list-item, .zg-carousel-general-faceout, .p13n-grid-content li')
    Rails.logger.info "[AmazonScraperService] Found #{items.length} potential items in response"

    if items.length == 0
      Rails.logger.warn "[AmazonScraperService] HTML snippet (first 500 chars): #{doc.to_html[0..500]}"
    end

    items.each do |item|
      break if books.length >= @limit

      # Target the specific title element
      # Amazon keeps changing these. Let's try to be more robust.
      title_el = item.at_css('div[class*="sc-truncate"], .p13n-sc-truncate, ._cDE3f_p13n-sc-css-line-clamp-1_1Fn1y, .p13n-sc-css-line-clamp-1, .p13n-sc-css-line-clamp-2')
      title_el ||= item.at_css('a div.p13n-sc-css-line-clamp-1')
      title_el ||= item.at_css('span > div')
      
      next unless title_el && title_el.text.strip.present?

      raw_title = title_el.text.strip
      
      # DETECT FORMAT
      format = "Physical"
      if raw_title.downcase.include?("audible audio") || raw_title.downcase.include?("audiobook")
        format = "Audiobook"
      elsif raw_title.downcase.include?("kindle edition")
        format = "Kindle"
      end

      # CLEAN TITLE
      clean_title = raw_title.gsub(/\(Audible Audio\)|Kindle Edition|\[Audiobook\]/i, "").strip
      
      link_el = item.at_css('a.a-link-normal')
      path = link_el ? link_el['href'] : ""
      url = path.start_with?('http') ? path : "#{AMAZON_BASE_URL}#{path}"

      # Remove Amazon tracking parameters from URL
      url = url.split('/ref=').first if url.include?('/ref=')

      author_el = item.at_css('.a-size-small.a-color-base, ._cDE3f_p13n-sc-css-line-clamp-2_EW_Pr, .a-row.a-size-small .a-link-child, .a-size-small.a-color-secondary')
      author = author_el ? author_el.text.strip : "Unknown Author"

      img_el = item.at_css('img')
      image_url = img_el ? img_el['src'] : nil
      
      # Sometimes Amazon uses data-src or a different img attribute
      image_url ||= img_el['data-src'] if img_el

      # Amazon often serves low-res images in best sellers. 
      # We can try to get a higher res version by manipulating the URL
      if image_url && image_url.include?('._AC_')
        image_url = image_url.gsub(/_AC_UL\d+_SR\d+,\d+_/, '_AC_UL600_')
      end

      books << {
        title: clean_title,
        author_name: author,
        cover_image_url: image_url,
        external_url: url,
        source: 'Amazon',
        category: 'New Release',
        format: format
      }
    end

    Rails.logger.info "[AmazonScraperService] Successfully parsed #{books.length} books after filters"

    success!(books)
  rescue Net::ReadTimeout, Net::OpenTimeout => e
    failure!("Amazon Timeout error: #{e.message}")
  rescue StandardError => e
    failure!("Amazon Scraping error: #{e.message}")
  end

  def build_url
    # Amazon New Releases Books
    url = "#{AMAZON_BASE_URL}/gp/new-releases/books/"
    url += "#{@genre_id}/" if @genre_id
    url
  end
end
