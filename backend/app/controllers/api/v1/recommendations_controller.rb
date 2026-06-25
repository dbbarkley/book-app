module Api
  module V1
    class RecommendationsController < BaseController
      SIMILAR_RATE_LIMIT = 10 # requests per minute per user

      # GET /api/v1/recommendations/similar_to/:book_id
      #
      # Returns books similar to the given book using Open Library's subject graph.
      # Results are cached server-side so repeat calls are instant.
      # Called progressively — one request per selected seed book —
      # so the frontend can pre-fetch before the user taps "Find".
      def similar_to
        book = Book.find_by(id: params[:book_id])
        return render json: { error: 'Book not found' }, status: :not_found unless book

        Rails.logger.info("[SimilarTo] Request for Book ##{book.id} '#{book.title}' by User ##{current_user.id}")

        # Basic rate limit: check how many similar_to calls this user has made recently
        cache_key = "similar_rate:#{current_user.id}"
        call_count = Rails.cache.fetch(cache_key, expires_in: 1.minute) { 0 }
        if call_count >= SIMILAR_RATE_LIMIT
          Rails.logger.warn("[SimilarTo] Rate limit hit for User ##{current_user.id} (#{call_count} calls/min)")
          return render json: { error: 'Too many requests. Please wait a moment.' }, status: :too_many_requests
        end
        Rails.cache.write(cache_key, call_count + 1, expires_in: 1.minute)

        # Fetch similar books (heavily cached in the service)
        similar = HardcoverSimilarityService.new(book).call
        Rails.logger.info("[SimilarTo] Service returned #{similar.size} books for Book ##{book.id}")

        # Filter out books already in this user's library
        user_book_ids = current_user.user_books.pluck(:book_id).to_set
        before_count  = similar.size
        similar.reject! { |b| b[:id].present? && user_book_ids.include?(b[:id]) }
        Rails.logger.info("[SimilarTo] After filtering user library: #{similar.size} books (removed #{before_count - similar.size})")

        render json: { books: similar }, status: :ok
      rescue => e
        Rails.logger.error("[SimilarTo] Unexpected error for Book ##{params[:book_id]}: #{e.message}\n#{e.backtrace.first(3).join("\n")}")
        render json: { error: 'Could not fetch similar books' }, status: :internal_server_error
      end

      def books
        recommendations = Recommendation.for_user(current_user).books.includes(recommendable: :author)
        
        if recommendations.empty?
          # Trigger background generation if empty
          GenerateRecommendationsJob.perform_later(current_user.id) if current_user.onboarding_completed?
          
          results = candidate_books.map do |book|
            serialize_recommended_book(book)
          end
        else
          results = recommendations.map do |rec|
            serialize_recommendation(rec)
          end.compact
        end

        render json: { recommended_books: results }, status: :ok
      end

      # Wipe and regenerate recommendations synchronously using SmartRecommendationService.
      # Because the service is purely DB-based (no external API calls), this is fast
      # enough to run in-request. Returns { books_count, authors_count } on success.
      #
      # Rate-limited: users must wait REGENERATE_COOLDOWN between calls to prevent
      # repeated DB load from abusive or accidental rapid refreshes.
      REGENERATE_COOLDOWN = 5.minutes

      def regenerate
        last_rec = Recommendation.where(user: current_user, source: 'smart_v1').maximum(:updated_at)
        if last_rec && last_rec > REGENERATE_COOLDOWN.ago
          wait_seconds = (last_rec + REGENERATE_COOLDOWN - Time.current).ceil
          return render json: {
            error: "Please wait #{wait_seconds}s before regenerating again"
          }, status: :too_many_requests
        end

        result = SmartRecommendationService.new(current_user).call

        if result[:error]
          render json: { error: result[:error] }, status: :unprocessable_entity
        else
          render json: { books_count: result[:books], authors_count: result[:authors] }, status: :ok
        end
      end

      def new_releases
        render json: { new_releases: [] }, status: :ok
      end

      # GET /api/v1/recommendations/coming_soon
      #
      # Query params:
      #   genre     — filter by genre slug (e.g. "romance", "thriller"). Optional.
      #   date_from — ISO date lower bound, e.g. "2026-05-06". Defaults to today.
      #   date_to   — ISO date upper bound, e.g. "2026-05-12". Optional.
      #   page      — page number, default 1
      #   per       — results per page, default 20, max 50
      #
      # Returns upcoming releases ordered by date_published ASC,
      # served from the upcoming_releases cache table (refreshed daily by ISBNdb).
      def coming_soon
        per  = [[params[:per].to_i, 1].max, 50].min
        per  = 20 if per.zero?
        page = [params[:page].to_i, 1].max

        # Date range — default to today→∞ when not specified
        date_from = parse_date(params[:date_from]) || Date.current
        date_to   = parse_date(params[:date_to])

        # Apply date + genre filters FIRST so the dedup window is scoped correctly.
        # A hardcover in June and a paperback in May belong to different release
        # windows and should both appear — not have one globally suppress the other.
        base = UpcomingRelease.where('date_published >= ?', date_from)
        base = base.where('date_published <= ?', date_to) if date_to
        base = base.by_genre(params[:genre].downcase.strip) if params[:genre].present?

        # Dedup within the filtered set — one winner per (title, first_author),
        # hardcover preferred, earliest date as tiebreaker.
        deduped_ids = base
          .select(Arel.sql(
            "DISTINCT ON (lower(trim(title)), lower(trim(COALESCE(authors->>0, '')))) id"
          ))
          .order(Arel.sql(
            "lower(trim(title)), " \
            "lower(trim(COALESCE(authors->>0, ''))), " \
            "CASE WHEN binding = 'Hardcover' THEN 0 ELSE 1 END ASC, " \
            "date_published ASC"
          ))

        # When browsing "all" genres, push Young Adult to the bottom so adult
        # fiction/non-fiction leads. When the user has explicitly filtered to
        # young-adult, respect that and sort by date only.
        ya_last = params[:genre].blank? ?
          "CASE WHEN genres @> '[\"young-adult\"]'::jsonb THEN 1 ELSE 0 END ASC, " : ""

        scope = UpcomingRelease.where(id: deduped_ids).order(Arel.sql("#{ya_last}date_published ASC"))

        total = scope.count
        books = scope.offset((page - 1) * per).limit(per)

        reminder_map = ReleaseReminder
          .where(user: current_user, upcoming_release: books)
          .pluck(:upcoming_release_id, :id)
          .to_h

        render json: {
          coming_soon: books.map { |b| b.as_api_json.merge(reminder_id: reminder_map[b.id]) },
          meta: {
            total:       total,
            page:        page,
            per:         per,
            total_pages: (total.to_f / per).ceil,
            genre:       params[:genre].presence,
            date_from:   date_from.iso8601,
            date_to:     date_to&.iso8601,
          }
        }, status: :ok
      end

      def authors
        recommendations = Recommendation.for_user(current_user).authors.includes(:recommendable)
        
        if recommendations.empty?
          results = candidate_authors.map do |author|
            serialize_recommended_author(author)
          end
        else
          results = recommendations.map do |rec|
            serialize_recommendation(rec)
          end.compact
        end

        render json: { recommended_authors: results }, status: :ok
      end

      def peers
        recs = Recommendation.for_user(current_user)
                             .books
                             .where(source: 'peer_v1', dismissed_at: nil)
                             .includes(recommendable: :author)

        GeneratePeerRecommendationsJob.perform_later(current_user.id) if recs.empty? && current_user.onboarding_completed?

        render json: { peer_recommendations: recs.map { |r| serialize_recommendation(r, enrich_cover: false) }.compact }, status: :ok
      end

      def dismiss
        rec = Recommendation.find_by(id: params[:id], user: current_user)
        return render json: { error: 'Not found' }, status: :not_found unless rec

        if rec.update(dismissed_at: Time.current)
          render json: {}, status: :ok
        else
          render json: { error: rec.errors.full_messages.first }, status: :unprocessable_entity
        end
      end

      def events
        # author_events = followed_author_events
        # book_events = book_related_events(author_events.map(&:id))

        # groups = []
        # groups << build_event_group(
        #   'followed_authors',
        #   'Events from authors you follow',
        #   'Stay in the loop with the authors you already follow',
        #   author_events
        # ) if author_events.any?

        # groups << build_event_group(
        #   'related_books',
        #   'Events related to books you read',
        #   'Discover events tied to the books you love',
        #   book_events
        # ) if book_events.any?

        # render json: { recommended_events: groups }, status: :ok
        
        render json: { recommended_events: [] }, status: :ok
      end

      private

      def parse_date(str)
        return nil if str.blank?
        Date.parse(str)
      rescue ArgumentError
        nil
      end

      def serialize_recommendation(rec, enrich_cover: true)
        item = rec.recommendable
        return nil unless item

        case rec.recommendable_type
        when 'Book'
          ensure_cover_for(item) if enrich_cover
          {
            id: rec.id,
            book: serialize_book_summary(item),
            reason: rec.reason,
            score: rec.score,
            source: rec.source || 'smart_v1'
          }
        when 'Author'
          {
            id: rec.id,
            author: serialize_author_summary(item),
            reason: rec.reason,
            score: rec.score,
            source: rec.source || 'smart_v1'
          }
        end
      end

      def serialize_scraped_book(book)
        {
          title: book.title,
          author_name: book.author_name,
          cover_image_url: book.cover_image_url,
          external_url: book.external_url,
          source: book.source,
          category: book.category,
          format: book.format || "Physical",
          genres: book.genre.to_s.split(',').map(&:strip) # Show all genres
        }
      end

      def candidate_books
        excluded_ids = current_user.user_books.select(:book_id)
        Book.includes(:author)
            .where.not(id: excluded_ids)
            .order(release_date: :desc, id: :asc)
            .limit(8)
      end

      def candidate_authors
        excluded_ids = current_user.followed_authors.select(:id)
        Author.where.not(id: excluded_ids)
              .order(:name)
              .limit(8)
      end

      def last_read_book_title
        @last_read_book_title ||= current_user.user_books
          .includes(book: :author)
          .where.not(book_id: nil)
          .order(updated_at: :desc)
          .limit(1)
          .map { |user_book| user_book.book&.title }
          .compact
          .first
      end

      def last_followed_author_name
        @last_followed_author_name ||= current_user.followed_authors.order(created_at: :desc).limit(1).pluck(:name).first
      end

      def serialize_recommended_book(book)
        ensure_cover_for(book)

        {
          id: book.id,
          book: serialize_book_summary(book),
          reason: recommendation_reason_for_book,
          score: book.release_date.to_time.to_i,
          source: 'history_v1'
        }
      end

      def serialize_recommended_author(author)
        {
          id: author.id,
          author: serialize_author_summary(author),
          reason: recommendation_reason_for_author,
          score: author.books.size,
          source: 'reading_history'
        }
      end

      def recommendation_reason_for_book
        if last_read_book_title.present?
          "Because you read #{last_read_book_title}"
        else
          'Because your reading history is similar'
        end
      end

      def recommendation_reason_for_author
        if last_followed_author_name.present?
          "Because you follow #{last_followed_author_name}"
        else
          'Because these authors match your taste'
        end
      end

      def serialize_book_summary(book)
        {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          cover_image_url: book.resolved_cover_url,
          release_date: book.release_date,
          author: serialize_author_summary(book.author),
          author_name: book.author&.name,
          google_books_id: book.google_books_id
        }
      end

      def ensure_cover_for(book)
        service = BookCoverService.new(book)
        return unless service.needs_enrichment?

        service.enrich_cover!
      rescue StandardError => e
        Rails.logger.error("Failed to enrich cover for recommendation book #{book.id}: #{e.message}")
      end

      def serialize_author_summary(author)
        return {} unless author

        {
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url,
          website_url: author.website_url,
        }
      end

      def candidate_events
        events = []
        events += followed_author_events.map { |event| { event: event, group: 'followed_authors' } }
        events += book_related_events.map { |event| { event: event, group: 'related_books' } }
        events.uniq { |payload| payload[:event].id }
      end

      def followed_author_events
        return [] if current_user.followed_author_ids.empty?

        Event.includes(:author, :book)
             .where(author_id: current_user.followed_author_ids)
             .where('starts_at >= ?', Time.current)
             .order(:starts_at)
             .limit(6)
      end

      def book_related_events(exclude_event_ids = [])
        book_ids = current_user.user_books.select(:book_id)
        return [] if book_ids.empty?

        query = Event.includes(:author, :book)
                     .where(book_id: book_ids)
                     .where('starts_at >= ?', Time.current)
                     .order(:starts_at)
                     .limit(6)

        query = query.where.not(id: exclude_event_ids) if exclude_event_ids.any?
        query
      end

      def build_event_group(group_key, title, description, events)
        {
          group: group_key,
          title: title,
          description: description,
          events: events.map { |event| serialize_recommended_event(event, group_key) }
        }
      end

      def serialize_recommended_event(event, group_key)
        {
          id: event.id,
          event: serialize_event_summary(event),
          reason: recommendation_reason_for_event(group_key, event),
          score: event.starts_at.to_i,
          source: group_key
        }
      end

      def serialize_event_summary(event)
        {
          id: event.id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location: event.location,
          is_virtual: event.is_virtual,
          venue_name: event.venue_name,
          external_url: event.external_url,
          external_source: event.external_source,
          author: serialize_author_summary(event.author),
          author_name: event.author&.name,
          book: serialize_event_book(event.book),
          book_id: event.book_id,
          book_title: event.book&.title,
        }
      end

      def serialize_event_book(book)
        return nil unless book

        {
          id: book.id,
          title: book.title,
          author_name: book.author_name || book.author&.name,
          cover_image_url: book.resolved_cover_url,
          release_date: book.release_date
        }
      end

      def recommendation_reason_for_event(group_key, event)
        case group_key
        when 'followed_authors'
          "Because you follow #{event.author&.name || 'one of these authors'}"
        when 'related_books'
          "Because it features #{event.book&.title || 'a book you read'}"
        else
          'Curated event recommendation'
        end
      end

      def serialize_books_for_new_releases(books)
        books.map do |book|
          {
            title: book.title,
            author_name: book.author&.name,
            cover_image_url: book.resolved_cover_url,
            id: book.id,
            release_date: book.release_date,
            source: 'Local Library'
          }
        end
      end
    end
  end
end
