require 'rails_helper'

RSpec.describe GeneratePeerRecommendationsJob, type: :job do
  describe '#perform' do
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }

    it 'calls PeerRecommendationService for every onboarded user when no user_id given' do
      expect(PeerRecommendationService).to receive(:new).with(user_a).and_return(double(call: {}))
      expect(PeerRecommendationService).to receive(:new).with(user_b).and_return(double(call: {}))
      described_class.new.perform
    end

    it 'calls PeerRecommendationService only for the given user_id' do
      expect(PeerRecommendationService).to receive(:new).with(user_a).and_return(double(call: {}))
      expect(PeerRecommendationService).not_to receive(:new).with(user_b)
      described_class.new.perform(user_a.id)
    end

    it 'silently skips a missing user_id' do
      expect { described_class.new.perform(999_999) }.not_to raise_error
    end
  end
end
