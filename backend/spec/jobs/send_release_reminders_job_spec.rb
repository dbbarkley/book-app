require 'rails_helper'

RSpec.describe SendReleaseRemindersJob, type: :job do
  around do |example|
    orig = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    example.run
    ActiveJob::Base.queue_adapter = orig
  end

  describe '#perform' do
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }

    let(:release_tomorrow) do
      create(:upcoming_release, date_published: Date.tomorrow)
    end
    let(:release_tomorrow_2) do
      create(:upcoming_release, date_published: Date.tomorrow)
    end
    let(:release_next_week) do
      create(:upcoming_release, date_published: 1.week.from_now.to_date)
    end

    before do
      # user_a has two reminders for tomorrow
      create(:release_reminder, user: user_a, upcoming_release: release_tomorrow)
      create(:release_reminder, user: user_a, upcoming_release: release_tomorrow_2)
      # user_b has one reminder for tomorrow
      create(:release_reminder, user: user_b, upcoming_release: release_tomorrow)
      # reminder for next week — should NOT fire
      create(:release_reminder, user: user_a, upcoming_release: release_next_week)
    end

    it 'sends one email per user with reminders due tomorrow' do
      expect {
        described_class.new.perform
      }.to have_enqueued_mail(ReleaseReminderMailer, :tomorrow_digest).exactly(2).times
    end

    it 'creates one Notification per (user, book) pair' do
      expect {
        described_class.new.perform
      }.to change(Notification, :count).by(3)
    end

    it 'stamps reminded_at on processed reminders' do
      described_class.new.perform
      reminders = ReleaseReminder.joins(:upcoming_release)
                                 .where(upcoming_releases: { date_published: Date.tomorrow })
      expect(reminders.all? { |r| r.reminded_at.present? }).to be true
    end

    it 'does not fire again for already-reminded reminders' do
      described_class.new.perform
      expect {
        described_class.new.perform
      }.not_to have_enqueued_mail(ReleaseReminderMailer, :tomorrow_digest)
    end

    it 'does not fire for reminders due next week' do
      described_class.new.perform
      next_week_reminder = ReleaseReminder.find_by(user: user_a, upcoming_release: release_next_week)
      expect(next_week_reminder.reminded_at).to be_nil
    end
  end
end
