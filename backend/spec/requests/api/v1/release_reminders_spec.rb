require 'rails_helper'

RSpec.describe 'Api::V1::ReleaseReminders', type: :request do
  let(:user)             { create(:user) }
  let(:token)            { JwtService.encode_access(user.id) }
  let(:headers)          { { 'Authorization' => "Bearer #{token}" } }
  let(:upcoming_release) { create(:upcoming_release) }

  describe 'POST /api/v1/release_reminders' do
    it 'creates a reminder and returns its id' do
      post '/api/v1/release_reminders',
           params:  { upcoming_release_id: upcoming_release.id },
           headers: headers

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['id']).to be_a(Integer)
    end

    it 'returns 422 for a duplicate reminder' do
      create(:release_reminder, user: user, upcoming_release: upcoming_release)

      post '/api/v1/release_reminders',
           params:  { upcoming_release_id: upcoming_release.id },
           headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns 401 without auth' do
      post '/api/v1/release_reminders',
           params: { upcoming_release_id: upcoming_release.id }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'DELETE /api/v1/release_reminders/:id' do
    it 'destroys the reminder' do
      reminder = create(:release_reminder, user: user, upcoming_release: upcoming_release)

      delete "/api/v1/release_reminders/#{reminder.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(ReleaseReminder.find_by(id: reminder.id)).to be_nil
    end

    it "returns 404 when trying to delete another user's reminder" do
      other_reminder = create(:release_reminder)

      delete "/api/v1/release_reminders/#{other_reminder.id}", headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it 'returns 401 without auth' do
      reminder = create(:release_reminder, user: user, upcoming_release: upcoming_release)

      delete "/api/v1/release_reminders/#{reminder.id}"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
