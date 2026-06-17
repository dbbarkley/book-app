class PeerRecommendationService
  SOURCE        = 'peer_v1'
  MAX_PEERS     = 10
  MAX_RECS      = 10
  MIN_PEER_SCORE = 10.0

  WEIGHTS = {
    shared_books:     40,
    genre_overlap:    25,
    author_overlap:   20,
    rating_agreement: 15,
  }.freeze

  def initialize(user)
    @user = user
  end

  def call
    Rails.logger.info("[PeerRecs] Generating for User #{@user.id}")

    profile = build_taste_profile
    if profile[:read_work_ids].empty?
      Rails.logger.info("[PeerRecs] User #{@user.id} has no read books — skipping")
      return { recommendations: 0 }
    end

    top_peers = score_peers(profile).first(MAX_PEERS)
    if top_peers.empty?
      Rails.logger.info("[PeerRecs] No similar peers found for User #{@user.id}")
      return { recommendations: 0 }
    end

    candidates = collect_candidates(top_peers, profile)
    top_books  = candidates.sort_by { |_, data| -data[:score] }.first(MAX_RECS)

    # Wipe active peer recs only — dismissed ones stay dismissed
    Recommendation.where(user: @user, source: SOURCE, dismissed_at: nil).delete_all
    save_recommendations(top_books)

    Rails.logger.info("[PeerRecs] Saved #{top_books.size} recs for User #{@user.id}")
    { recommendations: top_books.size }
  rescue StandardError => e
    Rails.logger.error("[PeerRecs] Error for User #{@user.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    { error: e.message }
  end

  private

  def build_taste_profile
    user_books = @user.user_books.includes(:book).to_a
    read_books = user_books.select { |ub| ub.status == 'read' }

    read_work_ids = read_books.map(&:work_id).compact.to_set

    genre_scores = Hash.new(0)
    read_books.each do |ub|
      weight = ub.rating.to_f >= 4 ? 3 : (ub.rating.to_f >= 3 ? 2 : 1)
      (ub.book&.categories || []).each { |c| genre_scores[c.downcase] += weight }
    end
    (@user.preferences['selected_genres'] || []).each { |g| genre_scores[g.downcase] += 2 }
    top_genres = genre_scores.sort_by { |_, v| -v }.first(8).map(&:first).to_set

    rated_author_ids = read_books
      .select { |ub| ub.rating.to_f >= 4 }
      .map { |ub| ub.book&.author_id }.compact.to_set
    followed_author_ids = @user.followed_authors.pluck(:id).to_set
    valued_author_ids = rated_author_ids | followed_author_ids

    rated_works = read_books
      .select { |ub| ub.rating.present? }
      .each_with_object({}) { |ub, h| h[ub.work_id] = ub.rating.to_f }

    {
      read_work_ids:     read_work_ids,
      top_genres:        top_genres,
      valued_author_ids: valued_author_ids,
      rated_works:       rated_works,
    }
  end

  def score_peers(profile)
    User.where.not(id: @user.id)
        .where(onboarding_completed: true)
        .includes(user_books: :book)
        .filter_map do |peer|
          peer_books = peer.user_books.select { |ub| ub.status == 'read' }
          next if peer_books.empty?

          peer_work_ids = peer_books.map(&:work_id).compact.to_set

          shared = (profile[:read_work_ids] & peer_work_ids).size.to_f
          union  = (profile[:read_work_ids] | peer_work_ids).size.to_f
          jaccard = union > 0 ? shared / union : 0.0

          peer_genres = peer_books
            .flat_map { |ub| ub.book&.categories || [] }.map(&:downcase).to_set
          genre_score = overlap_ratio(profile[:top_genres], peer_genres)

          peer_valued_authors = peer_books
            .select { |ub| ub.rating.to_f >= 4 }
            .map { |ub| ub.book&.author_id }.compact.to_set
          peer_valued_authors |= peer.followed_authors.pluck(:id).to_set
          author_score = overlap_ratio(profile[:valued_author_ids], peer_valued_authors)

          peer_rated_works = peer_books
            .select { |ub| ub.rating.present? }
            .each_with_object({}) { |ub, h| h[ub.work_id] = ub.rating.to_f }
          agreement = compute_rating_agreement(profile[:rated_works], peer_rated_works)

          score = (jaccard        * WEIGHTS[:shared_books]) +
                  (genre_score    * WEIGHTS[:genre_overlap]) +
                  (author_score   * WEIGHTS[:author_overlap]) +
                  (agreement      * WEIGHTS[:rating_agreement])

          next if score < MIN_PEER_SCORE

          { peer: peer, score: score, peer_books: peer_books }
        end
        .sort_by { |s| -s[:score] }
  end

  def collect_candidates(top_peers, profile)
    candidates = Hash.new { |h, k| h[k] = { score: 0.0, peer_count: 0, ratings: [], book: nil } }

    top_peers.each do |peer_data|
      peer_data[:peer_books].each do |ub|
        next if profile[:read_work_ids].include?(ub.work_id)
        next unless ub.rating.to_f > 3.0

        book = ub.book
        next unless book

        unless profile[:top_genres].empty?
          book_genres = (book.categories || []).map(&:downcase)
          next if (book_genres & profile[:top_genres].to_a).empty?
        end

        key = ub.work_id
        candidates[key][:book]        = book
        candidates[key][:score]      += peer_data[:score] * (ub.rating.to_f / 5.0)
        candidates[key][:peer_count]  = [candidates[key][:peer_count] + 1, 5].min
        candidates[key][:ratings]    << ub.rating.to_f
      end
    end

    candidates
  end

  def save_recommendations(top_books)
    top_books.each do |_work_id, data|
      book       = data[:book]
      peer_count = data[:peer_count]
      avg_rating = data[:ratings].sum / data[:ratings].size

      reason = case peer_count
               when 1    then "A reader with similar taste loved this"
               when 2..4 then "#{peer_count} readers with similar taste loved this"
               else           "Many readers with your taste loved this"
               end

      Recommendation.find_or_create_by!(user: @user, recommendable: book) do |r|
        r.source   = SOURCE
        r.score    = data[:score].round(2)
        r.reason   = reason
        r.metadata = { peer_count: peer_count, avg_peer_rating: avg_rating.round(2) }
      end
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn("[PeerRecs] Skipping rec: #{e.message}")
    end
  end

  def overlap_ratio(set_a, set_b)
    return 0.0 if set_a.empty? || set_b.empty?
    (set_a & set_b).size.to_f / [set_a.size, set_b.size].max
  end

  def compute_rating_agreement(rated_a, rated_b)
    shared_works = rated_a.keys & rated_b.keys
    return 0.0 if shared_works.empty?

    diffs = shared_works.map { |wid| (rated_a[wid] - rated_b[wid]).abs }
    avg_diff = diffs.sum / diffs.size
    1.0 - (avg_diff / 4.0)
  end
end
