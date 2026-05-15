class SendReleaseRemindersJob < ApplicationJob
  queue_as :default

  def perform
    reminders = ReleaseReminder
      .joins(:upcoming_release)
      .where(upcoming_releases: { date_published: Date.tomorrow }, reminded_at: nil)
      .includes(:user, :upcoming_release)

    reminders.group_by(&:user).each do |user, user_reminders|
      releases = user_reminders.map(&:upcoming_release)

      ApplicationRecord.transaction do
        releases.each do |release|
          Notification.create!(
            user:              user,
            notifiable:        release,
            notification_type: 'book_release'
          )
        end

        user_reminders.each { |r| r.update_column(:reminded_at, Time.current) }
      end

      ReleaseReminderMailer.tomorrow_digest(user, releases).deliver_later
    rescue => e
      Rails.logger.error("[SendReleaseRemindersJob] Failed for user #{user.id}: #{e.message}")
    end
  end
end
