class ProcessUserLocationJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    Rails.logger.info "[ProcessUserLocationJob] Processing location for user #{user_id}"
    user = User.find_by(id: user_id)
    
    if user.nil?
      Rails.logger.error "[ProcessUserLocationJob] User #{user_id} not found"
      return
    end

    if user.zipcode.blank?
      Rails.logger.info "[ProcessUserLocationJob] User #{user_id} has no zipcode"
      return
    end

    Rails.logger.info "[ProcessUserLocationJob] Found zipcode #{user.zipcode} for user #{user_id}"
    LocationDiscoveryService.new(user.zipcode).call
  end
end

