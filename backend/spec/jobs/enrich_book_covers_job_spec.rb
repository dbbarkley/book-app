require 'rails_helper'

RSpec.describe EnrichBookCoversJob do
  let(:download_double) { instance_double(CoverDownloadService, call: true) }

  describe '#perform' do
    let!(:stale_book)  { create(:book) }
    let!(:fresh_book)  { create(:book) }

    let(:stale_cover_service) { instance_double(BookCoverService, needs_enrichment?: true) }
    let(:fresh_cover_service) { instance_double(BookCoverService, needs_enrichment?: false) }

    before do
      allow(BookCoverService).to receive(:new).with(stale_book).and_return(stale_cover_service)
      allow(BookCoverService).to receive(:new).with(fresh_book).and_return(fresh_cover_service)
      allow(CoverDownloadService).to receive(:new).and_return(download_double)
    end

    it 'calls CoverDownloadService for books that need enrichment' do
      expect(CoverDownloadService).to receive(:new).with(stale_book).and_return(download_double)
      described_class.new.perform
    end

    it 'skips books that do not need enrichment' do
      expect(CoverDownloadService).not_to receive(:new).with(fresh_book)
      described_class.new.perform
    end

    it 'accepts an array of book_ids to process specific books' do
      expect(CoverDownloadService).to receive(:new).with(stale_book).once
      described_class.new.perform([stale_book.id])
    end
  end
end
