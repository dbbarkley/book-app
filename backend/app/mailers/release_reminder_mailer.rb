class ReleaseReminderMailer < ApplicationMailer
  def tomorrow_digest(user, releases)
    return if releases.empty?

    @user     = user
    @releases = releases

    subject = releases.size == 1 ?
      'Your book releases tomorrow' :
      "#{releases.size} books you're watching release tomorrow"

    mail(to: @user.email, subject: subject)
  end
end
