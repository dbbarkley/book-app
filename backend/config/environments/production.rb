require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.log_level = :info
  config.log_tags = [ :request_id ]
  config.action_mailer.perform_caching = false
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address:              ENV.fetch('SMTP_HOST',     'smtp.sendgrid.net'),
    port:                 ENV.fetch('SMTP_PORT',     '587').to_i,
    user_name:            ENV.fetch('SMTP_USERNAME', ''),
    password:             ENV.fetch('SMTP_PASSWORD', ''),
    authentication:       :plain,
    enable_starttls_auto: true,
  }
  config.action_mailer.default_url_options = { host: ENV.fetch('FRONTEND_URL', 'https://getwellread.com') }

  # Use Redis as the cache store so author_works (and other Rails.cache calls)
  # persist across dynos and survive deploys. Falls back to memory_store if
  # REDIS_URL isn't set (e.g. in staging envs that don't have Redis yet).
  if ENV["REDIS_URL"].present?
    config.cache_store = :redis_cache_store, {
      url:              ENV["REDIS_URL"],
      expires_in:       24.hours,
      race_condition_ttl: 10.seconds,
    }
  else
    config.cache_store = :memory_store, { size: 64.megabytes }
  end
  config.i18n.fallbacks = true
  config.active_support.deprecation = :notify
  config.active_record.dump_schema_after_migration = false

  # Store uploaded files on the local file system (see config/storage.yml for options)
  config.active_storage.service = :local
end

