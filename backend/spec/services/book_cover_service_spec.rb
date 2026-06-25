# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BookCoverService do
  let(:book)    { create(:book) }
  let(:service) { described_class.new(book) }

  describe '#needs_enrichment?' do
    context 'when cover_storage_path is present' do
      before { book.update_columns(cover_storage_path: 'covers/9780743273565.jpg') }

      it 'returns false without checking any other conditions' do
        # Even if cover_image_url is blank, the R2 path wins
        book.update_columns(cover_image_url: nil)
        expect(service.needs_enrichment?).to be false
      end
    end

    context 'when cover_storage_path is nil' do
      before { book.update_columns(cover_storage_path: nil) }

      it 'returns true when cover_image_url is blank' do
        book.update_columns(cover_image_url: nil)
        expect(service.needs_enrichment?).to be true
      end

      it 'returns true when cover_image_quality is below MEDIUM_QUALITY' do
        book.update_columns(
          cover_image_url:     'https://example.com/cover.jpg',
          cover_image_quality: BookCoverService::LOW_QUALITY,
          cover_last_enriched_at: 1.hour.ago,
          categories: ['Fiction'],
          page_count: 300
        )
        expect(service.needs_enrichment?).to be true
      end

      it 'returns true when cover_last_enriched_at is older than 30 days' do
        book.update_columns(
          cover_image_url:        'https://example.com/cover.jpg',
          cover_image_quality:    BookCoverService::MEDIUM_QUALITY,
          cover_last_enriched_at: 31.days.ago,
          categories:             ['Fiction'],
          page_count:             300
        )
        expect(service.needs_enrichment?).to be true
      end

      it 'returns false when all conditions are satisfied' do
        book.update_columns(
          cover_image_url:        'https://example.com/cover.jpg',
          cover_image_quality:    BookCoverService::MEDIUM_QUALITY,
          cover_last_enriched_at: 1.day.ago,
          categories:             ['Fiction'],
          page_count:             300
        )
        expect(service.needs_enrichment?).to be false
      end
    end
  end
end
