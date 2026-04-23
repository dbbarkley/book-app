class User < ApplicationRecord
  has_secure_password
  has_one_attached :avatar
  
  validate :avatar_content_type
  validate :avatar_file_size

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true, length: { minimum: 3, maximum: 30 }

  # ── Friendships ──────────────────────────────────────────────────────────────
  has_many :sent_friendships,     class_name: 'Friendship', foreign_key: :requester_id,  dependent: :destroy
  has_many :received_friendships, class_name: 'Friendship', foreign_key: :requestee_id,  dependent: :destroy
  has_many :friends_as_requester,
           -> { where('friendships.status = ?', 'accepted') },
           through: :sent_friendships,     source: :requestee
  has_many :friends_as_requestee,
           -> { where('friendships.status = ?', 'accepted') },
           through: :received_friendships, source: :requester

  # ── Follows ───────────────────────────────────────────────────────────────────
  has_many :follows, foreign_key: :follower_id, dependent: :destroy, class_name: 'Follow'
  has_many :followed_users, through: :follows, source: :followable, source_type: 'User'
  has_many :followed_authors, through: :follows, source: :followable, source_type: 'Author'
  has_many :followed_books, through: :follows, source: :followable, source_type: 'Book'
  has_many :feed_items, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :user_books, dependent: :destroy
  has_many :imports, dependent: :destroy
  has_many :user_genre_stats, dependent: :destroy
  
  # Forum associations
  has_many :owned_forums, class_name: 'Forum', foreign_key: :owner_id, dependent: :destroy
  has_many :forum_follows, dependent: :destroy
  has_many :followed_forums, through: :forum_follows, source: :forum
  has_many :forum_posts, dependent: :destroy
  has_many :forum_replies, dependent: :destroy
  has_many :forum_hearts, dependent: :destroy
  has_many :forum_reports, dependent: :destroy

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
  after_save :process_location, if: :saved_change_to_zipcode?

  # All accepted friends regardless of who initiated
  def friends
    User.where(id: friends_as_requester.select(:id))
        .or(User.where(id: friends_as_requestee.select(:id)))
  end

  def friends_with?(other_user)
    Friendship.accepted.between(self, other_user).exists?
  end

  def friendship_with(other_user)
    Friendship.between(self, other_user).first
  end

  def friendship_status_with(other_user)
    f = friendship_with(other_user)
    return 'none' if f.nil?
    return 'accepted' if f.accepted?
    f.requester_id == id ? 'pending_sent' : 'pending_received'
  end

  def self.from_omniauth(auth)
    # 1. Try to find by provider/uid
    user = find_by(provider: auth.provider, uid: auth.uid)
    
    # 2. If not found, try to find by email
    if user.nil? && auth.info.email.present?
      user = find_by(email: auth.info.email)
      # Link this account to Facebook if email matches
      if user
        user.update(provider: auth.provider, uid: auth.uid)
      end
    end

    # 3. If still not found, create a new user
    if user.nil?
      user = create do |u|
        u.email = auth.info.email
        u.password = SecureRandom.hex(15)
        u.username = auth.info.name.parameterize + SecureRandom.hex(3)
        u.display_name = auth.info.name
        u.provider = auth.provider
        u.uid = auth.uid
        u.onboarding_completed = false
      end
    end

    # 4. Update avatar if they don't have one attached yet
    if user.persisted? && !user.avatar.attached? && auth.info.image.present?
      begin
        downloaded_image = HTTParty.get(auth.info.image).body
        extension = auth.info.image.split('.').last.split('?').first || 'jpg'
        # Basic validation for extension
        extension = 'jpg' unless extension.in?(%w(jpg jpeg png webp))
        
        user.avatar.attach(
          io: StringIO.new(downloaded_image),
          filename: "#{auth.provider}_avatar_#{user.id}.#{extension}",
          content_type: "image/#{extension == 'jpg' ? 'jpeg' : extension}"
        )
      rescue => e
        Rails.logger.error "Failed to download #{auth.provider} avatar: #{e.message}"
        # Fallback to saving the URL string just in case
        user.update(avatar_url: auth.info.image) if user.avatar_url.blank?
      end
    end

    user
  end

  def avatar_url_with_attachment
    if avatar.attached?
      begin
        # We use localhost:3000 because that's how the browser accesses the backend
        # even if Rails is running inside Docker.
        Rails.application.routes.url_helpers.rails_blob_url(avatar, host: 'localhost', port: 3000)
      rescue
        avatar_url
      end
    else
      avatar_url
    end
  end

  private

  def process_location
    return unless zipcode.present?
    Rails.logger.info "[User] Zipcode changed to #{zipcode}. Triggering location discovery..."
    ProcessUserLocationJob.perform_later(id)
  end

  def ensure_preferences_hash
    self.preferences = {} if preferences.nil?
  end

  def avatar_content_type
    if avatar.attached? && !avatar.content_type.in?(%w(image/jpeg image/png image/webp))
      errors.add(:avatar, 'must be a JPEG, PNG, or WebP image')
    end
  end

  def avatar_file_size
    if avatar.attached? && avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, 'is too large (max 5MB)')
    end
  end
end
