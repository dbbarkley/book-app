class BookNote < ApplicationRecord
  belongs_to :user
  belongs_to :user_book

  validates :content, presence: true, length: { maximum: 10_000 }
  validates :page_number, numericality: { greater_than: 0 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
end
