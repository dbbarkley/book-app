class UserMailer < ApplicationMailer
  # Send a password-reset link to the user.
  # Call via:  UserMailer.password_reset_email(user).deliver_later
  def password_reset_email(user)
    @user       = user
    @reset_url  = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3002')}/reset-password?token=#{user.password_reset_token}"
    @expires_in = '2 hours'

    mail(
      to:      @user.email,
      subject: 'Reset your Libraio password'
    )
  end
end
