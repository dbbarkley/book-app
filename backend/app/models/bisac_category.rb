class BisacCategory < ApplicationRecord
  has_many :curated_shelf_books, foreign_key: :bisac_code, primary_key: :code,
           dependent: :destroy

  validates :code, presence: true, uniqueness: true,
            format: { with: /\A[A-Z]{3}\d{6}\z/, message: 'must be a valid BISAC code (e.g. FIC027000)' }
  validates :name,          presence: true
  validates :query_terms,   presence: true
  validates :color,         presence: true,
            format: { with: /\A#[0-9A-Fa-f]{6}\z/, message: 'must be a hex colour' }
  validates :display_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active,     -> { where(active: true) }
  scope :top_level,  -> { where(parent_code: nil) }
  scope :ordered,    -> { order(:display_order, :name) }

  # A shelf is considered stale when it has never been populated, or when
  # stale_hours have elapsed since last_populated_at.
  # stale_hours == 0 means manual-only — never auto-repopulate.
  def stale?
    return false if stale_hours == 0
    last_populated_at.nil? || last_populated_at < stale_hours.hours.ago
  end

  # The tag/slug used to query the upstream source.
  # Falls back to the first entry in query_terms if source_identifier is blank.
  def resolved_source_identifier
    source_identifier.presence || Array(query_terms).first.to_s.strip.presence
  end

  def book_count
    curated_shelf_books.count
  end

  # Build the Google Books query string from query_terms.
  # First term is anchored as a subject: query; the rest are freetext keywords
  # that narrow the results within that subject space.
  #
  #   ["romance"]                              → "subject:romance"
  #   ["romance", "historical", "scottish"]   → "subject:romance historical scottish"
  def google_books_query
    terms = Array(query_terms).map(&:to_s).map(&:strip).reject(&:blank?)
    return '' if terms.empty?

    anchor   = "subject:#{terms.first}"
    keywords = terms[1..]&.join(' ')
    keywords.present? ? "#{anchor} #{keywords}" : anchor
  end
end
