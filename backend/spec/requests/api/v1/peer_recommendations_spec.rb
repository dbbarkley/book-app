require 'rails_helper'

RSpec.describe 'Peer Recommendations API', type: :request do
  let(:user)    { create(:user) }
  let(:token)   { JwtService.encode_access(user.id) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'GET /api/v1/recommendations/peers' do
    context 'when peer recs exist' do
      let(:book) { create(:book) }
      let!(:rec) do
        create(:recommendation,
               user: user, recommendable: book,
               source: 'peer_v1', reason: '2 readers with similar taste loved this',
               score: 12.5, dismissed_at: nil)
      end

      before do
        stub_request(:get, /googleapis\.com\/books\/v1\/volumes/).to_return(status: 200, body: '{}', headers: {})
        stub_request(:get, /covers\.openlibrary\.org/).to_return(status: 404, body: '', headers: {})
      end

      it 'returns peer recommendations' do
        get '/api/v1/recommendations/peers', headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['peer_recommendations']).to be_an(Array)
        expect(json['peer_recommendations'].size).to eq(1)
        expect(json['peer_recommendations'].first['reason']).to eq('2 readers with similar taste loved this')
        expect(json['peer_recommendations'].first['source']).to eq('peer_v1')
      end

      it 'excludes dismissed recommendations' do
        rec.update!(dismissed_at: Time.current)
        get '/api/v1/recommendations/peers', headers: headers
        json = JSON.parse(response.body)
        expect(json['peer_recommendations']).to be_empty
      end
    end

    context 'when no peer recs exist' do
      it 'returns an empty array' do
        get '/api/v1/recommendations/peers', headers: headers
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['peer_recommendations']).to eq([])
      end
    end

    context 'when unauthenticated' do
      it 'returns 401' do
        get '/api/v1/recommendations/peers'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /api/v1/recommendations/:id/dismiss' do
    let(:book) { create(:book) }
    let!(:rec) do
      create(:recommendation,
             user: user, recommendable: book,
             source: 'peer_v1', reason: 'A reader with similar taste loved this',
             dismissed_at: nil)
    end

    it 'sets dismissed_at on the recommendation' do
      patch "/api/v1/recommendations/#{rec.id}/dismiss", headers: headers
      expect(response).to have_http_status(:ok)
      expect(rec.reload.dismissed_at).to be_present
    end

    it 'returns 404 for another user\'s recommendation' do
      other_rec = create(:recommendation)
      patch "/api/v1/recommendations/#{other_rec.id}/dismiss", headers: headers
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 401 when unauthenticated' do
      patch "/api/v1/recommendations/#{rec.id}/dismiss"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
