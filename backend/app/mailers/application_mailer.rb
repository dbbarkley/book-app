class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM', 'Libraio <noreply@libraio.app>')
  layout 'mailer'
end
