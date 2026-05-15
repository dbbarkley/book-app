FactoryBot.define do
  factory :release_reminder do
    association :user
    association :upcoming_release
  end
end
