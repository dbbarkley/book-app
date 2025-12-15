class User < ApplicationRecord
  has_secure_password

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true, length: { minimum: 3, maximum: 30 }

  has_many :follows, foreign_key: :follower_id, dependent: :destroy, class_name: 'Follow'
  has_many :followed_users, through: :follows, source: :followable, source_type: 'User'
  has_many :followed_authors, through: :follows, source: :followable, source_type: 'Author'
  has_many :followed_books, through: :follows, source: :followable, source_type: 'Book'
  has_many :feed_items, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :user_books, dependent: :destroy
  has_many :imports, dependent: :destroy
  
  # Users who follow this user (where this user is the followable)
  # Find all Follow records where followable_type = 'User' and followable_id = this user's id
  has_many :follower_relationships, 
           -> { where(followable_type: 'User') },
           class_name: 'Follow', 
           foreign_key: :followable_id, 
           dependent: :destroy
  has_many :followers, through: :follower_relationships, source: :follower

  # Ensure preferences is always a hash
  before_save :ensure_preferences_hash

  private

  def ensure_preferences_hash
    self.preferences = {} if preferences.nil?
  end
end

