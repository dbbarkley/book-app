# frozen_string_literal: true

require 'net/http'
require 'json'

# HardcoverSimilarityService
#
# Given a Book record, returns up to 20 similar books using Hardcover's
# genre + mood tag graph — no AI, community-sourced signal.
#
# Flow (each step independently cached):
#
#   1. Find book on Hardcover by exact title, pick best author match  (7-day cache)
#      → GraphQL: books(where: { title: { _eq: $title } })
#      → extracts `cached_tags` + `literary_type_id` (1=Fiction, 2=Nonfiction)
#
#   2. For each of the top tags (1 genre + 3 moods), fetch books      (24-hour cache)
#      → Filters by opposite literary_type exclusion so fiction seeds
#        never return non-fiction and vice versa
#      → Cache key includes literary_type so fiction/nonfiction results
#        are stored separately per slug
#
#   3. Frequency merge: books appearing across multiple tag queries rank higher
#      → A book matching genre + 3 moods scores 4; pure genre match scores 1
#
#   4. Enrich: try DB lookup by title+author for full metadata + google_books_id
#      → If in DB → full record; if not → Hardcover metadata (id: nil)
#
# Noise genres filtered out (too broad to signal anything):
#   Fiction, Nonfiction, Literature, Adult
#
# Usage:
#   results = HardcoverSimilarityService.new(book).call
#   # => Array of Book-shaped hashes (up to 20)
#
class HardcoverSimilarityService
  GQL_ENDPOINT   = 'https://api.hardcover.app/v1/graphql'
  TIMEOUT_OPEN   = 8
  TIMEOUT_READ   = 15
  MAX_RESULTS    = 20
  MAX_GENRE_TAGS = 1   # top genre slug to query (broad signal)
  MAX_MOOD_TAGS  = 3   # top mood slugs to query (specific signal)
  BOOKS_PER_TAG  = 30  # results per tag query before merging

  LITERARY_TYPE_FICTION    = 1
  LITERARY_TYPE_NONFICTION = 2

  # Genres too broad to differentiate — skip when picking the seed genre tag
  NOISE_GENRES = %w[fiction nonfiction literature adult].freeze

  def initialize(book)
    @book = book
  end

  def call
    log "━━━ HardcoverSimilarity starting for Book ##{@book.id} '#{@book.title}' ━━━"

    unless @book.title.present?
      log "Book ##{@book.id} has no title — skipping"
      return []
    end

    # Step 1: Find book on Hardcover + extract tags
    hc_book = fetch_hardcover_book
    unless hc_book
      log "Could not find '#{@book.title}' on Hardcover — returning []"
      return []
    end

    literary_type_id = hc_book['literary_type_id']
    type_label = case literary_type_id
                 when LITERARY_TYPE_FICTION    then 'Fiction'
                 when LITERARY_TYPE_NONFICTION then 'Nonfiction'
                 else 'Unknown'
                 end

    log "Matched Hardcover book: '#{hc_book['title']}' (id: #{hc_book['id']}, users: #{hc_book['users_count']}, type: #{type_label})"

    tags = extract_signal_tags(hc_book['cached_tags'])
    if tags.empty?
      log "No usable genre/mood tags found for '#{@book.title}' — returning []"
      return []
    end

    log "Signal tags (#{tags.size}): #{tags.map { |t| "#{t[:category]}:#{t[:slug]}" }.join(', ')}"

    # Step 2: Collect candidates across all tags, filtered by literary type
    candidates = collect_candidates(tags, literary_type_id)
    log "Collected #{candidates.size} unique candidates across #{tags.size} tag queries"

    return [] if candidates.empty?

    # Step 3: Rank by tag-match frequency, break ties by Hardcover user count
    ranked = rank_candidates(candidates, hc_book['id'])
    log "After ranking + seed filter: #{ranked.size} candidates"
    log "Top 5: #{ranked.first(5).map { |c| "'#{c[:hc]['title']}' (score: #{c[:tag_count]})" }.join(', ')}"

    # Step 4: Enrich with DB lookup
    results = enrich_results(ranked.first(MAX_RESULTS + 10))
    log "Enriched #{results.size} results (#{results.count { |r| r[:id] }} in DB, #{results.count { |r| r[:id].nil? }} HC-only)"
    log "━━━ HardcoverSimilarity done — returning #{[results.size, MAX_RESULTS].min} books ━━━"

    results.first(MAX_RESULTS)
  rescue => e
    Rails.logger.error("[HCSimilarity] Error for Book ##{@book.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    []
  end

  private

  # ── Step 1: Find book on Hardcover ────────────────────────────────────────

  def fetch_hardcover_book
    Rails.cache.fetch("hc_book:#{@book.id}", expires_in: 7.days) do
      log "CACHE MISS — searching Hardcover for '#{@book.title}'"

      query = <<~GQL
        query FindBook($title: String!) {
          books(
            where: { title: { _eq: $title } }
            order_by: { users_count: desc }
            limit: 5
          ) {
            id
            title
            slug
            users_count
            literary_type_id
            cached_tags
            cached_image
            contributions { author { name } }
          }
        }
      GQL

      data = graphql_post(query, { title: @book.title })
      books = data&.dig('books') || []
      log "Hardcover returned #{books.size} candidate(s) for title '#{@book.title}'"

      result = best_book_match(books)
      log(result ? "Selected: '#{result['title']}' id=#{result['id']} literary_type_id=#{result['literary_type_id'].inspect}" : "No match found")
      result
    end
  end

  # Pick the candidate whose author best matches ours; fall back to highest users_count
  def best_book_match(books)
    return nil if books.empty?
    return books.first if books.size == 1

    our_author = normalize_name(author_name)

    if our_author.present?
      matched = books.find do |b|
        Array(b['contributions']).any? do |c|
          candidate = normalize_name(c.dig('author', 'name').to_s)
          candidate.include?(our_author) || our_author.include?(candidate)
        end
      end
      return matched if matched
    end

    books.first # already sorted by users_count desc
  end

  # ── Step 2: Extract genre + mood signal tags ───────────────────────────────

  def extract_signal_tags(cached_tags)
    return [] if cached_tags.blank?

    genre_tags = Array(cached_tags['Genre'])
      .reject { |t| NOISE_GENRES.include?(t['tag'].to_s.downcase.strip) }
      .sort_by { |t| -t['count'].to_i }
      .first(MAX_GENRE_TAGS)
      .map { |t| { slug: t['tagSlug'], category: 'Genre', tag: t['tag'], count: t['count'].to_i } }

    mood_tags = Array(cached_tags['Mood'])
      .sort_by { |t| -t['count'].to_i }
      .first(MAX_MOOD_TAGS)
      .map { |t| { slug: t['tagSlug'], category: 'Mood', tag: t['tag'], count: t['count'].to_i } }

    all = genre_tags + mood_tags
    log "Extracted tags — Genre: #{genre_tags.map { |t| t[:tag] }.inspect}, Mood: #{mood_tags.map { |t| t[:tag] }.inspect}"
    all
  end

  # ── Step 3: Collect + merge candidates ────────────────────────────────────

  def collect_candidates(tags, literary_type_id)
    tally = {}

    tags.each_with_index do |tag, idx|
      log "  [#{idx + 1}/#{tags.size}] Fetching books for #{tag[:category]}:'#{tag[:tag]}' (slug: #{tag[:slug]})"
      books = fetch_books_for_tag(tag[:slug], literary_type_id)
      log "  [#{idx + 1}/#{tags.size}] Got #{books.size} books"

      books.each do |b|
        key = b['id'].to_s
        next if key.blank?

        if tally[key]
          tally[key][:tag_count] += 1
          tally[key][:matched_tags] << tag[:tag]
          log "    ↑ '#{b['title']}' now matches #{tally[key][:tag_count]} tags"
        else
          tally[key] = {
            hc:           b,
            tag_count:    1,
            matched_tags: [tag[:tag]],
          }
        end
      end
    end

    tally.values
  end

  def fetch_books_for_tag(slug, literary_type_id)
    # Include literary_type in cache key — fiction/nonfiction results differ
    cache_key = "hc_tag:#{slug}:lt#{literary_type_id.to_i}"

    Rails.cache.fetch(cache_key, expires_in: 24.hours) do
      log "  CACHE MISS — querying Hardcover for tag '#{slug}' (literary_type: #{literary_type_id.inspect})"

      # Exclude the opposite literary type to avoid fiction bleeding into nonfiction
      # and vice versa. Books with literary_type_id=nil are kept (data incomplete).
      # Using _not + _eq rather than _eq so null/unset books are still included.
      where_clause, variables = build_tag_where(slug, literary_type_id)

      query = <<~GQL
        query BooksByTag($slug: String!, $limit: Int!#{variables[:lt] ? ', $lt: Int!' : ''}) {
          books(
            where: #{where_clause}
            limit: $limit
            order_by: { users_count: desc }
          ) {
            id
            title
            slug
            rating
            users_count
            literary_type_id
            cached_image
            contributions { author { name } }
          }
        }
      GQL

      data = graphql_post(query, variables)
      books = data&.dig('books') || []
      log "  Tag '#{slug}' (lt: #{literary_type_id.inspect}) → #{books.size} books from Hardcover"
      books
    end
  end

  # Build the GraphQL where clause + variables hash for a tag query.
  # When literary_type_id is known, exclude books of the opposite type.
  def build_tag_where(slug, literary_type_id)
    base_variables = { slug: slug, limit: BOOKS_PER_TAG }

    opposite_type = case literary_type_id
                    when LITERARY_TYPE_FICTION    then LITERARY_TYPE_NONFICTION
                    when LITERARY_TYPE_NONFICTION then LITERARY_TYPE_FICTION
                    end

    if opposite_type
      where = '{ _and: [{ taggings: { tag: { slug: { _eq: $slug } } } }, { _not: { literary_type_id: { _eq: $lt } } }] }'
      variables = base_variables.merge(lt: opposite_type)
      log "  Excluding literary_type_id=#{opposite_type} from results"
    else
      where = '{ taggings: { tag: { slug: { _eq: $slug } } } }'
      variables = base_variables
    end

    [where, variables]
  end

  # ── Ranking ────────────────────────────────────────────────────────────────

  def rank_candidates(candidates, seed_hc_id)
    seed_title_normalized = @book.title.downcase.strip

    filtered = candidates.reject do |c|
      c[:hc]['id'] == seed_hc_id ||
        c[:hc]['title'].to_s.downcase.strip == seed_title_normalized
    end

    log "Filtered out seed book; #{filtered.size} candidates remain"

    filtered.sort_by { |c| [-c[:tag_count], -c[:hc]['users_count'].to_i] }
  end

  # ── Enrichment ────────────────────────────────────────────────────────────

  def enrich_results(candidates)
    candidates.filter_map { |c| enrich_one(c) }
  end

  def enrich_one(candidate)
    hc         = candidate[:hc]
    title      = hc['title'].to_s.strip
    raw_author = Array(hc['contributions']).first&.dig('author', 'name').to_s.strip
    return nil if title.blank?

    log "  Enriching '#{title}' by '#{raw_author}' (tag_count: #{candidate[:tag_count]})"

    db_book = find_in_db(title, raw_author)
    if db_book
      log "    → Found in DB as Book ##{db_book.id}"
      serialize_db_book(db_book, candidate)
    else
      log "    → Not in DB; using Hardcover metadata"
      serialize_hc_result(hc, raw_author, candidate)
    end
  end

  # Fuzzy DB lookup: exact title (case-insensitive) + author last name
  def find_in_db(title, raw_author)
    candidates = Book.includes(:author)
                     .where('LOWER(books.title) = ?', title.downcase)
                     .limit(5)

    return candidates.first if candidates.size == 1
    return nil if candidates.empty? || raw_author.blank?

    last = raw_author.split.last.to_s.downcase
    candidates.find { |b| b.author&.name.to_s.downcase.include?(last) } || candidates.first
  end

  def serialize_db_book(book, candidate)
    {
      id:              book.id,
      title:           book.title,
      author_name:     book.author&.name,
      author_id:       book.author&.id,
      cover_image_url: book.cover_image_url,
      release_date:    book.release_date,
      google_books_id: book.google_books_id,
      isbn:            book.isbn,
      description:     book.description,
      page_count:      book.page_count,
      categories:      book.categories,
      tag_count:       candidate[:tag_count],
      matched_tags:    candidate[:matched_tags],
    }
  end

  def serialize_hc_result(hc, author_name, candidate)
    {
      id:              nil,
      title:           hc['title'],
      author_name:     author_name,
      author_id:       nil,
      cover_image_url: extract_cover(hc['cached_image']),
      release_date:    nil,
      google_books_id: nil,
      isbn:            nil,
      description:     nil,
      page_count:      nil,
      categories:      candidate[:matched_tags],
      tag_count:       candidate[:tag_count],
      matched_tags:    candidate[:matched_tags],
    }
  end

  # Extract cover URL from Hardcover's cached_image JSON blob.
  def extract_cover(cached_image)
    return nil if cached_image.blank?
    cached_image['url'].presence
  end

  # ── Author helpers ────────────────────────────────────────────────────────

  def author_name
    @author_name ||= (@book.author_name.presence || @book.author&.name).to_s
  end

  def normalize_name(str)
    str.to_s.downcase.gsub(/[^a-z\s]/, '').split.sort.join(' ')
  end

  # ── GraphQL HTTP ──────────────────────────────────────────────────────────

  def graphql_post(query, variables = {})
    uri = URI(GQL_ENDPOINT)
    http              = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = TIMEOUT_OPEN
    http.read_timeout = TIMEOUT_READ

    request = Net::HTTP::Post.new(uri)
    request['Content-Type']  = 'application/json'
    request['User-Agent']    = 'WellRead/1.0 (book tracking app)'

    api_key = ENV.fetch('HARDCOVER_API_KEY', '')
    request['Authorization'] = "Bearer #{api_key}" if api_key.present?

    request.body = { query: query, variables: variables }.to_json

    log "  HTTP POST #{GQL_ENDPOINT} variables=#{variables.except(:query).inspect}"
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("[HCSimilarity] Non-200 from GraphQL: #{response.code} — #{response.body.first(200)}")
      return nil
    end

    parsed = JSON.parse(response.body)

    if parsed['errors'].present?
      Rails.logger.warn("[HCSimilarity] GraphQL errors: #{parsed['errors'].map { |e| e['message'] }.join('; ')}")
      return nil
    end

    parsed['data']
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.warn("[HCSimilarity] Timeout: #{e.message}")
    nil
  rescue JSON::ParserError => e
    Rails.logger.warn("[HCSimilarity] Bad JSON: #{e.message}")
    nil
  rescue => e
    Rails.logger.warn("[HCSimilarity] HTTP error: #{e.message}")
    nil
  end

  def log(msg)
    Rails.logger.info("[HCSimilarity] #{msg}")
  end
end
