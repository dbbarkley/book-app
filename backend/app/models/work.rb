class Work < ApplicationRecord
  validates :canonical_title,  presence: true
  validates :canonical_author, presence: true
  validates :normalized_title,  presence: true
  validates :normalized_author, presence: true
  validates :normalized_title, uniqueness: { scope: :normalized_author }

  has_many :books, dependent: :nullify
end
