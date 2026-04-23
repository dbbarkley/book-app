class GenerateRecommendationsJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user

    result = SmartRecommendationService.new(user).call

    if result[:error]
      Rails.logger.error("[RecsJob] Failed for User #{user_id}: #{result[:error]}")
    else
      Rails.logger.info("[RecsJob] Done for User #{user_id} — #{result[:books]} books, #{result[:authors]} authors")
    end
  end
end
