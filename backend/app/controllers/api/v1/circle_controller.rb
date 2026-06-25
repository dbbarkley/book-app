module Api
  module V1
    class CircleController < Api::V1::BaseController
      before_action :authenticate_user!

      # GET /api/v1/circle/trending
      # Returns top 4 books among the current user's friends, ranked by
      # (to_read + finished) count over the last 30 days.
      def trending
        days        = [[params[:days].to_i, 1].max, 90].min rescue 30
        days        = 30 if days == 0
        since       = days.days.ago
        friend_ids  = current_user.friends.pluck(:id)

        return render json: { books: [], days: days, friend_count: 0 } if friend_ids.empty?

        recent = UserBook
          .where(user_id: friend_ids)
          .where('user_books.updated_at >= ?', since)
          .where(status: %w[to_read reading read])
          .joins(:book)
          .select('user_books.book_id, user_books.status, user_books.rating, books.title, books.id AS b_id, books.cover_image_url, books.google_books_id')
          .includes(book: :author)

        agg = Hash.new do |h, k|
          h[k] = { to_read: 0, reading: 0, finished: 0, ratings: [], book: nil }
        end

        recent.each do |ub|
          a       = agg[ub.book_id]
          a[:book] ||= ub.book
          case ub.status
          when 'to_read'  then a[:to_read]  += 1
          when 'reading'  then a[:reading]  += 1
          when 'read'     then a[:finished] += 1
          end
          a[:ratings] << ub.rating.to_f if ub.rating.present?
        end

        ranked = agg.map do |_, data|
          next nil if data[:book].nil?
          score = data[:to_read] + data[:finished]
          total = data[:to_read] + data[:reading] + data[:finished]
          avg   = data[:ratings].empty? ? nil : (data[:ratings].sum / data[:ratings].size).round(1)

          parts = []
          parts << "#{data[:to_read]} to-read"  if data[:to_read]  > 0
          parts << "#{data[:reading]} reading"  if data[:reading]  > 0
          parts << "#{data[:finished]} finished" if data[:finished] > 0
          parts << "#{avg} stars"                if avg

          b = data[:book]
          {
            book: {
              id:              b.id,
              title:           b.title,
              author_name:     b.try(:author)&.name,
              cover_image_url: b.resolved_cover_url,
              google_books_id: b.google_books_id,
            },
            total_count:    total,
            to_read_count:  data[:to_read],
            reading_count:  data[:reading],
            finished_count: data[:finished],
            avg_rating:     avg,
            score:          score,
            activity_label: parts.join(' · '),
          }
        end.compact.sort_by { |r| -r[:score] }.first(4)

        render json: { books: ranked, days: days, friend_count: friend_ids.size }
      end

      # GET /api/v1/circle/genre_reads?genre=romance&days=30
      # Returns recent friend activity (to_read / reading / read) filtered to
      # books whose categories include the given genre keyword.
      def genre_reads
        days       = [[params[:days].to_i, 1].max, 90].min rescue 30
        days       = 30 if days == 0
        genre      = params[:genre].to_s.strip
        since      = days.days.ago
        friend_ids = current_user.friends.pluck(:id)

        return render json: { reads: [], days: days } if friend_ids.empty? || genre.blank?

        reads = UserBook
          .where(user_id: friend_ids)
          .where('user_books.updated_at >= ?', since)
          .where(status: %w[to_read reading read])
          .joins(:book)
          .where("array_to_string(books.categories, ' ') ILIKE ?", "%#{genre}%")
          .includes(:user, book: :author)
          .order('user_books.updated_at DESC')
          .limit(12)

        result = reads.map do |ub|
          b = ub.book
          u = ub.user
          {
            status: ub.status,
            updated_at: ub.updated_at,
            user: {
              id:           u.id,
              username:     u.username,
              display_name: u.display_name,
              avatar_url:   u.avatar_url,
            },
            book: {
              id:              b.id,
              title:           b.title,
              author_name:     b.author_name.presence || b.try(:author)&.name,
              cover_image_url: b.resolved_cover_url,
              google_books_id: b.google_books_id,
            },
          }
        end

        render json: { reads: result, days: days }
      end
    end
  end
end
