class GeneratePeerRecommendationsJob < ApplicationJob
  queue_as :low_priority

  def perform(user_id = nil)
    users = user_id ? User.where(id: user_id) : User.where(onboarding_completed: true)
    users.find_each { |u| PeerRecommendationService.new(u).call }
  end
end
