module Api
  module V1
    class RecommendationsController < BaseController
      def books
        recommended_books = candidate_books.map do |book|
          serialize_recommended_book(book)
        end

        render json: { recommended_books: recommended_books }, status: :ok
      end

      def authors
        recommended_authors = candidate_authors.map do |author|
          serialize_recommended_author(author)
        end

        render json: { recommended_authors: recommended_authors }, status: :ok
      end

      def events
        author_events = followed_author_events
        book_events = book_related_events(author_events.map(&:id))

        groups = []
        groups << build_event_group(
          'followed_authors',
          'Events from authors you follow',
          'Stay in the loop with the authors you already follow',
          author_events
        ) if author_events.any?

        groups << build_event_group(
          'related_books',
          'Events related to books you read',
          'Discover events tied to the books you love',
          book_events
        ) if book_events.any?

        render json: { recommended_events: groups }, status: :ok
      end

      private

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
          cover_image_url: book.cover_image_url,
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
          cover_image_url: book.cover_image_url,
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
    end
  end
end

