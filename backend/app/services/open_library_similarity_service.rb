# frozen_string_literal: true

require 'net/http'
require 'json'

# OpenLibrarySimilarityService
#
# Given a Book record, returns up to 20 similar books using Open Library's
# subject graph — no AI, no proprietary API key required.
#
# Three-step flow (each step independently cached):
#
#   1. Search OL for the book → get work key + subjects        (7-day cache)
#      GET /search.json?title=<title>&author=<author>&limit=3
#
#   2. Fetch work detail for richer subjects (if work key found) (7-day cache)
#      GET /works/<key>.json
#
#   3. For each of the top subjects, fetch books tagged with it  (24-hour cache)
#      GET /search.json?subject=<subject>&limit=25&sort=rating
#
# Ranking: books are ranked by how many subjects they share with the seed.
# Ties broken by OL rating (want_to_read_count / read_count).
#
# For each result:
#   - Try to find the book in our DB by title + author fuzzy match.
#   - If found → return full DB record (has google_books_id for navigation).
#   - If not  → return a Book-shaped hash from OL metadata (id: nil).
#
# Usage:
#   results = OpenLibrarySimilarityService.new(book).call
#   # => Array of Book-shaped hashes (up to 20)
#
class OpenLibrarySimilarityService
  OL_BASE      = 'https://openlibrary.org'
  TIMEOUT_OPEN = 8
  TIMEOUT_READ = 15
  MAX_RESULTS  = 20
  MAX_SUBJECTS = 4   # top subjects to query (more = better coverage, slower)
  SEARCH_PER_SUBJECT = 25  # OL results per subject search

  # Subjects that add no useful signal — filtered before querying
  NOISE_SUBJECTS = %w[
    fiction nonfiction accessible protected large\ print overdrive
    internet\ archive open\ library american in\ english
    lending\ library accessible\ book
  ].freeze

  def initialize(book)
    @book = book
  end

  def call
    log "━━━ OpenLibrarySimilarity starting for Book ##{@book.id} '#{@book.title}' ━━━"

    unless @book.title.present?
      log "Book ##{@book.id} has no title — skipping"
      return []
    end

    # Step 1 + 2: resolve subjects for the seed book
    subjects = fetch_seed_subjects
    if subjects.blank?
      log "No usable subjects found for '#{@book.title}' — cannot find similar books"
      return []
    end

    log "Using #{subjects.size} subjects for similarity: #{subjects.inspect}"

    # Step 3: fetch books for each subject and merge
    raw_candidates = collect_candidates(subjects)
    log "Collected #{raw_candidates.size} unique candidate books across all subjects"

    if raw_candidates.empty?
      log "No candidates found — returning empty"
      return []
    end

    # Rank by subject overlap count (descending), then enrich
    ranked = rank_candidates(raw_candidates)
    log "Ranked #{ranked.size} candidates; top 3: #{ranked.first(3).map { |r| r[:title] }.inspect}"

    results = enrich_results(ranked.first(MAX_RESULTS + 10)) # fetch a few extra so we have room to filter
    log "Enriched #{results.size} results after DB lookup"
    log "━━━ OpenLibrarySimilarity complete — returning #{[results.size, MAX_RESULTS].min} books ━━━"

    results.first(MAX_RESULTS)
  rescue => e
    Rails.logger.error("[OLSimilarity] Error for Book ##{@book.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    []
  end

  private

  # ── Step 1 & 2: Resolve seed book subjects ────────────────────────────────

  def fetch_seed_subjects
    # Cache key uses the book's DB id — stable and unique
    Rails.cache.fetch("ol_seed_subjects:#{@book.id}", expires_in: 7.days) do
      log "CACHE MISS — resolving subjects for '#{@book.title}'"
      resolve_subjects_uncached
    end.tap do |subjects|
      log "Seed subjects resolved: #{subjects.inspect}"
    end
  end

  def resolve_subjects_uncached
    # 1a. Search OL for this book
    search_data = ol_get('/search.json', {
      'title'  => @book.title,
      'author' => author_name,
      'limit'  => 3,
      'fields' => 'key,title,author_name,subject,first_publish_year',
    })

    unless search_data
      log "OL search returned nil for '#{@book.title}'"
      return nil
    end

    docs = search_data['docs'] || []
    log "OL search returned #{docs.size} candidates for '#{@book.title}'"

    # Pick best match by title + author similarity
    doc = best_doc(docs)
    unless doc
      log "No suitable OL candidate found for '#{@book.title}'"
      return nil
    end

    log "Best OL match: '#{doc['title']}' by #{Array(doc['author_name']).first} (key: #{doc['key']})"

    subjects_from_search = clean_subjects(Array(doc['subject']))
    log "Subjects from search doc: #{subjects_from_search.first(8).inspect}"

    # 1b. If we have a work key, try to get richer subjects from the work record
    work_key = doc['key']
    if work_key.present?
      work_subjects = fetch_work_subjects(work_key)
      if work_subjects.present?
        # Merge: prefer work subjects (more detailed), fall back to search subjects
        merged = (work_subjects + subjects_from_search).uniq
        log "Merged subjects (work + search): #{merged.first(8).inspect}"
        return merged.first(MAX_SUBJECTS * 3) # keep extras so we can pick best
      end
    end

    subjects_from_search.presence
  end

  def fetch_work_subjects(work_key)
    # Normalize key: sometimes returned as "/works/OL123W", sometimes "OL123W"
    key = work_key.start_with?('/') ? work_key : "/#{work_key}"

    Rails.cache.fetch("ol_work:#{key}", expires_in: 7.days) do
      log "CACHE MISS — fetching work detail for #{key}"
      data = ol_get("#{key}.json")
      unless data
        log "Work detail fetch returned nil for #{key}"
        next nil
      end

      raw_subjects = data['subjects'] || []
      log "Work detail returned #{raw_subjects.size} raw subjects for #{key}"
      clean_subjects(raw_subjects)
    end
  end

  # ── Step 3: Collect candidate books per subject ───────────────────────────

  def collect_candidates(subjects)
    # Use top MAX_SUBJECTS subjects only
    top_subjects = subjects.first(MAX_SUBJECTS)
    log "Querying OL for #{top_subjects.size} subjects: #{top_subjects.inspect}"

    # Map from a stable book key → { title, author, data, subject_count }
    tally = {}

    top_subjects.each_with_index do |subject, idx|
      log "  [#{idx + 1}/#{top_subjects.size}] Fetching books for subject '#{subject}'..."
      books = fetch_books_for_subject(subject)
      log "  [#{idx + 1}/#{top_subjects.size}] Got #{books.size} books for '#{subject}'"

      books.each do |b|
        key = candidate_key(b)
        next if key.blank?

        if tally[key]
          tally[key][:subject_count] += 1
          log "    → '#{b['title']}' seen again (now matches #{tally[key][:subject_count]} subjects)"
        else
          tally[key] = {
            title:         b['title'],
            author_name:   Array(b['author_name']).first,
            ol_key:        b['key'],
            cover_i:       b['cover_i'],
            first_publish: b['first_publish_year'],
            isbn:          Array(b['isbn']).first,
            subject_count: 1,
            raw:           b,
          }
        end
      end
    end

    tally.values
  end

  def fetch_books_for_subject(subject)
    cache_key = "ol_subject:#{subject.downcase.gsub(/\s+/, '_')}"

    Rails.cache.fetch(cache_key, expires_in: 24.hours) do
      log "  CACHE MISS — querying OL for subject '#{subject}'"
      data = ol_get('/search.json', {
        'subject' => subject,
        'limit'   => SEARCH_PER_SUBJECT,
        'sort'    => 'rating',
        'fields'  => 'key,title,author_name,cover_i,first_publish_year,isbn,subject',
      })
      docs = data&.dig('docs') || []
      log "  OL subject search for '#{subject}' returned #{docs.size} docs"
      docs
    end
  end

  # ── Ranking ───────────────────────────────────────────────────────────────

  def rank_candidates(candidates)
    # Filter out the seed book itself
    seed_title_normalized = @book.title.downcase.strip

    filtered = candidates.reject do |c|
      c[:title].to_s.downcase.strip == seed_title_normalized
    end

    log "After filtering seed book: #{filtered.size} candidates remain"

    filtered.sort_by { |c| [-c[:subject_count], c[:title].to_s] }
  end

  # ── Enrichment ────────────────────────────────────────────────────────────

  def enrich_results(candidates)
    candidates.filter_map { |c| enrich_one(c) }
  end

  def enrich_one(candidate)
    title      = candidate[:title].to_s.strip
    raw_author = candidate[:author_name].to_s.strip
    return nil if title.blank?

    log "  Enriching '#{title}' by '#{raw_author}' (matches #{candidate[:subject_count]} subjects)"

    # Try DB lookup first — gives us google_books_id for full navigation
    db_book = find_in_db(title, raw_author)
    if db_book
      log "    → Found in DB: Book ##{db_book.id}"
      return serialize_db_book(db_book, candidate[:subject_count])
    end

    log "    → Not in DB; using OL metadata"
    serialize_ol_result(candidate)
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

  def serialize_db_book(book, subject_count)
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
      subject_count:   subject_count,
    }
  end

  def serialize_ol_result(candidate)
    raw = candidate[:raw] || {}

    cover = candidate[:cover_i].present? ?
      "https://covers.openlibrary.org/b/id/#{candidate[:cover_i]}-M.jpg" : nil

    release = candidate[:first_publish] ? "#{candidate[:first_publish]}-01-01" : nil

    {
      id:              nil,
      title:           candidate[:title],
      author_name:     candidate[:author_name],
      author_id:       nil,
      cover_image_url: cover,
      release_date:    release,
      google_books_id: nil,
      isbn:            candidate[:isbn],
      description:     nil,
      page_count:      nil,
      categories:      Array(raw['subject']).first(5),
      subject_count:   candidate[:subject_count],
    }
  end

  # ── Subject cleaning ──────────────────────────────────────────────────────

  def clean_subjects(subjects)
    cleaned = subjects
      .map    { |s| s.to_s.gsub(/\s*--\s*.+$/, '').strip }  # "Mars -- Fiction" → "Mars"
      .map    { |s| s.gsub(/\s*\(.+\)$/, '').strip }          # "Weir, Andy (Fictitious)" → strip paren
      .map    { |s| s.gsub(/^fiction\s*,\s*/i, '').strip }    # "Fiction, Science fiction" → clean
      .reject { |s| s.length < 4 }
      .reject { |s| NOISE_SUBJECTS.any? { |noise| s.downcase.include?(noise) } }
      .reject { |s| s =~ /^\d+/ }                              # skip pure numeric subjects
      .map    { |s| s.split.map(&:capitalize).join(' ') }      # normalize capitalization
      .uniq
      .first(30)

    cleaned
  end

  # ── Author helpers ────────────────────────────────────────────────────────

  def author_name
    @author_name ||= (@book.author_name.presence || @book.author&.name).to_s
  end

  # ── OL search candidate matching ─────────────────────────────────────────

  def best_doc(docs)
    return nil if docs.empty?

    our_title  = @book.title.downcase
    our_author = normalize_name(author_name)

    # First: exact title match + author match
    docs.find do |d|
      title_match  = d['title'].to_s.downcase.include?(our_title) || our_title.include?(d['title'].to_s.downcase)
      author_match = our_author.blank? || Array(d['author_name']).any? { |a| normalize_name(a).include?(our_author) || our_author.include?(normalize_name(a)) }
      title_match && author_match
    end ||
    # Fallback: just title match
    docs.find { |d| d['title'].to_s.downcase.include?(our_title) } ||
    docs.first
  end

  def normalize_name(str)
    str.to_s.downcase.gsub(/[^a-z\s]/, '').split.sort.join(' ')
  end

  # ── Candidate de-duplication key ─────────────────────────────────────────

  def candidate_key(book_doc)
    # Use OL work key if available (most stable), else normalize title+author
    key = book_doc['key'].presence
    key ||= "#{book_doc['title'].to_s.downcase.strip}|#{Array(book_doc['author_name']).first.to_s.downcase.strip}"
    key
  end

  # ── HTTP ──────────────────────────────────────────────────────────────────

  def ol_get(path, params = {})
    uri = URI("#{OL_BASE}#{path}")
    uri.query = URI.encode_www_form(params) if params.any?

    http              = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = TIMEOUT_OPEN
    http.read_timeout = TIMEOUT_READ

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'Libraio/1.0 (book tracking app)'

    log "  HTTP GET #{uri}"
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("[OLSimilarity] Non-200 from #{path}: #{response.code}")
      return nil
    end

    JSON.parse(response.body)
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.warn("[OLSimilarity] Timeout on #{path}: #{e.message}")
    nil
  rescue JSON::ParserError => e
    Rails.logger.warn("[OLSimilarity] Bad JSON from #{path}: #{e.message}")
    nil
  rescue => e
    Rails.logger.warn("[OLSimilarity] HTTP error on #{path}: #{e.message}")
    nil
  end

  def log(msg)
    Rails.logger.info("[OLSimilarity] #{msg}")
  end
end
