require 'rails_helper'

RSpec.describe 'Api::V1::Books', type: :request do
  describe 'GET /api/v1/books/catalog_search' do
    before do
      BookCatalog.upsert_book({
        google_books_id: 'hc_dune',
        title: 'Dune',
        author_name: 'Frank Herbert',
        cover_image_url: 'https://example.com/dune.jpg',
        source: 'hardcover',
      })
    end

    it 'returns matching books as an array' do
      get '/api/v1/books/catalog_search', params: { q: 'Dune' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['books']).to be_an(Array)
      expect(json['books'].first['google_books_id']).to eq('hc_dune')
      expect(json['books'].first['id']).to be_nil
    end

    it 'returns empty array for blank query' do
      get '/api/v1/books/catalog_search', params: { q: '' }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['books']).to be_empty
    end
  end

  describe 'GET /api/v1/books/by_google/:google_books_id (catalog path)' do
    context 'when book is in book_catalog but not in books table' do
      before do
        BookCatalog.upsert_book({
          google_books_id: 'hc_catalog_only',
          title: 'Catalog Only Book',
          author_name: 'Catalog Author',
          cover_image_url: 'https://example.com/cat.jpg',
          source: 'hardcover',
        })
      end

      it 'returns the book from catalog without hitting Google Books' do
        get '/api/v1/books/by_google/hc_catalog_only'
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['book']['title']).to eq('Catalog Only Book')
        expect(json['book']['google_books_id']).to eq('hc_catalog_only')
      end
    end
  end

  describe 'POST /api/v1/books/ensure (catalog write)' do
    let(:user)    { create(:user) }
    let(:token)   { JwtService.encode_access(user.id) }
    let(:headers) { { 'Authorization' => "Bearer #{token}" } }

    it 'upserts the book into book_catalog' do
      expect {
        post '/api/v1/books/ensure', params: {
          title:           'New Book',
          author_name:     'New Author',
          google_books_id: 'gb_ensure_test',
          cover_image_url: 'https://example.com/cover.jpg',
          release_date:    '2024-01-01',
        }, headers: headers
      }.to change(BookCatalog, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(BookCatalog.find_by(google_books_id: 'gb_ensure_test')).not_to be_nil
    end
  end

  describe 'POST /api/v1/books/catalog_bulk_upsert' do
    let(:books_payload) do
      [
        {
          google_books_id: 'gb_abc123',
          title: 'Test Book',
          author_name: 'Test Author',
          cover_image_url: 'https://example.com/cover.jpg',
          published_date: '2024-01-01',
          page_count: 300,
        }
      ]
    end

    it 'upserts books and returns ok' do
      expect {
        post '/api/v1/books/catalog_bulk_upsert',
             params: { books: books_payload, source: 'google_books' }.to_json,
             headers: { 'Content-Type' => 'application/json' }
      }.to change(BookCatalog, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['ok']).to be true
    end
  end

  describe 'GET /api/v1/books/author_works (catalog write)' do
    let(:google_books_response_body) do
      {
        items: [
          {
            id: 'gbooks_abc',
            volumeInfo: {
              title:         'Iron Flame',
              authors:       ['Rebecca Yarros'],
              publishedDate: '2023',
              language:      'en',
              averageRating: 4.5,
              ratingsCount:  1000,
              pageCount:     858,
              description:   'A book.',
              industryIdentifiers: [{ type: 'ISBN_13', identifier: '9781649375858' }],
              imageLinks:    { thumbnail: 'https://example.com/cover.jpg' },
            },
          },
        ],
      }.to_json
    end

    before do
      # Clear the Rails cache so each example starts on a cache miss
      Rails.cache.clear

      stub_request(:get, /googleapis\.com\/books\/v1\/volumes/)
        .to_return(
          status: 200,
          body: google_books_response_body,
          headers: { 'Content-Type' => 'application/json' },
        )
    end

    it 'writes fetched works to book_catalog on cache miss' do
      expect {
        get '/api/v1/books/author_works', params: { author: 'Rebecca Yarros' }
      }.to change(BookCatalog, :count).by(1)

      expect(response).to have_http_status(:ok)
      works = JSON.parse(response.body)['works']
      expect(works.first['key']).to eq('gbooks_abc')
      expect(works.first['ratings_average']).to eq(4.5)

      catalog = BookCatalog.find_by(google_books_id: 'gbooks_abc')
      expect(catalog).not_to be_nil
      expect(catalog.language).to eq('en')
      expect(catalog.isbn).to eq('9781649375858')
    end
  end
end
