class JwtService
  ACCESS_TOKEN_EXP  = 15.minutes
  REFRESH_TOKEN_EXP = 90.days

  def self.secret_key
    @secret_key ||= begin
      key = Rails.application.credentials.secret_key_base
      key ||= ENV['SECRET_KEY_BASE']
      key ||= 'development_secret_key_change_in_production'
      key
    end
  end

  # Short-lived access token (15 min) — used for every API request
  def self.encode_access(user_id)
    encode({ user_id: user_id, type: 'access' }, ACCESS_TOKEN_EXP.from_now)
  end

  # Long-lived refresh token (90 days) — used only to obtain new token pairs
  def self.encode_refresh(user_id)
    encode({ user_id: user_id, type: 'refresh' }, REFRESH_TOKEN_EXP.from_now)
  end

  def self.encode(payload, exp = ACCESS_TOKEN_EXP.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, secret_key)
  end

  def self.decode(token)
    decoded = JWT.decode(token, secret_key)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  # Returns decoded payload or nil if token is invalid or not a refresh token
  def self.decode_refresh(token)
    decoded = decode(token)
    return nil unless decoded
    return nil unless decoded[:type] == 'refresh'
    decoded
  end

  # Issue a fresh token pair from a valid refresh token.
  # Returns [access_token, refresh_token] or nil.
  def self.rotate(refresh_token)
    decoded = decode_refresh(refresh_token)
    return nil unless decoded
    [encode_access(decoded[:user_id]), encode_refresh(decoded[:user_id])]
  end
end
