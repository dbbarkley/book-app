FactoryBot.define do
  factory :upcoming_release do
    sequence(:isbn13) { |n| "978#{n.to_s.rjust(10, '0')}" }
    title             { 'Test Book' }
    authors           { ['Test Author'] }
    date_published    { 1.week.from_now.to_date }
    subjects          { [] }
    genres            { [] }
  end
end
