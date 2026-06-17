require 'rails_helper'

RSpec.describe PeerRecommendationService do
  let(:author) { create(:author) }

  def make_book(_label = nil, categories: [])
    create(:book, author: author, categories: categories)
  end

  def make_user_book(user, book, status: 'read', rating: nil)
    create(:user_book, user: user, book: book, status: status,
           shelf: status, work_id: book.work_id, rating: rating)
  end

  describe '#call' do
    context 'when user has no read books' do
      let(:user) { create(:user) }

      it 'returns early without writing recommendations' do
        result = described_class.new(user).call
        expect(result[:recommendations]).to eq(0)
        expect(Recommendation.where(user: user, source: 'peer_v1').count).to eq(0)
      end
    end

    context 'when there are no peers with read books' do
      let(:user) { create(:user) }
      let(:book) { make_book(1) }

      before { make_user_book(user, book) }

      it 'returns 0 recommendations' do
        result = described_class.new(user).call
        expect(result[:recommendations]).to eq(0)
      end
    end

    context 'with a similar peer who has read qualifying books' do
      let(:user)  { create(:user) }
      let(:peer)  { create(:user) }
      let(:shared_book)     { make_book(1, categories: ['fiction']) }
      let(:peer_only_book)  { make_book(2, categories: ['fiction']) }

      before do
        # User has read the shared book
        make_user_book(user, shared_book, rating: 4.0)
        # Peer has read both books and loved both
        make_user_book(peer, shared_book, rating: 5.0)
        make_user_book(peer, peer_only_book, rating: 4.5)
        # Set matching genre preferences
        user.update!(preferences: { 'selected_genres' => ['fiction'] })
      end

      it 'creates a peer_v1 recommendation for the peer-only book' do
        described_class.new(user).call
        rec = Recommendation.find_by(user: user, recommendable: peer_only_book, source: 'peer_v1')
        expect(rec).to be_present
        expect(rec.score).to be > 0
        expect(rec.reason).to include('reader')
        expect(rec.dismissed_at).to be_nil
      end

      it 'does not recommend books already in the user\'s library' do
        described_class.new(user).call
        shared_rec = Recommendation.find_by(user: user, recommendable: shared_book, source: 'peer_v1')
        expect(shared_rec).to be_nil
      end
    end

    context 'when a peer has a book rated ≤ 3 stars' do
      let(:user) { create(:user) }
      let(:peer) { create(:user) }
      let(:shared_book)    { make_book(1) }
      let(:low_rated_book) { make_book(2, categories: ['fiction']) }

      before do
        make_user_book(user, shared_book, rating: 4.0)
        make_user_book(peer, shared_book, rating: 4.0)
        make_user_book(peer, low_rated_book, rating: 3.0)
        user.update!(preferences: { 'selected_genres' => ['fiction'] })
      end

      it 'does not recommend the low-rated book' do
        described_class.new(user).call
        expect(Recommendation.find_by(user: user, recommendable: low_rated_book)).to be_nil
      end
    end

    context 'when a previous peer_v1 rec was dismissed' do
      let(:user) { create(:user) }
      let(:peer) { create(:user) }
      let(:shared_book)    { make_book(1) }
      let(:dismissed_book) { make_book(2, categories: ['fiction']) }

      before do
        make_user_book(user, shared_book, rating: 4.0)
        make_user_book(peer, shared_book, rating: 5.0)
        make_user_book(peer, dismissed_book, rating: 5.0)
        user.update!(preferences: { 'selected_genres' => ['fiction'] })
        # Simulate a previously dismissed rec
        Recommendation.create!(
          user: user, recommendable: dismissed_book,
          source: 'peer_v1', reason: 'old reason',
          score: 1.0, dismissed_at: 1.day.ago
        )
      end

      it 'does not overwrite the dismissed rec' do
        described_class.new(user).call
        rec = Recommendation.find_by(user: user, recommendable: dismissed_book, source: 'peer_v1')
        expect(rec.dismissed_at).to be_present
      end
    end

    context 'similarity scoring' do
      let(:user) { create(:user) }
      let(:close_peer) { create(:user) }
      let(:distant_peer) { create(:user) }

      let(:book_a) { make_book(1, categories: ['mystery']) }
      let(:book_b) { make_book(2, categories: ['mystery']) }
      let(:book_c) { make_book(3, categories: ['mystery']) }
      let(:book_d) { make_book(4, categories: ['romance']) } # different genre

      before do
        user.update!(preferences: { 'selected_genres' => ['mystery'] })
        # User has read A and B
        make_user_book(user, book_a, rating: 5.0)
        make_user_book(user, book_b, rating: 5.0)
        # Close peer: read A, B, C (all mystery, ratings agree)
        make_user_book(close_peer, book_a, rating: 5.0)
        make_user_book(close_peer, book_b, rating: 4.5)
        make_user_book(close_peer, book_c, rating: 4.5)
        # Distant peer: read B only (little overlap), recommends romance
        make_user_book(distant_peer, book_b, rating: 2.0)
        make_user_book(distant_peer, book_d, rating: 5.0)
      end

      it 'recommends from the close peer over the distant peer' do
        described_class.new(user).call
        recs = Recommendation.where(user: user, source: 'peer_v1').order(score: :desc)
        book_ids = recs.map(&:recommendable_id)
        expect(book_ids).to include(book_c.id)
        expect(book_ids).not_to include(book_d.id)
      end
    end
  end
end
