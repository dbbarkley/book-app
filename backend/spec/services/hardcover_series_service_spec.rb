# backend/spec/services/hardcover_series_service_spec.rb
require 'rails_helper'

RSpec.describe HardcoverSeriesService do
  subject(:service) do
    described_class.new(
      google_books_id: 'hc_386446',
      title:           'The Way of Kings',
      author_name:     'Brandon Sanderson'
    )
  end

  GQL = HardcoverSeriesService::GQL_ENDPOINT

  # Stub the Hardcover GraphQL endpoint at the HTTP level (most reliable with WebMock).
  # Pass nil as find_response to simulate a network/server error (no HTTP success).
  def stub_graphql(find_response, series_response = nil, extra_calls: [])
    returns = []

    if find_response.nil?
      returns << { status: 500, body: 'Server Error' }
    else
      returns << { status: 200, body: { data: find_response }.to_json,
                   headers: { 'Content-Type' => 'application/json' } }
    end

    if series_response
      returns << { status: 200, body: { data: series_response }.to_json,
                   headers: { 'Content-Type' => 'application/json' } }
    end

    extra_calls.each { |r| returns << r }

    stub_request(:post, GQL).to_return(*returns)
  end

  describe '#call' do
    context 'when Hardcover GraphQL returns nil (network error)' do
      before { stub_graphql(nil) }

      it 'returns nil' do
        expect(service.call).to be_nil
      end
    end

    context 'when the book is not found on Hardcover' do
      before { stub_graphql({ 'books' => [] }) }

      it 'returns nil' do
        expect(service.call).to be_nil
      end
    end

    context 'when the book is found but is not in any series' do
      before do
        stub_graphql({ 'books' => [{
          'id' => 1, 'title' => 'The Way of Kings', 'users_count' => 100,
          'contributions' => [{ 'author' => { 'name' => 'Brandon Sanderson' } }],
          'book_series' => []
        }] })
      end

      it 'returns nil' do
        expect(service.call).to be_nil
      end
    end

    context 'when the book is in a series' do
      let(:find_response) do
        { 'books' => [{
          'id' => 386446, 'title' => 'The Way of Kings', 'users_count' => 8102,
          'contributions' => [{ 'author' => { 'name' => 'Brandon Sanderson' } }],
          'book_series' => [
            { 'position' => 1, 'series' => { 'id' => 997,  'name' => 'The Stormlight Archive' } },
            { 'position' => 7, 'series' => { 'id' => 5497, 'name' => 'The Cosmere' } },
          ]
        }] }
      end

      let(:series_response) do
        { 'series' => [{
          'id' => 997, 'name' => 'The Stormlight Archive',
          'book_series' => [
            # ✓ Should be included — canonical English, high users, integer position
            {
              'position' => 1,
              'book' => {
                'id' => 386446, 'title' => 'The Way of Kings', 'users_count' => 8102,
                'default_physical_edition_id' => 3134360,
                'image' => { 'url' => 'https://example.com/wok.jpg' },
                'english_editions' => [
                  { 'id' => 3134360, 'isbn_13' => '9780765326355', 'isbn_10' => nil }
                ]
              }
            },
            # ✓ Should be included — .5 position = legitimate novella
            {
              'position' => 2.5,
              'book' => {
                'id' => 55555, 'title' => 'Edgedancer', 'users_count' => 2779,
                'default_physical_edition_id' => 17695374,
                'image' => { 'url' => 'https://example.com/edge.jpg' },
                'english_editions' => [
                  { 'id' => 17695374, 'isbn_13' => '9781250166548', 'isbn_10' => nil }
                ]
              }
            },
            # ✗ Should be excluded — non-English (no english_editions)
            {
              'position' => 1,
              'book' => {
                'id' => 9999, 'title' => '王者之路', 'users_count' => 5,
                'default_physical_edition_id' => nil,
                'image' => { 'url' => 'https://example.com/cn.jpg' },
                'english_editions' => []
              }
            },
            # ✗ Should be excluded — sub-position audio drama (1.1)
            {
              'position' => 1.1,
              'book' => {
                'id' => 8888, 'title' => 'The Way of Kings [Dramatized]', 'users_count' => 20,
                'default_physical_edition_id' => nil,
                'image' => { 'url' => 'https://example.com/audio.jpg' },
                'english_editions' => [{ 'id' => 1, 'isbn_13' => '9781628512618', 'isbn_10' => nil }]
              }
            },
            # ✗ Should be excluded — below MIN_USERS threshold
            {
              'position' => 3,
              'book' => {
                'id' => 7777, 'title' => 'Oathbringer', 'users_count' => 10,
                'default_physical_edition_id' => nil,
                'image' => { 'url' => 'https://example.com/oath.jpg' },
                'english_editions' => [{ 'id' => 2, 'isbn_13' => '9780765326379', 'isbn_10' => nil }]
              }
            },
            # ✗ Should be excluded — no cover image (future/unannounced book)
            {
              'position' => 6,
              'book' => {
                'id' => 6666, 'title' => 'Untitled Stormlight 6', 'users_count' => 193,
                'default_physical_edition_id' => nil,
                'image' => nil,
                'english_editions' => [{ 'id' => 3, 'isbn_13' => nil, 'isbn_10' => nil }]
              }
            },
            # ✗ Should be excluded — position < 1 (draft/prime version)
            {
              'position' => 0.1,
              'book' => {
                'id' => 5555, 'title' => 'The Way of Kings Prime', 'users_count' => 170,
                'default_physical_edition_id' => nil,
                'image' => { 'url' => 'https://example.com/prime.jpg' },
                'english_editions' => [{ 'id' => 4, 'isbn_13' => nil, 'isbn_10' => nil }]
              }
            },
          ]
        }] }
      end

      before { stub_graphql(find_response, series_response) }

      it 'creates and returns a Series record' do
        result = service.call
        expect(result).to be_a(Series)
        expect(result.name).to eq('The Stormlight Archive')
        expect(result.hardcover_series_id).to eq(997)
      end

      it 'picks the most specific series (lowest position — Stormlight pos 1, not Cosmere pos 7)' do
        result = service.call
        expect(result.hardcover_series_id).to eq(997)
      end

      it 'writes only the two passing books to book_catalog' do
        service.call
        titles = BookCatalog.where(series_id: Series.last.id).order(:series_position).pluck(:title)
        expect(titles).to eq(['The Way of Kings', 'Edgedancer'])
      end

      it 'filters out non-English books' do
        service.call
        expect(BookCatalog.where(series_id: Series.last.id).pluck(:title)).not_to include('王者之路')
      end

      it 'filters out sub-position audio adaptations (.1 positions)' do
        service.call
        positions = BookCatalog.where(series_id: Series.last.id).pluck(:series_position).map(&:to_f)
        expect(positions).not_to include(1.1)
      end

      it 'filters out books below MIN_USERS (50)' do
        service.call
        expect(BookCatalog.where(series_id: Series.last.id).pluck(:title)).not_to include('Oathbringer')
      end

      it 'filters out books with no cover image' do
        service.call
        expect(BookCatalog.where(series_id: Series.last.id).pluck(:title)).not_to include('Untitled Stormlight 6')
      end

      it 'filters out pre-publication entries (position < 1)' do
        service.call
        positions = BookCatalog.where(series_id: Series.last.id).pluck(:series_position).map(&:to_f)
        expect(positions.all? { |p| p >= 1.0 }).to be true
      end

      it 'uses canonical ISBN from the edition matching default_physical_edition_id' do
        service.call
        wok = BookCatalog.find_by(google_books_id: 'hc_386446')
        expect(wok.isbn).to eq('9780765326355')
      end

      it 'sets google_books_id as hc_{hardcover_book_id}' do
        service.call
        expect(BookCatalog.find_by(title: 'The Way of Kings').google_books_id).to eq('hc_386446')
        expect(BookCatalog.find_by(title: 'Edgedancer').google_books_id).to eq('hc_55555')
      end

      it 'sets series_position correctly including .5 novellas' do
        service.call
        edge = BookCatalog.find_by(title: 'Edgedancer')
        expect(edge.series_position.to_f).to eq(2.5)
      end

      it 'sets total_books on the series to the count of canonical entries' do
        result = service.call
        expect(result.total_books).to eq(2)
      end

      it 'is idempotent — calling twice does not duplicate records' do
        # Second service.call finds series in DB (not stale) and returns early after
        # one HTTP call (find_hardcover_book). Stub 3 calls total: find, series, find.
        extra = [{ status: 200, body: { data: find_response }.to_json,
                   headers: { 'Content-Type' => 'application/json' } }]
        stub_request(:post, GQL).to_return(
          { status: 200, body: { data: find_response }.to_json, headers: { 'Content-Type' => 'application/json' } },
          { status: 200, body: { data: series_response }.to_json, headers: { 'Content-Type' => 'application/json' } },
          { status: 200, body: { data: find_response }.to_json, headers: { 'Content-Type' => 'application/json' } }
        )
        service.call
        service.call
        expect(Series.where(hardcover_series_id: 997).count).to eq(1)
        expect(BookCatalog.where(series_id: Series.last.id).count).to eq(2)
      end
    end
  end
end
