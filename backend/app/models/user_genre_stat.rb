class UserGenreStat < ApplicationRecord
  belongs_to :user
  has_many :user_genre_stat_books, dependent: :destroy
  has_many :user_books, through: :user_genre_stat_books

  validates :genre, presence: true
  validates :xp, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :genre }

  # Tiers defined in PRD
  TIERS = [
    { min_xp: 250 },
    { min_xp: 1250 },
    { min_xp: 4000 },
    { min_xp: 10000 },
    { min_xp: 25000 }
  ].freeze

  TIER_NAMES = {
    'Romance' => ['Swoon Seeker', 'First Kiss Connoisseur', 'HEA Addict', 'Trope Titan', 'Romance Royalty'],
    'Fantasy' => ['Stable Hand', 'Questing Squire', 'Map Whisperer', 'Dragon Rider', 'High Sorcerer'],
    'Science Fiction' => ['Space Cadet', 'Stardust Voyager', 'Neon Navigator', 'Galactic Ambassador', 'Star-Lord'],
    'Mystery & Thriller' => ['Amateur Sleuth', 'Red Herring Wrangler', 'Private Eye', 'Forensic Master', 'The Mastermind'],
    'Horror' => ['Night-Light Sleeper', 'Sole Survivor', 'Cryptid Hunter', 'Nightmare Connoisseur', 'Harbinger of Doom'],
    'Historical Fiction' => ['Time Traveler', 'Period Piece Pro', 'Royal Courtier', 'History Buff', 'The Archivist'],
    'Non-Fiction' => ['Fact Finder', 'Knowledge Seeker', 'Life Optimizer', 'Subject Matter Expert', 'The Oracle'],
    'Young Adult (YA)' => ['Main Character Energy', 'Rebel Leader', 'Love Triangle Survivor', 'The Chosen One', 'YA Legend'],
    'Contemporary' => ['Coffee Shop Regular', 'Slice-of-Life Specialist', 'Drama Magnet', 'Modern Philosopher', 'The Socialite'],
    'Classics' => ['Dashing Debutante', 'Victorian Voyager', 'Existentialist', 'Literary Giant', 'The Immortal']
  }.freeze

  def tier_info
    current_tier_index = TIERS.reverse.index { |t| xp >= t[:min_xp] } || -1
    tier_names = TIER_NAMES[genre] || []
    current_tier_name = tier_names[current_tier_index] || tier_names[0] || 'Beginner'
    
    {
      current_tier: current_tier_name,
      tier_number: current_tier_index + 1,
      next_tier: TIERS[current_tier_index + 1] ? {
        name: tier_names[current_tier_index + 1] || 'Next Tier',
        min_xp: TIERS[current_tier_index + 1][:min_xp]
      } : nil,
      progress_to_next: next_tier_progress
    }
  end

  private

  def next_tier_progress
    next_tier = TIERS.find { |t| xp < t[:min_xp] }
    return 100 unless next_tier

    prev_min = TIERS.reverse.find { |t| xp >= t[:min_xp] }&.[](:min_xp) || 0
    total_needed = next_tier[:min_xp] - prev_min
    current_progress = xp - prev_min
    
    ((current_progress.to_f / total_needed) * 100).round(1)
  end
end

