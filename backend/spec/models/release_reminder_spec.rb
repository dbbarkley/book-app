require 'rails_helper'

RSpec.describe ReleaseReminder, type: :model do
  it 'is valid with a user and upcoming_release' do
    expect(build(:release_reminder)).to be_valid
  end

  it 'requires user' do
    expect(build(:release_reminder, user: nil)).not_to be_valid
  end

  it 'requires upcoming_release' do
    expect(build(:release_reminder, upcoming_release: nil)).not_to be_valid
  end

  it 'enforces one reminder per user per book' do
    reminder = create(:release_reminder)
    duplicate = build(:release_reminder, user: reminder.user, upcoming_release: reminder.upcoming_release)
    expect(duplicate).not_to be_valid
  end

  it 'is enforced at the database level' do
    reminder = create(:release_reminder)
    duplicate = build(:release_reminder, user: reminder.user, upcoming_release: reminder.upcoming_release)
    expect { duplicate.save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end
end
