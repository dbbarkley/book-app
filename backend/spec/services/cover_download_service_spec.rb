require 'rails_helper'

RSpec.describe CoverDownloadService do
  let(:book)       { create(:book, isbn: '9780743273565', google_books_id: 'abc123') }
  let(:service)    { described_class.new(book) }
  let(:cover_url)  { 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg' }
  let(:valid_body) { 'x' * 6_000 }  # 6 KB — above MIN_BYTES

  let(:book_cover_double) { instance_double(BookCoverService, find_best_cover: { url: cover_url }) }

  before do
    allow(BookCoverService).to receive(:new).with(book).and_return(book_cover_double)
    allow(ImageStorageService).to receive(:upload)
    allow(FastImage).to receive(:size).and_return([300, 450])
  end

  describe '#call' do
    context 'when image downloads and passes all validation' do
      before do
        stub_request(:get, cover_url).to_return(
          status: 200, body: valid_body,
          headers: { 'Content-Type' => 'image/jpeg' }
        )
      end

      it 'uploads to R2 and returns true' do
        expect(ImageStorageService).to receive(:upload).with(
          'covers/9780743273565.jpg', valid_body, content_type: 'image/jpeg'
        )
        expect(service.call).to be true
      end

      it 'sets cover_storage_path to the ISBN-based path' do
        service.call
        expect(book.reload.cover_storage_path).to eq('covers/9780743273565.jpg')
      end

      it 'updates cover_last_enriched_at' do
        service.call
        expect(book.reload.cover_last_enriched_at).not_to be_nil
      end
    end

    context 'when image body is below MIN_BYTES (5 KB)' do
      before do
        stub_request(:get, cover_url).to_return(
          status: 200, body: 'x' * 100,
          headers: { 'Content-Type' => 'image/jpeg' }
        )
      end

      it 'returns false without uploading' do
        expect(ImageStorageService).not_to receive(:upload)
        expect(service.call).to be false
      end

      it 'still updates cover_last_enriched_at to prevent immediate retry' do
        service.call
        expect(book.reload.cover_last_enriched_at).not_to be_nil
      end
    end

    context 'when Content-Type is not an image' do
      before do
        stub_request(:get, cover_url).to_return(
          status: 200, body: '<html>Not Found</html>',
          headers: { 'Content-Type' => 'text/html' }
        )
      end

      it 'returns false without uploading' do
        expect(ImageStorageService).not_to receive(:upload)
        expect(service.call).to be false
      end
    end

    context 'when dimensions are too small (1x1 placeholder GIF)' do
      before do
        stub_request(:get, cover_url).to_return(
          status: 200, body: valid_body,
          headers: { 'Content-Type' => 'image/gif' }
        )
        allow(FastImage).to receive(:size).and_return([1, 1])
      end

      it 'returns false without uploading' do
        expect(ImageStorageService).not_to receive(:upload)
        expect(service.call).to be false
      end
    end

    context 'when image hash matches a known placeholder' do
      before do
        empty_body = ''
        stub_request(:get, cover_url).to_return(
          status: 200, body: empty_body,
          headers: { 'Content-Type' => 'image/jpeg' }
        )
      end

      it 'returns false (empty file MD5 is in blocklist)' do
        expect(service.call).to be false
      end
    end

    context 'when BookCoverService finds no URL' do
      before do
        allow(book_cover_double).to receive(:find_best_cover).and_return({ url: nil })
      end

      it 'returns false without making any HTTP request' do
        expect(Net::HTTP).not_to receive(:start)
        expect(service.call).to be false
      end
    end

    context 'when the HTTP request raises a timeout' do
      before do
        stub_request(:get, cover_url).to_raise(Net::OpenTimeout)
      end

      it 'returns false' do
        expect(service.call).to be false
      end

      it 'logs a warning' do
        expect(Rails.logger).to receive(:warn).with(match(/\[CoverDownload\]/))
        service.call
      end
    end

    context 'when book has no ISBN, falls back to google_books_id for storage path' do
      let(:book) { create(:book, isbn: nil, google_books_id: 'abc123') }

      before do
        stub_request(:get, cover_url).to_return(
          status: 200, body: valid_body,
          headers: { 'Content-Type' => 'image/jpeg' }
        )
      end

      it 'stores cover at covers/<google_books_id>.jpg' do
        service.call
        expect(book.reload.cover_storage_path).to eq('covers/abc123.jpg')
      end
    end
  end
end
