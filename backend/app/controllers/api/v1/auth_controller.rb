module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [:register, :login, :refresh, :callback, :facebook, :forgot_password, :reset_password]

      # Generic callback for all OmniAuth providers
      def callback
        auth = request.env['omniauth.auth']
        user = User.from_omniauth(auth)

        if user.persisted?
          token = JwtService.encode_access(user.id)
          frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3002'
          redirect_to "#{frontend_url}/auth/callback?token=#{token}"
        else
          error_msg = user.errors.full_messages.join(', ')
          frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:3002'
          redirect_to "#{frontend_url}/login?error=#{CGI.escape(error_msg)}"
        end
      end

      def facebook
        callback
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
        render json: { message: 'Logged out successfully' }, status: :ok
      end

      # POST /api/v1/auth/refresh
      # Expects the 90-day refresh token in the Authorization header.
      # Returns a rotated token pair — both tokens are replaced so the
      # 90-day window resets on every successful refresh.
      def refresh
        raw    = extract_token_from_header
        result = JwtService.rotate(raw)

        if result
          access_token, refresh_token = result
          render json: {
            token:         access_token,   # kept for backward compat
            access_token:  access_token,
            refresh_token: refresh_token,
          }, status: :ok
        else
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
      # `token` is kept as an alias for access_token for backward compat with
      # any existing web clients that read response.token.
      def token_response(user)
        access_token  = JwtService.encode_access(user.id)
        refresh_token = JwtService.encode_refresh(user.id)
        {
          user:          serialize_user(user),
          token:         access_token,
          access_token:  access_token,
          refresh_token: refresh_token,
        }
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
