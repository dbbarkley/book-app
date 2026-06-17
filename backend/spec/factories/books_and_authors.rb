FactoryBot.define do
  factory :author do
    sequence(:name) { |n| "Author #{n}" }
    bio             { nil }
    avatar_url      { nil }
  end

  factory :book do
    sequence(:title)         { |n| "Book #{n}" }
    sequence(:google_books_id) { |n| "gbid_#{n}" }
    release_date             { 2.years.ago.to_date }
    categories               { [] }
    association :author
    sequence(:work_id)       { |n| n + 1000 }
  end

  factory :user_book do
    association :user
    association :book
    status      { 'read' }
    shelf       { 'read' }
    visibility  { 'public' }
    rating      { nil }
    work_id     { book.work_id }
  end

  factory :recommendation do
    association :user
    association :recommendable, factory: :book
    reason      { 'A reader with similar taste loved this' }
    source      { 'peer_v1' }
    score       { 5.0 }
    metadata    { {} }
    dismissed_at { nil }
  end
end
