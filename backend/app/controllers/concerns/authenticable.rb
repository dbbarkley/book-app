module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    token = extract_token_from_header
    return render_unauthorized unless token

    decoded_token = JwtService.decode(token)
    return render_unauthorized unless decoded_token

    @current_user = User.find_by(id: decoded_token[:user_id])
    return render_unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end

  def render_unauthorized
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end
end

