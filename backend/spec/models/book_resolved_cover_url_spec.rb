require 'rails_helper'

RSpec.describe Book, '#resolved_cover_url' do
  let(:r2_url) { 'https://pub-test.r2.dev/covers/9780743273565.jpg' }

  before do
    allow(ImageStorageService).to receive(:url_for)
      .with('covers/9780743273565.jpg')
      .and_return(r2_url)
  end

  context 'when cover_storage_path is present' do
    it 'returns the R2 CDN URL' do
      book = build(:book, cover_storage_path: 'covers/9780743273565.jpg',
                           cover_image_url: 'https://books.google.com/old.jpg')
      expect(book.resolved_cover_url).to eq(r2_url)
    end
  end

  context 'when cover_storage_path is blank' do
    it 'returns cover_image_url' do
      book = build(:book, cover_storage_path: nil,
                           cover_image_url: 'https://books.google.com/thumb.jpg')
      expect(book.resolved_cover_url).to eq('https://books.google.com/thumb.jpg')
    end
  end

  context 'when both are nil' do
    it 'returns nil' do
      book = build(:book, cover_storage_path: nil, cover_image_url: nil)
      expect(book.resolved_cover_url).to be_nil
    end
  end
end
