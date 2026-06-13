class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM', 'WellRead <noreply@getwellread.com>')
  layout 'mailer'
end
