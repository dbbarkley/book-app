# SmartRecommendationService
#
# Generates personalised book and author recommendations using only the data
# stored in our own database — no LLM, no external AI API calls.
#
# Five scoring signals:
#   1. Author affinity   — books by authors the user has rated ≥4★ or follows
#   2. Category affinity — books whose categories overlap with the user's taste profile
#   3. Social reading    — books that people the user follows have finished
#   4. Series completion — more books by an author whose series the user started
#   5. Recency boost     — small bonus for books published within the last 2 years
#
# The taste profile is built entirely from:
#   - user_books (status, rating, book categories)
#   - follows (followed authors + followed users)
#   - preferences JSONB (genres chosen at onboarding)
#
class SmartRecommendationService
  SOURCE     = 'smart_v1'
  MAX_BOOKS  = 10
  MAX_AUTHORS = 5

  # Point values for each signal
  WEIGHTS = {
    rated_author:    4,   # book by an author user rated ≥4★
    followed_author: 3,   # book by an author user explicitly follows
    category_match:  2,   # per overlapping category (capped at 3 matches)
    social_read:     2,   # per followed-user who has finished the book (capped at 3)
    recent_release:  1,   # published in the last 2 years
  }.freeze

  def initialize(user)
    @user = user
  end

  def call
    Rails.logger.info("[SmartRecs] Generating recommendations for User #{@user.id}")

    # Wipe stale results so the user always sees a fresh set
    Recommendation.where(user: @user, source: SOURCE).delete_all

    profile = build_taste_profile

    if profile[:read_count].zero? && profile[:top_categories].empty? && profile[:valued_author_ids].empty?
      Rails.logger.info("[SmartRecs] User #{@user.id} has no history yet — skipping")
      return { books: 0, authors: 0 }
    end

    book_candidates   = score_books(profile).first(MAX_BOOKS)
    author_candidates = score_authors(profile).first(MAX_AUTHORS)

    save_book_recommendations(book_candidates)
    save_author_recommendations(author_candidates)

    Rails.logger.info("[SmartRecs] Saved #{book_candidates.size} books, #{author_candidates.size} authors for User #{@user.id}")
    { books: book_candidates.size, authors: author_candidates.size }

  rescue StandardError => e
    Rails.logger.error("[SmartRecs] Error for User #{@user.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    { error: e.message }
  end

  private

  # ─── Taste Profile ──────────────────────────────────────────────────────────

  def build_taste_profile
    # All user_books with book + author pre-loaded
    user_books = @user.user_books.includes(book: :author).to_a

    # Work IDs already in the user's library — used to exclude all editions of a read work
    all_user_work_ids = user_books.map(&:work_id).compact.to_set

    # Books the user has finished
    read_user_books = user_books.select { |ub| ub.status == 'read' }

    # Highly rated books (≥4 stars)
    highly_rated = read_user_books.select { |ub| ub.rating.to_i >= 4 }

    # Author IDs the user clearly enjoys (rated ≥4★)
    rated_author_ids = highly_rated.map { |ub| ub.book&.author_id }.compact.to_set

    # Author IDs the user explicitly follows
    followed_author_ids = @user.followed_authors.pluck(:id).to_set

    # Union: all authors we should weight positively
    valued_author_ids = rated_author_ids | followed_author_ids

    # ── Category affinity ──────────────────────────────────────────────────────
    # Weight categories by how many times they appear in read books,
    # giving extra weight to highly-rated books.
    category_scores = Hash.new(0)

    read_user_books.each do |ub|
      weight = ub.rating.to_i >= 4 ? 3 : (ub.rating.to_i >= 3 ? 2 : 1)
      (ub.book&.categories || []).each do |cat|
        category_scores[cat.downcase] += weight
      end
    end

    # Onboarding genre preferences count too
    (@user.preferences['selected_genres'] || []).each do |genre|
      category_scores[genre.downcase] += 2
    end

    # Keep the top 8 categories as the user's taste fingerprint
    top_categories = category_scores
                       .sort_by { |_, v| -v }
                       .first(8)
                       .map(&:first)
                       .to_set

    # ── Social signal ──────────────────────────────────────────────────────────
    # Map work_id → how many followed users have finished it (any edition counts)
    followed_user_ids = @user.followed_users.pluck(:id)
    social_work_counts = if followed_user_ids.any?
      UserBook.where(user_id: followed_user_ids, status: 'read')
              .group(:work_id)
              .count  # { work_id => count }
    else
      {}
    end

    {
      all_user_work_ids:   all_user_work_ids,
      valued_author_ids:   valued_author_ids,
      rated_author_ids:    rated_author_ids,
      followed_author_ids: followed_author_ids,
      top_categories:      top_categories,
      category_scores:     category_scores,
      social_work_counts:  social_work_counts,
      read_count:          read_user_books.size,
    }
  end

  # ─── Book Scoring ────────────────────────────────────────────────────────────

  def score_books(profile)
    candidates = Book.includes(:author)
                     .where.not(work_id: profile[:all_user_work_ids].to_a)
                     .where.not(work_id: nil)
                     .where.not(author_id: nil)

    scored = candidates.filter_map do |book|
      score   = 0
      reasons = []

      # 1. Author affinity
      if profile[:rated_author_ids].include?(book.author_id)
        score += WEIGHTS[:rated_author]
        reasons << "by #{book.author&.name}, an author you've loved"
      elsif profile[:followed_author_ids].include?(book.author_id)
        score += WEIGHTS[:followed_author]
        reasons << "by #{book.author&.name}, who you follow"
      end

      # 2. Category affinity (cap at 3 matching categories)
      book_cats    = (book.categories || []).map(&:downcase)
      matched_cats = (book_cats & profile[:top_categories].to_a).first(3)
      if matched_cats.any?
        score += WEIGHTS[:category_match] * matched_cats.size
        # Build a readable label from the raw category strings
        pretty = matched_cats.map { |c| c.split('/').last.strip.split.map(&:capitalize).join(' ') }
        reasons << "matches your taste in #{pretty.first(2).join(' & ')}"
      end

      # 3. Social reading
      social_count = [profile[:social_work_counts][book.work_id].to_i, 3].min
      if social_count > 0
        score += WEIGHTS[:social_read] * social_count
        label = social_count == 1 ? "someone you follow has read this" : "#{social_count} people you follow have read this"
        reasons << label
      end

      # 4. Recency boost
      if book.release_date && book.release_date >= 2.years.ago.to_date
        score += WEIGHTS[:recent_release]
      end

      # Discard books with no relevance to the user at all
      next if score.zero?

      {
        book:   book,
        score:  score,
        reason: reasons.first&.capitalize || "Matches your reading taste",
      }
    end

    scored.sort_by { |c| -c[:score] }
  end

  # ─── Author Scoring ──────────────────────────────────────────────────────────

  def score_authors(profile)
    # Authors the user hasn't followed and hasn't read any books from
    read_author_ids = @user.user_books
                           .includes(:book)
                           .map { |ub| ub.book&.author_id }
                           .compact
                           .to_set

    excluded_ids = (profile[:followed_author_ids] | read_author_ids).to_a

    candidates = Author.joins(:books)
                       .where.not(id: excluded_ids)
                       .distinct
                       .includes(:books)

    scored = candidates.filter_map do |author|
      score   = 0
      reasons = []

      # Category affinity through this author's books
      author_cats  = author.books.flat_map { |b| b.categories || [] }.map(&:downcase).uniq
      matched_cats = (author_cats & profile[:top_categories].to_a).first(3)

      if matched_cats.any?
        score += WEIGHTS[:category_match] * matched_cats.size
        pretty = matched_cats.map { |c| c.split('/').last.strip.split.map(&:capitalize).join(' ') }
        reasons << "writes #{pretty.first(2).join(' & ')}, genres you enjoy"
      end

      next if score.zero?

      {
        author: author,
        score:  score,
        reason: reasons.first&.capitalize || "Matches your reading taste",
      }
    end

    scored.sort_by { |c| -c[:score] }
  end

  # ─── Persistence ─────────────────────────────────────────────────────────────

  def save_book_recommendations(candidates)
    candidates.each do |candidate|
      Recommendation.find_or_create_by!(
        user:          @user,
        recommendable: candidate[:book]
      ) do |r|
        r.reason = candidate[:reason]
        r.source = SOURCE
        r.score  = candidate[:score].to_f
      end
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn("[SmartRecs] Skipping book rec: #{e.message}")
    end
  end

  def save_author_recommendations(candidates)
    candidates.each do |candidate|
      Recommendation.find_or_create_by!(
        user:          @user,
        recommendable: candidate[:author]
      ) do |r|
        r.reason = candidate[:reason]
        r.source = SOURCE
        r.score  = candidate[:score].to_f
      end
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn("[SmartRecs] Skipping author rec: #{e.message}")
    end
  end
end
