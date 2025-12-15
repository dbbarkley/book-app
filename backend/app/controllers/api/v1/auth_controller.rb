module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [:register, :login]

      def register
        user = User.new(user_params)
        user.password = params[:password]

        if user.save
          token = generate_token(user)
          render json: {
            user: serialize_user(user),
            token: token
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          token = generate_token(user)
          render json: {
            user: serialize_user(user),
            token: token
          }, status: :ok
        else
          render json: { error: 'Invalid credentials' }, status: :unauthorized
        end
      end

      def logout
        # With JWT, logout is typically handled client-side by removing the token
        # For server-side invalidation, you'd need a token blacklist (Redis)
        render json: { message: 'Logged out successfully' }, status: :ok
      end

      def refresh
        token = extract_token_from_header
        decoded_token = JwtService.decode(token)

        if decoded_token && decoded_token[:user_id]
          user = User.find_by(id: decoded_token[:user_id])
          if user
            new_token = generate_token(user)
            render json: { token: new_token }, status: :ok
          else
            render json: { error: 'User not found' }, status: :unauthorized
          end
        else
          render json: { error: 'Invalid token' }, status: :unauthorized
        end
      end

      def me
        render json: { user: serialize_user(current_user) }, status: :ok
      end

      private

      def user_params
        params.require(:user).permit(:email, :username, :display_name, :bio, :avatar_url)
      end

      def generate_token(user)
        JwtService.encode({ user_id: user.id })
      end

      def serialize_user(user)
        {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          onboarding_completed: user.onboarding_completed || false
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

