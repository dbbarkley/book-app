require 'net/http'
require 'json'

module Api
  module V1
    class BooksController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [
        :index, :show, :show_by_google, :show_by_isbn,
        :author_works, :genre, :catalog_search, :catalog_bulk_upsert,
        :external_search, :isbn_search
      ]
      # Disable Rails ParamsWrapper so POST bodies are accessible as flat params
      # (e.g. params[:title]) instead of being nested under params[:book].
      wrap_parameters false

      # ── Catalog constants ─────────────────────────────────────────────────────

      CATALOG_SOURCES = %w[google_books hardcover nyt open_library curated ensure_book serp unknown].freeze

      # ── Genre constants ────────────────────────────────────────────────────────

      NYT_LIST_MAP = {
        'fiction'          => 'combined-print-and-e-book-fiction',
        'non-fiction'      => 'combined-print-and-e-book-nonfiction',
        'mystery'          => 'mysteries-thrillers',
        'thriller'         => 'mysteries-thrillers',
        'mystery-thriller' => 'mysteries-thrillers',
        'self-help'        => 'advice-how-to-and-miscellaneous',
        'business'         => 'business-books',
        'young-adult'      => 'young-adult',
        'children'         => 'childrens-middle-grade',
        'graphic-novel'    => 'graphic-books-and-manga',
        'graphic-novels'   => 'graphic-books-and-manga',
      }.freeze

      OL_SUBJECT_MAP = {
        'romance'             => 'romance',
        'sci-fi'              => 'science_fiction',
        'science-fiction'     => 'science_fiction',
        'fantasy'             => 'fantasy',
        'horror'              => 'horror',
        'historical'          => 'historical_fiction',
        'historical-fiction'  => 'historical_fiction',
        'literary-fiction'    => 'fiction',
        'biography'           => 'biography',
        'memoir'              => 'autobiography',
        'philosophy'          => 'philosophy',
        'poetry'              => 'poetry',
        'young-adult'         => 'young_adult',
        'self-help'           => 'self_help',
        'graphic-novels'      => 'comics_and_graphic_novels',
      }.freeze

      def index
        books = Book.includes(:author).all

        # Support search query parameter (searches title, author name, and ISBN)
        if params[:query].present?
          query = params[:query].downcase
          # Use joins for the WHERE clause, but keep includes for eager loading
          books = books.includes(:author).joins(:author).where(
            "LOWER(books.title) LIKE ? OR LOWER(authors.name) LIKE ? OR LOWER(books.isbn) LIKE ?",
            "%#{query}%",
            "%#{query}%",
            "%#{query}%"
          )
        end

        books = books.upcoming if params[:upcoming] == 'true'
        books = books.by_author(params[:author_id]) if params[:author_id].present?
        books = books.where(release_date: params[:release_date]) if params[:release_date].present?

        books = books.order(release_date: :desc)

        # Support pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min # Cap at 100

        total_count = books.count
        books = books.limit(per_page).offset((page - 1) * per_page)

        render json: {
          books: serialize_books(books),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      def show
        book = Book.includes(:author).find(params[:id])
        backfill_description(book)
        render json: { book: serialize_book_detail(book) }, status: :ok
      end

      # GET /api/v1/books/by_google/:google_books_id
      # Looks up in DB first; if not found, fetches live from Google Books API.
      # Returns id: nil when the book isn't in our DB yet (browse-only mode).
      def show_by_google
        google_books_id = params[:google_books_id]

        unless google_books_id.match?(/\A(ol_|hc_)?[a-zA-Z0-9_\-]{2,40}\z/)
          return render json: { error: 'Invalid book ID' }, status: :bad_request
        end

        # 1. DB books table — most common path after a user has shelved this book
        book = Book.includes(:author).find_by(google_books_id: google_books_id)
        if book
          backfill_description(book)
          render json: { book: serialize_book_detail(book) }, status: :ok
          return
        end

        # 2. book_catalog — covers Hardcover (hc_), OpenLibrary (ol_), and any book
        #    previously written through from Google Books searches
        catalog = BookCatalog.find_by(google_books_id: google_books_id)
        if catalog
          render json: { book: catalog.to_api_hash }, status: :ok
          return
        end

        # 3. Live fallback — fetch directly from Google Books API and cache
        book_data = fetch_google_book(google_books_id)
        if book_data
          begin
            BookCatalog.upsert_book(book_data.transform_keys(&:to_sym).merge(source: 'google_books'))
          rescue => e
            Rails.logger.warn("[show_by_google] catalog write failed: #{e.message}")
          end
          render json: { book: book_data }, status: :ok
        else
          render json: { error: 'Book not found' }, status: :not_found
        end
      end

      # GET /api/v1/books/by_isbn/:isbn
      # Looks up a book by ISBN-13 (or ISBN-10).
      # DB hit first; falls back to a Google Books isbn: search query.
      # Returns id: nil when the book isn't in our DB yet (browse-only mode).
      def show_by_isbn
        isbn = params[:isbn].to_s.strip

        # Validate: ISBN-13 is 13 digits; ISBN-10 is 9 digits + optional X check digit.
        unless isbn.match?(/\A(\d{13}|\d{9}[\dX])\z/i)
          return render json: { error: 'Invalid ISBN' }, status: :bad_request
        end

        # DB hit — check isbn column first, then google_books_id.
        # Google Books sometimes uses ISBN-13 strings as volume IDs, so a book may
        # be stored with the ISBN in google_books_id rather than isbn.
        book = Book.includes(:author).find_by(isbn: isbn)
        book ||= Book.includes(:author).find_by(google_books_id: isbn)
        if book
          backfill_description(book)
          render json: { book: serialize_book_detail(book) }, status: :ok
          return
        end

        # Also check upcoming_releases table — ISBNdb data lives here before the book
        # is added to a user's shelf and written into books.
        upcoming = UpcomingRelease.find_by(isbn13: isbn)
        if upcoming
          render json: { book: upcoming.as_book_json }, status: :ok
          return
        end

        # Live fallback — search Google Books by ISBN
        book_data = fetch_google_book_by_isbn(isbn)
        if book_data
          render json: { book: book_data }, status: :ok
        else
          render json: { error: 'Book not found' }, status: :not_found
        end
      end

      # GET /api/v1/books/catalog_search?q=<query>&limit=<n>
      # Unauthenticated — returns public book metadata from book_catalog.
      def catalog_search
        q     = params[:q].to_s.strip
        limit = params[:limit].to_i
        limit = 20 if limit < 1
        limit = [limit, 40].min

        return render json: { books: [], count: 0 } if q.blank?

        books = BookCatalog.search(q, limit: limit).map(&:to_api_hash)
        render json: { books: books, count: books.size }
      end

      # POST /api/v1/books/catalog_bulk_upsert
      # Called by the Next.js proxy (fire-and-forget) to write Google Books results
      # into the catalog. Unauthenticated — only writes public book metadata.
      def catalog_bulk_upsert
        source = params[:source].to_s.presence
        source = 'google_books' unless CATALOG_SOURCES.include?(source)

        raw_books = params[:books]
        unless raw_books.is_a?(Array) || raw_books.respond_to?(:to_unsafe_h)
          return render json: { ok: false, error: 'books must be an array' }, status: :bad_request
        end

        books = Array(raw_books).map do |b|
          b.respond_to?(:to_unsafe_h) ? b.to_unsafe_h.symbolize_keys : b.to_h.symbolize_keys
        end

        BookCatalog.upsert_many(books, source: source)
        render json: { ok: true, count: books.size }
      rescue => e
        Rails.logger.error("[catalog_bulk_upsert] #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        render json: { ok: false }, status: :unprocessable_entity
      end

      # POST /api/v1/books/ensure
      # Finds or creates a Book record without touching the user's shelf and without
      # any external API calls — the client sends the data it already has from whatever
      # source it came from (Google Books, Hardcover, NYT, ISBNdb, OpenLibrary, etc.).
      # Deduplication order: ISBN (most universal) → google_books_id → title+author.
      def ensure_book
        title           = params[:title].to_s.strip
        author_name     = params[:author_name].to_s.strip.presence || 'Unknown Author'
        google_books_id = params[:google_books_id].to_s.strip.presence
        isbn            = params[:isbn].to_s.strip.presence

        return render json: { error: 'title is required' }, status: :bad_request if title.blank?

        # Dedup: ISBN first (universal), then google_books_id, then title+author
        book  = Book.find_by(isbn: isbn) if isbn.present?
        book ||= Book.find_by(google_books_id: google_books_id) if google_books_id.present?
        book ||= Book.joins(:author)
                     .where('LOWER(books.title) = ? AND LOWER(authors.name) = ?',
                            title.downcase, author_name.downcase)
                     .first

        unless book
          author = Author.find_or_create_by!(name: author_name)

          book = Book.new(
            title:           title,
            isbn:            isbn,
            google_books_id: google_books_id,
            description:     params[:description],
            cover_image_url: params[:cover_image_url],
            release_date:    parse_book_date(params[:release_date].to_s),
            page_count:      params[:page_count],
            categories:      Array(params[:categories]),
            author:          author
          )

          unless book.save
            Rails.logger.error "[Books#ensure_book] save failed: #{book.errors.full_messages}"
            return render json: { error: 'Could not save book' }, status: :unprocessable_entity
          end

          work = WorkResolutionService.resolve(
            google_books_id: book.google_books_id,
            isbn:            book.isbn,
            title:           book.title,
            author:          book.author&.name,
            description:     book.description,
            cover_image_url: book.cover_image_url,
            page_count:      book.page_count,
          )
          book.update_column(:work_id, work.id)
        end

        # Keep catalog current regardless of whether book was found or created
        BookCatalog.upsert_book({
          google_books_id: book.google_books_id,
          isbn:            book.isbn,
          title:           book.title,
          author_name:     book.author&.name,
          cover_image_url: book.cover_image_url,
          description:     book.description,
          published_date:  book.release_date&.to_s,
          page_count:      book.page_count,
          categories:      book.categories,
          source:          'ensure_book',
        })

        render json: { id: book.id, title: book.title }, status: :ok
      rescue => e
        Rails.logger.error "[Books#ensure_book] #{e.message}"
        render json: { error: 'Could not save book' }, status: :unprocessable_entity
      end

      # GET /api/v1/books/external_search?q=...&limit=20&type=books|authors
      # Proxies Google Books search (with API key) to Next.js, falling back to
      # Open Library when Google rate-limits. Returns items in the Google Books
      # volumeInfo envelope so the Next.js merge/dedup logic is unchanged.
      def external_search
        q     = params[:q].to_s.strip
        limit = [[params[:limit].to_i, 1].max, 40].min
        limit = 20 if params[:limit].blank?
        type  = params[:type].to_s.presence || 'books'

        return render json: { items: [] } if q.blank?

        items = gb_search(q, limit, type)
        return render json: { items: items, _source: 'google_books' } if items.any?

        items = ol_search(q, limit, type)
        render json: { items: items, _source: 'open_library' }
      rescue => e
        Rails.logger.error("[external_search] #{e.class}: #{e.message}")
        render json: { items: [] }
      end

      # GET /api/v1/books/isbn_search?isbn=9781234567890
      # Proxies Google Books ISBN lookup (with API key), falling back to the
      # Open Library /isbn/:isbn.json endpoint. Used by the barcode scanner.
      def isbn_search
        isbn = params[:isbn].to_s.gsub(/\D/, '')
        return render json: { items: [] } if isbn.blank?

        item = gb_isbn(isbn)
        return render json: { items: [item], _source: 'google_books' } if item

        item = ol_isbn(isbn)
        return render json: { items: [item], _source: 'open_library' } if item

        render json: { items: [] }
      rescue => e
        Rails.logger.error("[isbn_search] #{e.class}: #{e.message}")
        render json: { items: [] }
      end

      # GET /api/v1/books/author_works?author=Matt+Dinniman&exclude=Dungeon+Crawler+Carl
      # Proxies to Google Books API (inauthor: query) so mobile gets the same
      # rich results as the web without needing the Next.js server route.
      #
      # Results are cached per-author for 24 hours. Author catalogs change rarely,
      # so this is safe and avoids hammering Google Books on every book detail view.
      # Cache key is normalised (downcased, stripped) so "Brandon Sanderson" and
      # "brandon sanderson" share the same entry.
      AUTHOR_WORKS_CACHE_TTL = 24.hours
      GOOGLE_BOOKS_READ_TIMEOUT = 5 # seconds

      def author_works
        author  = params[:author].to_s.strip
        exclude = params[:exclude].to_s.strip.downcase

        return render json: { works: [] } if author.blank?

        cache_key = "author_works/v3/#{author.downcase.gsub(/\s+/, '_')}"

        # Fetch the full author catalog from cache or Google Books.
        # We cache the raw list (before exclude filtering) so the same cache entry
        # can be reused regardless of which book the user is currently viewing.
        #
        # Empty results are NOT cached — Google Books is non-deterministic and can
        # return nothing on a bad call. Manual read/write lets us skip the write
        # when the result is empty so a flaky first request doesn't poison the
        # cache for 24 hours.
        works = Rails.cache.read(cache_key)
        if works.nil?
          works = fetch_author_works_from_google(author)
          if works.any?
            begin
              Rails.cache.write(cache_key, works, expires_in: AUTHOR_WORKS_CACHE_TTL)
              BookCatalog.upsert_author_works(works, author: author)
            rescue => e
              Rails.logger.warn("[author_works] cache/catalog write failed for '#{author}': #{e.message}")
            end
          end
        end

        # Normalize the exclude title so variants like "Project Hail Mary (Movie Tie-In)"
        # are also excluded when the user is viewing "Project Hail Mary".
        exclude_normalized = WorkResolutionService.normalize_title(exclude)

        seen = Set.new
        deduped = works
          .reject { |w| WorkResolutionService.normalize_title(w[:title]) == exclude_normalized }
          .select do |w|
            nt = WorkResolutionService.normalize_title(w[:title])
            # Reject exact duplicates
            next false if seen.include?(nt)
            # Reject foreign-language editions that append the English title after a separator,
            # e.g. "Sopravvissuto. The Martian" → "sopravvissuto the martian" ends with " martian"
            next false if seen.any? { |s| s.length >= 4 && nt.end_with?(" #{s}") }
            next false if exclude_normalized.length >= 4 && nt.end_with?(" #{exclude_normalized}")
            seen.add(nt)
            true
          end

        render json: { works: deduped }
      rescue => e
        Rails.logger.error("[author_works] Unexpected error for '#{params[:author]}': #{e.message}")
        render json: { works: [], error: true }, status: :ok
      end

      # GET /api/v1/books/genre?id=fiction
      # Proxies NYT Bestsellers or Open Library subjects so mobile gets the same
      # genre browsing as the web without needing Next.js API routes.
      def genre
        genre_id = params[:id].to_s.strip.downcase
        return render json: { books: [], _source: nil } if genre_id.blank?

        # Try NYT first
        nyt_list = NYT_LIST_MAP[genre_id]
        if nyt_list
          begin
            books = fetch_genre_from_nyt(nyt_list)
            return render json: { books: books, _source: 'nyt' }
          rescue => e
            Rails.logger.warn("[genre] NYT failed for '#{genre_id}': #{e.message}, falling back to OL")
          end
        end

        # Open Library fallback (or primary for non-NYT genres)
        ol_subject = OL_SUBJECT_MAP[genre_id] || genre_id.gsub(/[\s-]+/, '_')
        begin
          books = fetch_genre_from_open_library(ol_subject)
          render json: { books: books, _source: 'open_library' }
        rescue => e
          Rails.logger.error("[genre] All sources failed for '#{genre_id}': #{e.message}")
          render json: { books: [], _source: nil }, status: :bad_gateway
        end
      end

      # GET /api/v1/books/:id/friends
      def friends
        book = Book.find(params[:id])
        
        friend_ids = current_user.followed_users.pluck(:id)
        identity   = book.work_id ? { work_id: book.work_id } : { book_id: book.id }

        user_books = UserBook.includes(:user)
                             .where(identity)
                             .where(user_id: friend_ids, visibility: 'public')
                             .limit(10)

        render json: {
          friends: user_books.map { |ub| 
            {
              id: ub.user.id,
              username: ub.user.username,
              display_name: ub.user.display_name,
              avatar_url: ub.user.avatar_url_with_attachment,
              status: ub.status
            }
          }
        }, status: :ok
      end

      private

      # ── External search helpers (Google Books + Open Library) ─────────────────

      GB_SEARCH_TIMEOUT = 10

      def gb_http_client(host = 'www.googleapis.com')
        http = Net::HTTP.new(host, 443)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = GB_SEARCH_TIMEOUT
        http
      end

      def gb_item_clean(item)
        vi = item['volumeInfo']
        return item unless vi
        item.merge('volumeInfo' => vi.merge('description' => strip_html(vi['description'])))
      end

      def gb_search(q, limit, type)
        api_key = ENV['GOOGLE_BOOKS_API_KEY']
        search_q = type == 'authors' ? "inauthor:\"#{q}\"" : q
        fetch_count = [limit * 2, 40].min

        params = {
          'q'          => search_q,
          'maxResults' => fetch_count.to_s,
          'orderBy'    => 'relevance',
          'printType'  => 'books',
          'fields'     => 'items/id,items/volumeInfo',
        }
        params['key'] = api_key if api_key.present?

        uri = URI('https://www.googleapis.com/books/v1/volumes')
        uri.query = URI.encode_www_form(params)

        response = gb_http_client.get(uri.request_uri)
        return [] unless response.is_a?(Net::HTTPSuccess)

        (JSON.parse(response.body)['items'] || []).map { |item| gb_item_clean(item) }
      rescue Net::ReadTimeout, Net::OpenTimeout
        Rails.logger.warn('[external_search] Google Books timed out')
        []
      rescue => e
        Rails.logger.warn("[external_search] Google Books failed: #{e.message}")
        []
      end

      def ol_search(q, limit, type)
        param  = type == 'authors' ? 'author' : 'q'
        fields = 'key,title,author_name,cover_i,isbn,first_publish_year,number_of_pages_median'

        uri = URI('https://openlibrary.org/search.json')
        uri.query = URI.encode_www_form(param => q, 'limit' => (limit * 2).to_s,
                                        'fields' => fields, 'sort' => 'readinglog')

        http = Net::HTTP.new(uri.host, 443)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = GB_SEARCH_TIMEOUT

        response = http.get(uri.request_uri)
        raise "Open Library responded with #{response.code}" unless response.is_a?(Net::HTTPSuccess)

        (JSON.parse(response.body)['docs'] || [])
          .select { |doc| doc['cover_i'].present? }
          .first(limit)
          .each_with_index
          .map { |doc, idx| ol_doc_to_volume_item(doc, idx) }
      end

      def ol_doc_to_volume_item(doc, idx)
        raw_key = doc['key'].to_s
        ol_id   = raw_key.sub(%r{\A/works/OL}, '').presence || idx.to_s
        cover_i = doc['cover_i']
        isbn    = Array(doc['isbn']).find { |i| i.to_s.length == 13 } || Array(doc['isbn']).first

        {
          'id'         => "ol_#{ol_id}",
          'volumeInfo' => {
            'title'               => doc['title'] || 'Unknown Title',
            'authors'             => Array(doc['author_name']),
            'publishedDate'       => doc['first_publish_year']&.to_s,
            'pageCount'           => doc['number_of_pages_median'],
            'imageLinks'          => cover_i ? {
              'thumbnail'      => "https://covers.openlibrary.org/b/id/#{cover_i}-M.jpg",
              'smallThumbnail' => "https://covers.openlibrary.org/b/id/#{cover_i}-S.jpg",
            } : nil,
            'industryIdentifiers' => isbn ? [{ 'type' => 'ISBN_13', 'identifier' => isbn.to_s }] : [],
            'infoLink'            => "https://openlibrary.org#{doc['key']}",
          }.compact,
          '_source'    => 'open_library',
        }
      end

      def gb_isbn(isbn)
        api_key = ENV['GOOGLE_BOOKS_API_KEY']
        params  = { 'q' => "isbn:#{isbn}", 'maxResults' => '1', 'printType' => 'books',
                    'fields' => 'items/id,items/volumeInfo' }
        params['key'] = api_key if api_key.present?

        uri = URI('https://www.googleapis.com/books/v1/volumes')
        uri.query = URI.encode_www_form(params)

        response = gb_http_client.get(uri.request_uri)
        return nil unless response.is_a?(Net::HTTPSuccess)

        item = Array(JSON.parse(response.body)['items']).first
        item ? gb_item_clean(item) : nil
      rescue => e
        Rails.logger.warn("[isbn_search] Google Books failed for #{isbn}: #{e.message}")
        nil
      end

      def ol_isbn(isbn)
        uri      = URI("https://openlibrary.org/isbn/#{isbn}.json")
        http     = Net::HTTP.new(uri.host, 443)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = GB_SEARCH_TIMEOUT

        response = http.get(uri.request_uri)
        return nil unless response.is_a?(Net::HTTPSuccess)

        ol = JSON.parse(response.body)
        title = ol['title'].presence
        return nil unless title

        work_key = (Array(ol['works']).first&.dig('key') || ol['key']).to_s
        ol_id    = work_key.sub(%r{\A/works/OL}, '').presence || isbn
        cover_id = Array(ol['covers']).first

        author_name = ''
        author_key  = Array(ol['authors']).first&.dig('key')
        if author_key.present?
          begin
            a_uri  = URI("https://openlibrary.org#{author_key}.json")
            a_http = Net::HTTP.new(a_uri.host, 443)
            a_http.use_ssl = true
            a_http.open_timeout = 3
            a_http.read_timeout = 5
            a_resp = a_http.get(a_uri.request_uri)
            author_name = JSON.parse(a_resp.body)['name'].to_s if a_resp.is_a?(Net::HTTPSuccess)
          rescue => e
            Rails.logger.warn("[isbn_search] OL author fetch failed: #{e.message}")
          end
        end

        {
          'id'         => "ol_#{ol_id}",
          'volumeInfo' => {
            'title'               => title,
            'authors'             => author_name.present? ? [author_name] : [],
            'publishedDate'       => ol['publish_date'],
            'pageCount'           => ol['number_of_pages'],
            'imageLinks'          => cover_id ? {
              'thumbnail'      => "https://covers.openlibrary.org/b/id/#{cover_id}-M.jpg",
              'smallThumbnail' => "https://covers.openlibrary.org/b/id/#{cover_id}-S.jpg",
            } : nil,
            'industryIdentifiers' => [{ 'type' => 'ISBN_13', 'identifier' => isbn }],
          }.compact,
          '_source'    => 'open_library',
        }
      rescue => e
        Rails.logger.warn("[isbn_search] Open Library failed for #{isbn}: #{e.message}")
        nil
      end

      # ── Author works helper ───────────────────────────────────────────────────

      # Fetches an author's catalog from Google Books with a hard read timeout.
      # Returns an array of hashes: { key:, title:, year:, cover_url: }.
      # Called inside Rails.cache.fetch — result is stored for 24h.
      def fetch_author_works_from_google(author)
        query   = "inauthor:\"#{author}\""
        api_key = ENV['GOOGLE_BOOKS_API_KEY']
        fields  = 'items/id,' \
                  'items/volumeInfo/title,' \
                  'items/volumeInfo/authors,' \
                  'items/volumeInfo/publishedDate,' \
                  'items/volumeInfo/imageLinks,' \
                  'items/volumeInfo/averageRating,' \
                  'items/volumeInfo/ratingsCount,' \
                  'items/volumeInfo/language,' \
                  'items/volumeInfo/industryIdentifiers,' \
                  'items/volumeInfo/description,' \
                  'items/volumeInfo/pageCount'
        url     = "https://www.googleapis.com/books/v1/volumes" \
                  "?q=#{URI.encode_www_form_component(query)}" \
                  "&maxResults=40&orderBy=relevance&printType=books&langRestrict=en" \
                  "&fields=#{URI.encode_www_form_component(fields)}"
        url    += "&key=#{api_key}" if api_key.present?

        uri  = URI.parse(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl      = true
        http.read_timeout = GOOGLE_BOOKS_READ_TIMEOUT
        http.open_timeout = GOOGLE_BOOKS_READ_TIMEOUT

        response = http.get(uri.request_uri)
        data     = JSON.parse(response.body)
        items    = data['items'] || []

        author_norm = WorkResolutionService.normalize_author(author)

        items
          .select { |item| item.dig('volumeInfo', 'imageLinks', 'thumbnail').present? }
          .select { |item|
            authors = Array(item.dig('volumeInfo', 'authors'))
            next true if authors.empty?
            WorkResolutionService.normalize_author(authors.first) == author_norm
          }
          .first(20)
          .map do |item|
            vi   = item['volumeInfo'] || {}
            isbn = Array(vi['industryIdentifiers']).compact
                     .find { |id| id['type'] == 'ISBN_13' }&.dig('identifier') ||
                   Array(vi['industryIdentifiers']).compact
                     .find { |id| id['type'] == 'ISBN_10' }&.dig('identifier')
            {
              key:             item['id'],
              title:           vi['title'],
              year:            vi['publishedDate'] ? vi['publishedDate'].to_i : nil,
              cover_url:       vi.dig('imageLinks', 'thumbnail'),
              ratings_average: vi['averageRating'] ? vi['averageRating'].to_f.round(1) : nil,
              ratings_count:   vi['ratingsCount'].to_i,
              language:        vi['language'],
              isbn:            isbn,
              description:     vi['description'],
              page_count:      vi['pageCount']&.to_i,
            }
          end
      rescue Net::ReadTimeout, Net::OpenTimeout => e
        Rails.logger.warn("[author_works] Google Books timed out for '#{author}': #{e.message}")
        []
      rescue => e
        Rails.logger.error("[author_works] Google Books fetch failed for '#{author}': #{e.message}")
        []
      end

      # ── Genre helpers ─────────────────────────────────────────────────────────

      def fetch_genre_from_nyt(list_name)
        api_key = ENV['NEW_YORK_TIMES_API_KEY']
        raise 'NYT API key not configured' if api_key.blank?

        uri = URI("https://api.nytimes.com/svc/books/v3/lists/current/#{list_name}.json?api-key=#{api_key}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 8
        http.read_timeout = 12

        resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        raise "NYT returned #{resp.code}" unless resp.is_a?(Net::HTTPSuccess)

        books_data = JSON.parse(resp.body).dig('results', 'books') || []

        # Resolve Google Books IDs from ISBNs in parallel threads
        threads = books_data.map do |b|
          Thread.new do
            isbn = b['primary_isbn13'] || b['primary_isbn10']
            gbid = isbn ? resolve_google_books_id(isbn) : nil
            next nil unless gbid || isbn

            {
              id: nil,
              title: b['title'],
              author_name: b['author'],
              cover_image_url: b['book_image'],
              description: b['description'].presence,
              google_books_id: gbid,
              isbn: b['primary_isbn13'] || b['primary_isbn10'],
              release_date: '',
              _source: 'nyt',
              _rank: b['rank'],
            }
          end
        end

        overlay_db_covers(threads.map(&:value).compact)
      end

      def fetch_genre_from_open_library(subject)
        uri = URI("https://openlibrary.org/subjects/#{URI.encode_www_form_component(subject)}.json?limit=24")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 8
        http.read_timeout = 12

        resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        raise "Open Library returned #{resp.code}" unless resp.is_a?(Net::HTTPSuccess)

        works = JSON.parse(resp.body)['works'] || []

        results = works
          .select { |w| w['cover_id'].present? }
          .map do |w|
            ol_key = w['key'].to_s.sub('/works/', '')
            {
              id: nil,
              title: w['title'],
              author_name: w.dig('authors', 0, 'name') || 'Unknown Author',
              cover_image_url: "https://covers.openlibrary.org/b/id/#{w['cover_id']}-M.jpg",
              google_books_id: "ol_#{ol_key}",
              isbn: nil,
              release_date: w['first_publish_year'].to_s,
              _source: 'open_library',
            }
          end

        overlay_db_covers(results)
      end

      # For any books we already have in our DB, substitute our stored cover so the
      # thumbnail in browse lists matches the cover shown on the detail page.
      # Two queries regardless of list size: one by ISBN, one by google_books_id.
      def overlay_db_covers(results)
        return results if results.empty?

        isbns      = results.filter_map { |r| r[:isbn] }.uniq
        google_ids = results.filter_map { |r| r[:google_books_id] }.uniq

        by_isbn   = Book.where(isbn: isbns).where.not(cover_image_url: [nil, ''])
                        .pluck(:isbn, :cover_image_url).to_h
        # Include ISBNs in the google_books_id lookup — Google Books uses ISBN-13
        # as the volume ID for some editions, so the ISBN may be stored there instead.
        by_google = Book.where(google_books_id: (google_ids + isbns).uniq)
                        .where.not(cover_image_url: [nil, ''])
                        .pluck(:google_books_id, :cover_image_url).to_h

        results.map do |r|
          stored = by_isbn[r[:isbn]] ||
                   by_google[r[:google_books_id]] ||
                   by_google[r[:isbn]]
          stored ? r.merge(cover_image_url: stored) : r
        end
      end

      def resolve_google_books_id(isbn)
        key = ENV['GOOGLE_BOOKS_API_KEY']
        params = "q=isbn:#{isbn}&maxResults=1&fields=items/id"
        params += "&key=#{key}" if key.present?

        uri = URI("https://www.googleapis.com/books/v1/volumes?#{params}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 8

        resp = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless resp.is_a?(Net::HTTPSuccess)

        JSON.parse(resp.body).dig('items', 0, 'id')
      rescue
        nil
      end

      # Backfill a missing description from whichever source makes sense.
      # OL books (google_books_id starts with "ol_") don't have a direct Google
      # Books volume ID, so we search Google Books by title + author instead.
      def backfill_description(book)
        return unless book.description.blank?

        description =
          if book.google_books_id&.start_with?('ol_')
            fetch_description_via_google_search(book)
          elsif book.google_books_id.present?
            fetch_google_book(book.google_books_id)&.dig(:description)
          else
            fetch_description_via_google_search(book)
          end

        if description.present?
          book.update_column(:description, description)
          book.reload
        end
      end

      # For OL-sourced books (google_books_id starts with "ol_"), search Google Books
      # by title + author to get a description. This is more reliable than the OL
      # works API, which has sparse/missing descriptions for many books.
      def fetch_description_via_google_search(book)
        return nil if book.title.blank?

        author  = book.author&.name.presence || ''
        query   = author.present? ? "intitle:#{book.title} inauthor:#{author}" : "intitle:#{book.title}"
        key     = ENV['GOOGLE_BOOKS_API_KEY']
        params  = "q=#{URI.encode_www_form_component(query)}&maxResults=1&printType=books"
        params += "&key=#{key}" if key.present?

        uri  = URI("https://www.googleapis.com/books/v1/volumes?#{params}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl    = true
        http.open_timeout = 5
        http.read_timeout = 10

        response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless response.is_a?(Net::HTTPSuccess)

        data  = JSON.parse(response.body)
        first = data.dig('items', 0, 'volumeInfo') || {}
        strip_html(first['description'])
      rescue => e
        Rails.logger.error("Google Books title-search description error for #{book.title}: #{e.message}")
        nil
      end

      # Fetch a single volume from the Google Books API by its volume ID.
      # Returns a hash shaped like serialize_book_detail (with id: nil) or nil on failure.
      def fetch_google_book(google_books_id)
        key = ENV['GOOGLE_BOOKS_API_KEY']
        api_key_param = key.present? ? "?key=#{key}" : ''
        uri = URI("https://www.googleapis.com/books/v1/volumes/#{URI.encode_www_form_component(google_books_id)}#{api_key_param}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 10

        response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless response.is_a?(Net::HTTPSuccess)

        data = JSON.parse(response.body)
        v = data['volumeInfo'] || {}
        image_links = v['imageLinks'] || {}
        identifiers = Array(v['industryIdentifiers'])

        {
          id: nil,
          google_books_id: google_books_id,
          title: v['title'] || 'Unknown Title',
          isbn: identifiers.find { |i| i['type'] == 'ISBN_13' }&.dig('identifier') ||
                identifiers.find { |i| i['type'] == 'ISBN_10' }&.dig('identifier'),
          description: strip_html(v['description']),
          cover_image_url: image_links['thumbnail'] || image_links['smallThumbnail'],
          release_date: v['publishedDate'],
          page_count: v['pageCount'],
          author_name: Array(v['authors']).first || 'Unknown Author',
          author: nil,
          followers_count: 0,
          categories: Array(v['categories']),
        }
      rescue => e
        Rails.logger.error("Google Books API error for #{google_books_id}: #{e.message}")
        nil
      end

      # Search Google Books by ISBN and return a book hash (id: nil = not in our DB).
      def fetch_google_book_by_isbn(isbn)
        key = ENV['GOOGLE_BOOKS_API_KEY']
        params = { 'q' => "isbn:#{isbn}", 'maxResults' => '1' }
        params['key'] = key if key.present?
        uri = URI("https://www.googleapis.com/books/v1/volumes")
        uri.query = URI.encode_www_form(params)

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 10

        response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
        return nil unless response.is_a?(Net::HTTPSuccess)

        data = JSON.parse(response.body)
        item = Array(data['items']).first
        return nil unless item

        v = item['volumeInfo'] || {}
        image_links = v['imageLinks'] || {}
        identifiers = Array(v['industryIdentifiers'])

        {
          id: nil,
          google_books_id: item['id'],
          title: v['title'] || 'Unknown Title',
          isbn: isbn,
          description: strip_html(v['description']),
          cover_image_url: image_links['thumbnail'] || image_links['smallThumbnail'],
          release_date: v['publishedDate'],
          page_count: v['pageCount'],
          author_name: Array(v['authors']).first || 'Unknown Author',
          author: nil,
          followers_count: 0,
          categories: Array(v['categories']),
        }
      rescue => e
        Rails.logger.error("Google Books ISBN lookup error for #{isbn}: #{e.message}")
        nil
      end

      # Strip HTML tags and decode common entities from Google Books descriptions.
      def parse_book_date(date_string)
        return nil if date_string.blank?
        case date_string.length
        when 4  then Date.new(date_string.to_i, 1, 1)
        when 7  then Date.parse("#{date_string}-01")
        else         Date.parse(date_string)
        end
      rescue ArgumentError
        nil
      end

      def strip_html(text)
        return nil if text.blank?
        text
          .gsub(/<br\s*\/?>/i, "\n")
          .gsub(/<[^>]+>/, '')
          .gsub(/&amp;/, '&')
          .gsub(/&lt;/, '<')
          .gsub(/&gt;/, '>')
          .gsub(/&quot;/, '"')
          .gsub(/&#39;/, "'")
          .gsub(/&nbsp;/, ' ')
          .strip
          .presence
      end

      def serialize_books(books)
        books.map { |book| serialize_book(book) }
      end

      def serialize_book(book)
        {
          id: book.id,
          title: book.title,
          author_name: book.author.name,
          author_id: book.author.id,
          google_books_id: book.google_books_id,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          page_count: book.respond_to?(:page_count) ? book.page_count : nil
        }
      end

      def serialize_book_detail(book)
        {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          page_count: book.respond_to?(:page_count) ? book.page_count : nil,
          # Flat fields expected by shared Book type (mobile + web)
          author_name: book.author.name,
          author_id: book.author.id,
          google_books_id: book.google_books_id,
          # Nested author object for web detail views
          author: {
            id: book.author.id,
            name: book.author.name,
            avatar_url: book.author.avatar_url
          },
          followers_count: book.followers.count,
          categories: book.categories
        }
      end
    end
  end
end

