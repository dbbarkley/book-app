# db/seeds/bisac_categories.rb
#
# Top-level BISAC genre categories. TRD000000 (Trending Now) is kept but inactive —
# the Serper.dev data source was removed; re-enable only if a reliable trend source is added.
# Safe to re-run — uses upsert keyed on `code`.
#
# Sources verified against https://hardcover.app/browse/tags/genre/ on 2026-05-01.
# Slugs with UUIDs (e.g. self-help-e026dece-...) must use the full string.
#
# NON000000 keeps NYT — bestseller curation is the value for broad nonfiction.
# Everything else uses Hardcover genre tags for genre-pure, large-pool results.

categories = [
  {
    code:              'TRD000000',
    name:              'Trending Now',
    parent_code:       nil,
    color:             '#F59E0B',
    query_terms:       ['trending'],
    data_source:       'serp',
    # No source_identifier needed — driven by SERP_QUERIES in BisacPopulatorJob.
    source_identifier: nil,
    stale_hours:       48,
    display_order:     0,
    active:            false, # disabled — no reliable trend data source
  },
  {
    code:              'FIC000000',
    name:              'Fiction',
    parent_code:       nil,
    color:             '#4F46E5',
    query_terms:       ['fiction'],
    data_source:       'nyt+hardcover',
    # NYT list provides the current bestsellers (ranked 1-15).
    # Hardcover supplement is derived automatically from active subcategory slugs.
    source_identifier: 'combined-print-and-e-book-fiction',
    stale_hours:       168,
    display_order:     1,
    active:            true,
  },
  {
    code:              'NON000000',
    name:              'Non-Fiction',
    parent_code:       nil,
    color:             '#0891B2',
    query_terms:       ['nonfiction'],
    data_source:       'nyt+hardcover',
    # NYT list provides the current bestsellers (ranked 1-15).
    # Hardcover supplement is derived automatically from active subcategory slugs.
    source_identifier: 'combined-print-and-e-book-nonfiction',
    stale_hours:       168,
    display_order:     2,
    active:            true,
  },
  {
    code:              'FIC022000',
    name:              'Mystery & Thriller',
    parent_code:       nil,
    color:             '#1E293B',
    query_terms:       ['mystery', 'thriller'],
    data_source:       'hardcover',
    source_identifier: 'mystery',            # 23,366 books
    stale_hours:       168,
    display_order:     3,
    active:            true,
  },
  {
    code:              'FIC027000',
    name:              'Romance',
    parent_code:       nil,
    color:             '#DB2777',
    query_terms:       ['romance'],
    data_source:       'hardcover',
    source_identifier: 'romance',            # 44,043 books
    stale_hours:       168,
    display_order:     4,
    active:            true,
  },
  {
    code:              'FIC009000',
    name:              'Fantasy',
    parent_code:       nil,
    color:             '#7C3AED',
    query_terms:       ['fantasy'],
    data_source:       'hardcover',
    source_identifier: 'fantasy',            # 220,959 books
    stale_hours:       168,
    display_order:     5,
    active:            true,
  },
  {
    code:              'FIC028000',
    name:              'Science Fiction',
    parent_code:       nil,
    color:             '#0284C7',
    query_terms:       ['science fiction'],
    data_source:       'hardcover',
    source_identifier: 'science-fiction',    # 100,770 books
    stale_hours:       168,
    display_order:     6,
    active:            true,
  },
  {
    code:              'FIC014000',
    name:              'Historical Fiction',
    parent_code:       nil,
    color:             '#92400E',
    query_terms:       ['historical fiction'],
    data_source:       'hardcover',
    source_identifier: 'historical-fiction', # 3,159 books
    stale_hours:       168,
    display_order:     7,
    active:            true,
  },
  {
    code:              'FIC015000',
    name:              'Horror',
    parent_code:       nil,
    color:             '#991B1B',
    query_terms:       ['horror'],
    data_source:       'hardcover',
    source_identifier: 'horror',             # 1,943 books
    stale_hours:       168,
    display_order:     8,
    active:            true,
  },
  {
    code:              'BIO000000',
    name:              'Biography & Memoir',
    parent_code:       nil,
    color:             '#065F46',
    query_terms:       ['biography', 'memoir'],
    data_source:       'hardcover',
    source_identifier: 'biography',          # 24,530 books
    stale_hours:       168,
    display_order:     9,
    active:            true,
  },
  {
    code:              'SEL000000',
    name:              'Self-Help',
    parent_code:       nil,
    color:             '#D97706',
    query_terms:       ['self-help'],
    data_source:       'hardcover',
    # UUID suffix required — two "self-help" tags exist; this is the larger one
    source_identifier: 'self-help-e026dece-d926-4e01-9480-a316b3be0396',  # 4,146 books
    stale_hours:       168,
    display_order:     10,
    active:            true,
  },
  {
    code:              'TRU000000',
    name:              'True Crime',
    parent_code:       nil,
    color:             '#374151',
    query_terms:       ['true crime'],
    data_source:       'hardcover',
    # UUID suffix required
    source_identifier: 'true-crime-b6c0544a-6d81-4bc0-8c7a-21ba7ca77548',  # 1,369 books
    stale_hours:       168,
    display_order:     11,
    active:            true,
  },
  {
    code:              'YAF000000',
    name:              'Young Adult',
    parent_code:       nil,
    color:             '#059669',
    query_terms:       ['young adult'],
    data_source:       'hardcover',
    source_identifier: 'young-adult',        # 148,443 books
    stale_hours:       168,
    display_order:     12,
    active:            true,
  },
  {
    code:              'BUS000000',
    name:              'Business',
    parent_code:       nil,
    color:             '#1D4ED8',
    query_terms:       ['business'],
    data_source:       'hardcover',
    source_identifier: 'business-economics', # 13,610 books
    stale_hours:       168,
    display_order:     13,
    active:            true,
  },
  {
    code:              'CGN000000',
    name:              'Graphic Novels',
    parent_code:       nil,
    color:             '#B45309',
    query_terms:       ['graphic novels', 'comics'],
    data_source:       'hardcover',
    source_identifier: 'comics-graphic-novels', # 29,286 books
    stale_hours:       168,
    display_order:     14,
    active:            true,
  },
  {
    code:              'POE000000',
    name:              'Poetry',
    parent_code:       nil,
    color:             '#4A7A5C',
    query_terms:       ['poetry'],
    data_source:       'hardcover',
    source_identifier: 'poetry',                 # Hardcover genre tag
    stale_hours:       168,
    display_order:     15,
    active:            true,
  },
]

now = Time.current

categories.each do |attrs|
  BisacCategory.upsert(
    attrs.merge(created_at: now, updated_at: now),
    unique_by: :code,
    update_only: %i[
      name parent_code color query_terms data_source source_identifier
      stale_hours display_order active
    ]
  )
end

puts "Seeded #{categories.size} BISAC categories."
