class Author < ApplicationRecord
  validates :name, presence: true

  has_many :books, dependent: :destroy
  has_many :events, dependent: :destroy
  has_many :follows, as: :followable, dependent: :destroy
  has_many :followers, through: :follows, source: :follower
end

