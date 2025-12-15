class JwtService
  def self.secret_key
    @secret_key ||= begin
      key = Rails.application.credentials.secret_key_base
      key ||= ENV['SECRET_KEY_BASE']
      key ||= 'development_secret_key_change_in_production'
      key
    end
  end

  # Extend expiration to 30 days to prevent frequent logouts
  # Users can still manually logout for security
  def self.encode(payload, exp = 30.days.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, secret_key)
  end

  def self.decode(token)
    decoded = JWT.decode(token, secret_key)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    nil
  end
  
  # Refresh token with a new expiration time
  def self.refresh(token)
    decoded = decode(token)
    return nil unless decoded
    
    # Create new token with refreshed expiration
    encode({ user_id: decoded[:user_id] })
  end
end

