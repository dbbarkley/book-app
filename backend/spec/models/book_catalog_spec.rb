require 'rails_helper'

RSpec.describe BookCatalog, type: :model do
  describe 'validations' do
    it 'requires google_books_id' do
      expect(described_class.new(title: 'Dune')).not_to be_valid
    end

    it 'requires title' do
      expect(described_class.new(google_books_id: 'abc123')).not_to be_valid
    end
  end

  describe '.search' do
    before do
      described_class.upsert_book({
        google_books_id: 'gb_dune',
        title: 'Dune',
        author_name: 'Frank Herbert',
        cover_image_url: 'https://example.com/dune.jpg',
        source: 'google_books',
      })
      described_class.upsert_book({
        google_books_id: 'gb_foundation',
        title: 'Foundation',
        author_name: 'Isaac Asimov',
        cover_image_url: 'https://example.com/foundation.jpg',
        source: 'google_books',
      })
    end

    it 'returns books matching title' do
      results = described_class.search('Dune')
      expect(results.map(&:google_books_id)).to include('gb_dune')
    end

    it 'returns books matching author name' do
      results = described_class.search('Herbert')
      expect(results.map(&:google_books_id)).to include('gb_dune')
    end

    it 'excludes non-matching books' do
      results = described_class.search('Dune')
      expect(results.map(&:google_books_id)).not_to include('gb_foundation')
    end

    it 'returns empty for blank query' do
      expect(described_class.search('')).to be_empty
    end

    it 'finds books by short prefix query (ILIKE path)' do
      # 'Du' is < 3 chars, triggers prefix_search
      results = described_class.search('Du')
      expect(results.map(&:google_books_id)).to include('gb_dune')
    end
  end

  describe '.upsert_book' do
    it 'creates a new record' do
      expect {
        described_class.upsert_book({
          google_books_id: 'new_id',
          title: 'New Book',
          author_name: 'Author',
          source: 'google_books',
        })
      }.to change(described_class, :count).by(1)
    end

    it 'updates existing record on conflict' do
      described_class.upsert_book({ google_books_id: 'same_id', title: 'Old Title', source: 'google_books' })
      described_class.upsert_book({ google_books_id: 'same_id', title: 'New Title', source: 'google_books' })
      expect(described_class.find_by(google_books_id: 'same_id').title).to eq('New Title')
      expect(described_class.count).to eq(1)
    end

    it 'skips records with blank google_books_id' do
      expect {
        described_class.upsert_book({ google_books_id: '', title: 'Skipped', source: 'google_books' })
      }.not_to change(described_class, :count)
    end
  end

  describe '.upsert_many' do
    it 'inserts multiple books in one call' do
      expect {
        described_class.upsert_many([
          { google_books_id: 'batch_1', title: 'Book One' },
          { google_books_id: 'batch_2', title: 'Book Two' },
        ], source: 'test')
      }.to change(described_class, :count).by(2)
    end

    it 'skips entries with blank google_books_id' do
      expect {
        described_class.upsert_many([
          { google_books_id: '', title: 'Skipped' },
          { google_books_id: 'valid_id', title: 'Kept' },
        ], source: 'test')
      }.to change(described_class, :count).by(1)
    end

    it 'applies the source keyword to all rows' do
      described_class.upsert_many([
        { google_books_id: 'src_test', title: 'Source Test' },
      ], source: 'my_source')
      expect(described_class.find_by(google_books_id: 'src_test').source).to eq('my_source')
    end

    it 'returns early for blank array' do
      expect {
        described_class.upsert_many([], source: 'test')
      }.not_to change(described_class, :count)
    end
  end

  describe '#to_api_hash' do
    it 'returns expected keys with id: nil' do
      book = described_class.new(
        google_books_id: 'test_id',
        title: 'Test Book',
        author_name: 'Test Author',
        cover_image_url: 'https://example.com/cover.jpg',
        published_date: '2020-01-01',
        page_count: 300,
        average_rating: 4.5,
        ratings_count: 1000,
        categories: ['Fiction'],
        cached_at: Time.current,
      )
      hash = book.to_api_hash
      expect(hash[:id]).to be_nil
      expect(hash[:google_books_id]).to eq('test_id')
      expect(hash[:title]).to eq('Test Book')
      expect(hash[:author_name]).to eq('Test Author')
      expect(hash[:cover_image_url]).to eq('https://example.com/cover.jpg')
      expect(hash[:release_date]).to eq('2020-01-01')
    end
  end

  describe '.upsert_author_works' do
    let(:works) do
      [
        { key: 'gb_abc123', title: 'Iron Flame', year: 2023,
          cover_url: 'https://example.com/cover.jpg',
          ratings_average: 4.5, ratings_count: 1000,
          language: 'en', isbn: '9781649375858',
          description: 'A great book.', page_count: 858 },
        { key: 'gb_def456', title: 'Fourth Wing', year: 2023,
          cover_url: 'https://example.com/cover2.jpg',
          ratings_average: nil, ratings_count: 0,
          language: 'en', isbn: nil,
          description: nil, page_count: nil },
      ]
    end

    it 'upserts works into book_catalog with correct field mapping' do
      expect {
        described_class.upsert_author_works(works, author: 'Rebecca Yarros')
      }.to change(described_class, :count).by(2)

      iron = described_class.find_by(google_books_id: 'gb_abc123')
      expect(iron.title).to eq('Iron Flame')
      expect(iron.author_name).to eq('Rebecca Yarros')
      expect(iron.cover_image_url).to eq('https://example.com/cover.jpg')
      expect(iron.published_date).to eq('2023')
      expect(iron.average_rating).to eq(4.5)
      expect(iron.ratings_count).to eq(1000)
      expect(iron.language).to eq('en')
      expect(iron.isbn).to eq('9781649375858')
      expect(iron.description).to eq('A great book.')
      expect(iron.page_count).to eq(858)
      expect(iron.source).to eq('google_books')
    end

    it 'skips works with blank key or title' do
      bad_works = [
        { key: '', title: 'No Key', year: 2023, cover_url: nil,
          ratings_average: nil, ratings_count: 0, language: 'en',
          isbn: nil, description: nil, page_count: nil },
        { key: 'gb_xyz', title: '', year: 2023, cover_url: nil,
          ratings_average: nil, ratings_count: 0, language: 'en',
          isbn: nil, description: nil, page_count: nil },
      ]
      expect {
        described_class.upsert_author_works(bad_works, author: 'Test Author')
      }.not_to change(described_class, :count)
    end

    it 'is a no-op for empty array' do
      expect { described_class.upsert_author_works([], author: 'Nobody') }.not_to change(described_class, :count)
    end
  end

  describe 'language field' do
    it 'is persisted through upsert_book' do
      described_class.upsert_book({
        google_books_id: 'lang_test_1',
        title:           'English Book',
        language:        'en',
        source:          'google_books',
      })
      expect(described_class.find_by(google_books_id: 'lang_test_1').language).to eq('en')
    end
  end

  describe '.search weighted ranking (title > author)' do
    before do
      BookCatalog.upsert_book({
        google_books_id: 'weight_title',
        title:           'The Story',
        author_name:     'John Smith',
        source:          'google_books',
      })
      BookCatalog.upsert_book({
        google_books_id: 'weight_author',
        title:           'A Novel',
        author_name:     'Story Writer',
        source:          'google_books',
      })
    end

    it 'ranks title-match above author-name-only match' do
      results = BookCatalog.search('story')
      title_pos  = results.index { |r| r.google_books_id == 'weight_title' }
      author_pos = results.index { |r| r.google_books_id == 'weight_author' }
      expect(title_pos).not_to be_nil
      expect(author_pos).not_to be_nil
      expect(title_pos).to be < author_pos
    end
  end

  describe '.search exact and prefix title boost' do
    before do
      BookCatalog.upsert_book({
        google_books_id: 'boost_exact',
        title:           'Funny Story',
        author_name:     'Emily Henry',
        source:          'google_books',
      })
      BookCatalog.upsert_book({
        google_books_id: 'boost_prefix',
        title:           'Funny Stories for Everyone',
        author_name:     'Jane Doe',
        source:          'google_books',
      })
      BookCatalog.upsert_book({
        google_books_id: 'boost_neither',
        title:           'A Collection of Funny and Exciting Stories',
        author_name:     'Bob Smith',
        source:          'google_books',
      })
    end

    it 'ranks exact title match first for multi-word query' do
      results = BookCatalog.search('funny story')
      exact_pos   = results.index { |r| r.google_books_id == 'boost_exact' }
      neither_pos = results.index { |r| r.google_books_id == 'boost_neither' }
      expect(exact_pos).not_to be_nil
      expect(exact_pos).to eq(0)
    end

    it 'ranks prefix title match above non-prefix match for incomplete query' do
      results = BookCatalog.search('funny stori')
      prefix_pos  = results.index { |r| r.google_books_id == 'boost_prefix' }
      neither_pos = results.index { |r| r.google_books_id == 'boost_neither' }
      expect(prefix_pos).not_to be_nil
      expect(neither_pos).not_to be_nil
      expect(prefix_pos).to be < neither_pos
    end
  end
end
