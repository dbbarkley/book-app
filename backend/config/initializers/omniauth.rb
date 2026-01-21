OmniAuth.config.allowed_request_methods = [:post, :get]
OmniAuth.config.silence_get_warning = true
OmniAuth.config.path_prefix = '/api/v1/auth'

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, ENV['FACEBOOK_APP_ID'], ENV['FACEBOOK_APP_SECRET'],
           scope: 'email,public_profile',
           info_fields: 'email,name,first_name,last_name',
           image_size: 'large'

  provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'],
           {
             scope: 'email, profile',
             prompt: 'select_account',
             image_aspect_ratio: 'square',
             image_size: 50
           }
end

