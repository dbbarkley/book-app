module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [:register, :login, :refresh, :callback, :facebook, :exchange, :forgot_password, :reset_password]

      # Generic callback for all OmniAuth providers.
      # Issues a short-lived one-time code stored in the Rails cache rather than
      # putting the JWT directly in the redirect URL (which would expose it in
      # browser history, server logs, and Referer headers).
      def callback
        auth = request.env['omniauth.auth']
        user = User.from_omniauth(auth)

        frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3002'

        if user.persisted?
          access_token  = JwtService.encode_access(user.id)
          refresh_token = JwtService.encode_refresh(user.id)
          code = SecureRandom.urlsafe_base64(32)
          Rails.cache.write(
            "oauth_code:#{code}",
            { user_id: user.id, access_token: access_token, refresh_token: refresh_token }.to_json,
            expires_in: 30.seconds
          )
          redirect_to "#{frontend_url}/auth/callback?code=#{code}"
        else
          error_msg = user.errors.full_messages.join(', ')
          redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_msg)}"
        end
      end

      def facebook
        callback
      end

      # POST /api/v1/auth/exchange
      # Redeems a one-time OAuth code (issued by #callback above) for a full
      # token pair. The code is consumed on first use and expires after 30 seconds.
      def exchange
        code = params[:code].to_s.strip
        return render json: { error: 'Code is required' }, status: :bad_request if code.blank?

        cache_key = "oauth_code:#{code}"
        raw       = Rails.cache.read(cache_key)
        return render json: { error: 'Code is invalid or has expired' }, status: :unauthorized unless raw

        Rails.cache.delete(cache_key)

        data = JSON.parse(raw)
        user = User.find_by(id: data['user_id'])
        return render json: { error: 'Code is invalid or has expired' }, status: :unauthorized unless user

        set_refresh_cookie(data['refresh_token'])
        render json: {
          user:          serialize_user(user),
          token:         data['access_token'],
          access_token:  data['access_token'],
          refresh_token: data['refresh_token'],
        }, status: :ok
      rescue => e
        Rails.logger.error("[auth/exchange] #{e.message}")
        render json: { error: 'Exchange failed' }, status: :internal_server_error
      end

      def register
        user = User.new(user_params)
        user.password = params[:password]

        if user.save
          render json: token_response(user), status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          render json: token_response(user), status: :ok
        else
          render json: { error: 'Invalid credentials' }, status: :unauthorized
        end
      end

      def logout
        clear_refresh_cookie
        render json: { message: 'Logged out successfully' }, status: :ok
      end

      # POST /api/v1/auth/refresh
      # Accepts the 90-day refresh token either via Authorization header (mobile)
      # or via the httpOnly refresh_token cookie (web). On success, rotates both
      # tokens and resets the cookie so the 90-day window keeps rolling.
      def refresh
        raw    = extract_token_from_header
        raw  ||= cookies[:refresh_token].presence
        result = JwtService.rotate(raw)

        if result
          access_token, refresh_token = result
          set_refresh_cookie(refresh_token)
          render json: {
            token:         access_token,   # kept for backward compat
            access_token:  access_token,
            refresh_token: refresh_token,
          }, status: :ok
        else
          clear_refresh_cookie
          render json: { error: 'Invalid or expired refresh token' }, status: :unauthorized
        end
      end

      def me
        render json: { user: serialize_user(current_user) }, status: :ok
      end

      # POST /api/v1/auth/forgot-password
      # Always responds with 200 to avoid leaking whether an email exists.
      def forgot_password
        user = User.find_by(email: params[:email]&.downcase&.strip)

        if user
          token = SecureRandom.urlsafe_base64(32)
          user.update!(
            password_reset_token:   token,
            password_reset_sent_at: Time.current
          )
          UserMailer.password_reset_email(user).deliver_later
        end

        render json: { message: 'If that email exists, a reset link is on its way.' }, status: :ok
      end

      # POST /api/v1/auth/reset-password
      def reset_password
        token = params[:token]&.strip
        user  = User.find_by(password_reset_token: token)

        unless user && user.password_reset_sent_at > 2.hours.ago
          return render json: { error: 'Reset link is invalid or has expired.' }, status: :unprocessable_entity
        end

        if user.update(password: params[:password], password_reset_token: nil, password_reset_sent_at: nil)
          render json: token_response(user), status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      # Build the standard login/register response with both token types.
      # Sets the httpOnly refresh_token cookie (web) and also includes the
      # refresh token in the JSON body for mobile clients that use the header.
      def token_response(user)
        access_token  = JwtService.encode_access(user.id)
        refresh_token = JwtService.encode_refresh(user.id)
        set_refresh_cookie(refresh_token)
        {
          user:          serialize_user(user),
          token:         access_token,
          access_token:  access_token,
          refresh_token: refresh_token,
        }
      end

      # Sets the refresh token as an httpOnly cookie scoped to the refresh path.
      # SameSite=None; Secure in production allows the cookie to be sent on
      # cross-origin requests (e.g. getwellread.com → api.getwellread.com).
      def set_refresh_cookie(token)
        is_secure = !Rails.env.development?
        cookies[:refresh_token] = {
          value:     token,
          httponly:  true,
          secure:    is_secure,
          same_site: is_secure ? :none : :lax,
          expires:   90.days.from_now,
          path:      '/api/v1/auth/refresh'
        }
      end

      def clear_refresh_cookie
        cookies.delete(:refresh_token, path: '/api/v1/auth/refresh')
      end

      def user_params
        params.require(:user).permit(:email, :username, :display_name, :bio, :avatar_url, :avatar)
      end

      def serialize_user(user)
        favourite_author_ids = user.preferences['author_ids'] || []
        favourite_authors = favourite_author_ids.any? ?
          Author.where(id: favourite_author_ids)
                .select(:id, :name)
                .map { |a| { id: a.id, name: a.name } } : []

        {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url_with_attachment,
          zipcode: user.zipcode,
          created_at: user.created_at,
          onboarding_completed: user.onboarding_completed || false,
          reading_streak: user.reading_streak.to_i,
          favourite_authors: favourite_authors,
          preferences: {
            milestones_viewed: user.preferences['milestones_viewed'] || [],
            reading_goal: user.preferences['reading_goal'],
            author_ids: favourite_author_ids
          }
        }
      end

      def extract_token_from_header
        auth_header = request.headers['Authorization']
        return nil unless auth_header
        auth_header.split(' ').last if auth_header.start_with?('Bearer ')
      end
    end
  end
end
