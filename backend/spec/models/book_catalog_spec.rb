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
end
