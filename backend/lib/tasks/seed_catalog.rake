namespace :catalog do
  desc "Seed book_catalog from curated_shelf_books (idempotent upsert)"
  task seed_from_curated: :environment do
    total   = CuratedShelfBook.count
    batched = 0

    CuratedShelfBook.find_in_batches(batch_size: 500) do |batch|
      # Deduplicate within the batch — curated_shelf_books can contain the same
      # google_books_id multiple times; upsert_all would raise a cardinality
      # violation if the same conflict key appears twice in one statement.
      seen = {}
      batch.each do |csb|
        seen[csb.google_books_id] ||= csb
      end

      books = seen.values.map do |csb|
        {
          google_books_id: csb.google_books_id,
          title:           csb.title,
          author_name:     csb.author_name,
          cover_image_url: csb.cover_image_url,
          description:     csb.description,
          published_date:  csb.published_date,
          page_count:      csb.page_count,
          average_rating:  csb.average_rating,
          ratings_count:   csb.ratings_count,
          categories:      [],
          source:          'curated',
        }
      end

      BookCatalog.upsert_many(books, source: 'curated')
      batched += batch.size
      puts "  Seeded #{batched}/#{total}..."
    end

    puts "Done. book_catalog now has #{BookCatalog.count} records."
  end
end
