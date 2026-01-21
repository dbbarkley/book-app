require 'sidekiq'
require 'sidekiq-cron'

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  
  # Load sidekiq-cron schedule
  schedule_file = Rails.root.join("config", "sidekiq.yml")
  if File.exist?(schedule_file) && Sidekiq.server?
    begin
      schedule_config = YAML.load(ERB.new(File.read(schedule_file)).result)
      # Handle both symbol and string keys
      scheduler_config = schedule_config[:scheduler] || schedule_config["scheduler"]
      if scheduler_config
        schedule = scheduler_config[:schedule] || scheduler_config["schedule"]
        Sidekiq::Cron::Job.load_from_hash(schedule) if schedule
      end
    rescue => e
      Rails.logger.error "Sidekiq-Cron load error: #{e.message}"
    end
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end
