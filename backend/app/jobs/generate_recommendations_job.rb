class GenerateRecommendationsJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user

    Rails.logger.info "Starting recommendation generation for User #{user.id}"

    # 1. Get suggestions from LLM
    llm_output = LlmRecommendationService.new(user).call
    
    if llm_output[:error]
      Rails.logger.error "Recommendation Job Failed: #{llm_output[:error]}"
      return
    end

    # 2. Clear old LLM recommendations for this user to keep it fresh
    Recommendation.where(user: user, source: 'llm_v1').delete_all

    # 3. Resolve suggestions into DB records
    RecommendationResolutionService.new(user, llm_output).call

    Rails.logger.info "Successfully generated recommendations for User #{user.id}"
  end
end

