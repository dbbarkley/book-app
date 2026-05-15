namespace :bisac do
  desc <<~DESC
    Populate all stale BISAC category shelves via BisacPopulatorJob.

    Runs the job inline (not via the queue) so it's safe to call from
    Heroku Scheduler, cron, or any one-off dyno.

    Usage:
      rake bisac:populate                    # populate all stale categories
      rake bisac:populate CODE=FIC027000     # populate one specific category
      rake bisac:populate FORCE=true         # force even if not stale

    Scheduling (Heroku Scheduler):
      Command : rake bisac:populate
      Frequency: Every day (job self-throttles via stale_hours per category)

    Starting schedule:
      - All categories default to stale_hours: 168 (weekly)
      - Bump stale_hours to 24 on a per-category basis when you want daily
  DESC
  task populate: :environment do
    code  = ENV['CODE'].presence
    force = ENV['FORCE'].to_s.downcase == 'true'

    if code
      puts "[bisac:populate] Populating category #{code} (force=#{force})"
    else
      stale_count = BisacCategory.active.count { |c| force || c.stale? }
      puts "[bisac:populate] Found #{stale_count} stale / eligible categories"
    end

    # Run inline so Heroku Scheduler doesn't need a worker dyno
    BisacPopulatorJob.new.perform(code: code, force: force)

    puts '[bisac:populate] Done.'
  end

  desc 'Show all active categories and their staleness status'
  task status: :environment do
    categories = BisacCategory.active.ordered

    if categories.empty?
      puts 'No active BISAC categories found.'
      puts "Add one: BisacCategory.create!(code: 'FIC027000', name: 'Romance', query_terms: ['romance'], color: '#D64C8B', display_order: 1)"
      next
    end

    puts "\n%-12s %-35s %-12s %-8s %-22s %s" % [
      'CODE', 'NAME', 'SOURCE', 'BOOKS', 'LAST POPULATED', 'STALE?'
    ]
    puts '-' * 100

    categories.each do |c|
      book_count   = c.curated_shelf_books.count
      last_pop     = c.last_populated_at ? c.last_populated_at.strftime('%Y-%m-%d %H:%M') : 'never'
      stale        = c.stale? ? '⚠ YES' : 'no'

      puts "%-12s %-35s %-12s %-8s %-22s %s" % [
        c.code, c.name.truncate(34), c.data_source, book_count, last_pop, stale
      ]
    end

    puts "\nTotal: #{categories.size} categories, #{BisacCategory.active.count(&:stale?)} stale\n\n"
  end

  desc 'Force repopulate a single category (CODE=FIC027000 required)'
  task repopulate: :environment do
    code = ENV['CODE'].presence
    abort 'Usage: rake bisac:repopulate CODE=FIC027000' unless code

    puts "[bisac:repopulate] Force-populating #{code}..."
    BisacPopulatorJob.new.perform(code: code, force: true)
    puts '[bisac:repopulate] Done.'
  end

  desc 'Seed the bisac_categories table with the 14 top-level genres (idempotent)'
  task seed: :environment do
    load Rails.root.join('db/seeds/bisac_categories.rb')
  end

  desc 'Seed the bisac_categories table with all trending subcategories (idempotent)'
  task seed_subcategories: :environment do
    load Rails.root.join('db/seeds/bisac_subcategories.rb')
  end

  desc 'Seed both top-level genres and subcategories (idempotent)'
  task seed_all: [:seed, :seed_subcategories]

  desc <<~DESC
    Probe each Hardcover-sourced category slug and report how many books it returns.
    Does NOT write anything to the database — read-only diagnostic.

    Usage:
      rake bisac:verify               # checks all hardcover categories in the seed files
      rake bisac:verify SLUG=romantasy  # checks a single slug ad-hoc
  DESC
  task verify: :environment do
    require 'net/http'
    require 'json'

    api_key = ENV['HARDCOVER_API_KEY']
    abort 'HARDCOVER_API_KEY not set' if api_key.blank?

    single_slug = ENV['SLUG'].presence

    # Load slugs from seed files (no DB needed — just parse the Ruby arrays)
    if single_slug
      slugs_to_check = [{ name: single_slug, slug: single_slug, code: 'ad-hoc' }]
    else
      # All hardcover-sourced slugs — keep in sync with seed files
      top_level = [
        { code: 'FIC000000', name: 'Fiction',            slug: 'fiction' },
        { code: 'FIC022000', name: 'Mystery & Thriller', slug: 'mystery' },
        { code: 'FIC027000', name: 'Romance',            slug: 'romance' },
        { code: 'FIC009000', name: 'Fantasy',            slug: 'fantasy' },
        { code: 'FIC028000', name: 'Science Fiction',    slug: 'science-fiction' },
        { code: 'FIC014000', name: 'Historical Fiction', slug: 'historical-fiction' },
        { code: 'FIC015000', name: 'Horror',             slug: 'horror' },
        { code: 'BIO000000', name: 'Biography & Memoir', slug: 'biography' },
        { code: 'SEL000000', name: 'Self-Help',          slug: 'self-help-e026dece-d926-4e01-9480-a316b3be0396' },
        { code: 'TRU000000', name: 'True Crime',         slug: 'true-crime-b6c0544a-6d81-4bc0-8c7a-21ba7ca77548' },
        { code: 'YAF000000', name: 'Young Adult',        slug: 'young-adult' },
        { code: 'BUS000000', name: 'Business',           slug: 'business-economics' },
        { code: 'CGN000000', name: 'Graphic Novels',     slug: 'comics-graphic-novels' },
      ]

      subcategories = [
        { code: 'FIC019000', name: 'Literary Fiction',        slug: 'literary-fiction' },
        { code: 'FIC005000', name: 'Contemporary Fiction',    slug: 'contemporary-5aa3bf50-fe7e-496f-835d-8659c4fe219b' },
        { code: 'FIC041000', name: 'Magical Realism',         slug: 'magical-realism' },
        { code: 'FIC030000', name: 'Short Stories',           slug: 'short-stories' },
        { code: 'HIS000000', name: 'History',                 slug: 'history' },
        { code: 'SCI000000', name: 'Science',                 slug: 'science' },
        { code: 'POL000000', name: 'Politics & Society',      slug: 'politics' },
        { code: 'PHI000000', name: 'Philosophy',              slug: 'philosophy' },
        { code: 'PSY000000', name: 'Psychology',              slug: 'psychology' },
        { code: 'FIC031000', name: 'Suspense',                slug: 'suspense' },
        { code: 'FIC025000', name: 'Psychological Thriller',  slug: 'psychological-thriller' },
        { code: 'FIC022010', name: 'Cozy Mystery',            slug: 'cozy-mystery' },
        { code: 'FIC022060', name: 'Crime',                   slug: 'crime' },
        { code: 'FIC031010', name: 'Murder',                  slug: 'murder' },
        { code: 'FIC031020', name: 'Espionage',               slug: 'espionage-2ffba117-a542-4160-a7b8-200d73ca14da' },
        { code: 'FIC027070', name: 'Romantasy',               slug: 'romantasy' },
        { code: 'FIC027010', name: 'Contemporary Romance',    slug: 'contemporary-romance' },
        { code: 'FIC027100', name: 'Dark Romance',            slug: 'dark-romance' },
        { code: 'FIC027050', name: 'Historical Romance',      slug: 'historical-romance' },
        { code: 'FIC027080', name: 'Paranormal Romance',      slug: 'paranormal-romance' },
        { code: 'FIC027090', name: 'Romantic Comedy',         slug: 'romantic-comedy' },
        { code: 'FIC027110', name: 'Sports Romance',          slug: 'sports-romance' },
        { code: 'FIC027120', name: 'Monster Romance',         slug: 'monster-romance' },
        { code: 'FIC009100', name: 'Epic Fantasy',            slug: 'epic-fantasy' },
        { code: 'FIC009050', name: 'Romantasy (Fantasy)',     slug: 'romantasy' },
        { code: 'FIC009010', name: 'Urban Fantasy',           slug: 'urban-fantasy' },
        { code: 'FIC009060', name: 'Paranormal',              slug: 'paranormal' },
        { code: 'FIC011000', name: 'Fairy Tales & Mythology', slug: 'fairy-tales' },
        { code: 'FIC009040', name: 'Dark Academia',           slug: 'dark-academia' },
        { code: 'FIC009070', name: 'Dark Fantasy',            slug: 'dark-fantasy' },
        { code: 'FIC009020', name: 'Cozy Fantasy',            slug: 'cozy-fantasy' },
        { code: 'FIC028060', name: 'Dystopian',               slug: 'dystopian' },
        { code: 'FIC028040', name: 'Aliens',                  slug: 'aliens' },
        { code: 'FIC028050', name: 'Space',                   slug: 'space' },
        { code: 'FIC028030', name: 'Space Opera',             slug: 'space-opera' },
        { code: 'FIC028020', name: 'Cyberpunk',               slug: 'cyberpunk' },
        { code: 'FIC032000', name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
        { code: 'FIC028090', name: 'Time Travel',             slug: 'time-travel-8fa5a0da-559a-4c88-9c07-55f3168399db' },
        { code: 'FIC014010', name: 'WWII Fiction',            slug: 'world-war-ii' },
        { code: 'FIC014020', name: 'Regency',                 slug: 'regency' },
        { code: 'FIC014040', name: 'Medieval',                slug: 'medieval' },
        { code: 'FIC014030', name: 'Ancient World',           slug: 'ancient-history' },
        { code: 'FIC014050', name: 'Victorian',               slug: 'victorian' },
        { code: 'FIC014060', name: 'War',                     slug: 'war' },
        { code: 'FIC066000', name: 'Gothic',                  slug: 'gothic' },
        { code: 'FIC024000', name: 'Occult & Supernatural',   slug: 'occult-aa0cfa69-77bc-4cce-9536-c8c1264b2811' },
        { code: 'FIC015020', name: 'Psychological Horror',    slug: 'psychological-horror' },
        { code: 'FIC015030', name: 'Cosmic Horror',           slug: 'cosmic-horror' },
        { code: 'FIC015040', name: 'Ghost Stories',           slug: 'ghost-stories' },
        { code: 'BIO026000', name: 'Memoir',                  slug: 'memoir' },
        { code: 'BIO001000', name: 'Autobiography',           slug: 'autobiography' },
        { code: 'BIO018000', name: 'Sports Biography',        slug: 'sports-recreation' },
        { code: 'BIO005000', name: 'Music & Arts',            slug: 'music' },
        { code: 'PSY001000', name: 'Psychology (Self-Help)',  slug: 'psychology' },
        { code: 'SEL010000', name: 'Mental Health',           slug: 'mental-health' },
        { code: 'SEL017000', name: 'Productivity',            slug: 'productivity' },
        { code: 'SEL028000', name: 'Mind & Spirit',           slug: 'mind-spirit' },
        { code: 'SEL032000', name: 'Health & Fitness',        slug: 'health-fitness' },
        { code: 'SEL023000', name: 'Family & Relationships',  slug: 'family-relationships' },
        { code: 'TRU000020', name: 'Murder',                  slug: 'murder' },
        { code: 'TRU000030', name: 'Crime (TC)',              slug: 'crime' },
        { code: 'TRU000010', name: 'Cults',                   slug: 'cults' },
        { code: 'TRU000040', name: 'Serial Killers',          slug: 'serial-killers' },
        { code: 'YAF019000', name: 'YA Fantasy',              slug: 'young-adult-fantasy' },
        { code: 'YAF001000', name: 'YA Fiction',              slug: 'young-adult-fiction' },
        { code: 'YAF002000', name: 'Coming of Age',           slug: 'coming-of-age-7a8c5a5e-b98b-4589-bc26-4be18a640ecd' },
        { code: 'YAF003000', name: 'Middle Grade',            slug: 'middle-grade' },
        { code: 'YAF052000', name: 'YA Romance',              slug: 'young-adult-romance' },
        { code: 'BUS025000', name: 'Entrepreneurship',        slug: 'entrepreneurship' },
        { code: 'BUS071000', name: 'Leadership',              slug: 'leadership' },
        { code: 'BUS050000', name: 'Finance',                 slug: 'finance' },
        { code: 'BUS023000', name: 'Economics',               slug: 'economics' },
        { code: 'BUS060000', name: 'Programming',             slug: 'programming' },
        { code: 'CGN004050', name: 'Manga',                   slug: 'manga' },
        { code: 'CGN004010', name: 'Comics',                  slug: 'comics' },
        { code: 'CGN004070', name: 'Graphic Memoir',          slug: 'graphic-memoir' },
        { code: 'CGN004020', name: "Boy's Love",              slug: 'boys-love-b8a8ac9b-f5e2-4655-acc9-d7963ea4f217' },
      ]

      slugs_to_check = top_level + subcategories
    end

    query = <<~GRAPHQL
      query ProbeTag($tag: String!, $minRatings: Int!) {
        books_aggregate(
          where: {
            taggings: { tag: { slug: { _eq: $tag } } }
            ratings_count: { _gte: $minRatings }
          }
        ) {
          aggregate { count }
        }
      }
    GRAPHQL

    uri  = URI('https://api.hardcover.app/v1/graphql')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 20

    min_ratings = 10
    results = []

    slugs_to_check.each do |entry|
      payload = {
        query:     query,
        variables: { tag: entry[:slug], minRatings: min_ratings },
      }.to_json

      req = Net::HTTP::Post.new(uri.request_uri)
      req['Content-Type']  = 'application/json'
      req['Authorization'] = "Bearer #{api_key}"
      req.body = payload

      begin
        resp = http.request(req)
        data = JSON.parse(resp.body)
        count = data.dig('data', 'books_aggregate', 'aggregate', 'count').to_i
        results << { count: count, **entry }
      rescue => e
        results << { count: -1, error: e.message, **entry }
      end

      sleep 0.3  # be gentle with the API
    end

    # Print results sorted by count descending
    puts "\n#{'─' * 80}"
    puts "%-14s %-28s %-28s %s" % ['CODE', 'NAME', 'SLUG', 'BOOKS (≥#{min_ratings} ratings)']
    puts "#{'─' * 80}"

    results.sort_by { |r| -r[:count] }.each do |r|
      flag = if r[:count] == -1  then '  ✗ ERROR'
             elsif r[:count] == 0 then '  ⚠ SLUG NOT FOUND'
             elsif r[:count] < 20  then '  ⚠ THIN (<20)'
             elsif r[:count] < 40  then '  ~ OK (20–39)'
             else                       ''
             end

      puts "%-14s %-28s %-28s %d%s" % [
        r[:code], r[:name].truncate(27), r[:slug].truncate(27), r[:count], flag
      ]
    end

    puts "#{'─' * 80}"

    not_found = results.count { |r| r[:count] == 0 }
    thin       = results.count { |r| r[:count] > 0 && r[:count] < 20 }
    good       = results.count { |r| r[:count] >= 40 }

    puts "\nSummary: #{good} good (≥40), #{thin} thin (1–39), #{not_found} not found (slug invalid)\n\n"

    if not_found > 0 || thin > 0
      puts "Tip: for slugs that returned 0, try rake bisac:list_tags TERM=<keyword>"
      puts "     to search Hardcover's actual tag list for the right slug.\n\n"
    end
  end

  desc <<~DESC
    Probe a slug directly against the Hardcover books_aggregate to confirm it works.
    More reliable than searching the tags table (which contains user-created mood/trope
    tags, not the curated genre tags used by /browse/tags/genre/).

    Usage: rake bisac:probe SLUG=romantasy
           rake bisac:probe SLUG=dark-romance MIN=5
  DESC
  task probe: :environment do
    require 'net/http'
    require 'json'

    api_key = ENV['HARDCOVER_API_KEY']
    abort 'HARDCOVER_API_KEY not set' if api_key.blank?

    slug = ENV['SLUG'].presence
    abort 'Usage: rake bisac:probe SLUG=<slug> [MIN=5]' unless slug

    min_ratings = (ENV['MIN'] || '10').to_i

    query = <<~GRAPHQL
      query ProbeTag($tag: String!, $minRatings: Int!) {
        books_aggregate(
          where: {
            taggings: { tag: { slug: { _eq: $tag } } }
            ratings_count: { _gte: $minRatings }
          }
        ) {
          aggregate { count }
        }
      }
    GRAPHQL

    uri  = URI('https://api.hardcover.app/v1/graphql')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 10
    http.read_timeout = 15

    req = Net::HTTP::Post.new(uri.request_uri)
    req['Content-Type']  = 'application/json'
    req['Authorization'] = "Bearer #{api_key}"
    req.body = { query: query, variables: { tag: slug, minRatings: min_ratings } }.to_json

    resp = http.request(req)
    data = JSON.parse(resp.body)

    if data['errors'].present?
      abort "GraphQL error: #{data['errors'].map { |e| e['message'] }.join(', ')}"
    end

    count = data.dig('data', 'books_aggregate', 'aggregate', 'count').to_i
    status = if count == 0     then '⚠ SLUG NOT FOUND (0 books)'
             elsif count < 20  then "⚠ THIN — #{count} books with ≥#{min_ratings} ratings"
             else                    "✓ #{count} books with ≥#{min_ratings} ratings"
             end

    puts "\nSlug: #{slug}"
    puts "Result: #{status}"
    puts "\nTip: if count is low, try again with MIN=5 to lower the ratings threshold.\n\n"
  end

  desc <<~DESC
    Fetch one sample book from a Hardcover genre slug and print every field
    that could contain page count. Useful for confirming the correct field name.

    Usage: rake bisac:probe_fields SLUG=romance
  DESC
  task probe_fields: :environment do
    require 'net/http'
    require 'json'

    api_key = ENV['HARDCOVER_API_KEY']
    abort 'HARDCOVER_API_KEY not set' if api_key.blank?

    slug = ENV['SLUG'].presence || 'romance'

    # Request every candidate page-count field name in one shot.
    # Hardcover may use pages_count, pages, or page_count at the book level.
    query = <<~GRAPHQL
      query ProbeSample($tag: String!) {
        books(
          where: {
            taggings: { tag: { slug: { _eq: $tag } } }
            ratings_count: { _gte: 50 }
          }
          order_by: { users_read_count: desc }
          limit: 3
        ) {
          id
          title
          pages_count
          default_physical_edition { pages }
        }
      }
    GRAPHQL

    uri  = URI('https://api.hardcover.app/v1/graphql')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 20

    req = Net::HTTP::Post.new(uri.request_uri)
    req['Content-Type']  = 'application/json'
    req['Authorization'] = "Bearer #{api_key}"
    req.body             = { query: query, variables: { tag: slug } }.to_json

    resp = http.request(req)
    data = JSON.parse(resp.body)

    if data['errors'].present?
      puts "\nGraphQL errors (likely a bad field name):"
      data['errors'].each { |e| puts "  - #{e['message']}" }
    else
      books = data.dig('data', 'books') || []
      puts "\nSample books for slug '#{slug}':\n\n"
      books.each do |b|
        puts "  #{b['id']}: #{b['title']}"
        puts "    pages_count                    => #{b['pages_count'].inspect}"
        puts "    default_physical_edition.pages => #{b.dig('default_physical_edition', 'pages').inspect}"
        puts
      end
    end
  end
end
