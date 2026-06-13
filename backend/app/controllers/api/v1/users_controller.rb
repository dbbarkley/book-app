module Api
  module V1
    class UsersController < BaseController
      include Authenticable
      before_action :authenticate_user!, except: [:show]
      before_action :set_user, only: [:show, :update, :profile, :following, :followers, :library, :stats, :genre_books, :friends]

      def show
        render json: serialize_user(@user), status: :ok
      end

      # GET /api/v1/users/:id/library
      def library
        user_books = @user.user_books
                          .includes(book: :author)
                          .where(visibility: 'public')
                          .order(updated_at: :desc)

        own = @user == current_user
        render json: {
          user_books: user_books.map { |ub| serialize_user_book(ub, include_notes: own) }
        }, status: :ok
      end

      def update
        if @user == current_user && @user.update(user_params)
          render json: serialize_user(@user), status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def profile
        current_follow = nil
        friendship_info = { status: 'none', friendship_id: nil }

        if current_user
          current_follow = current_user.follows.find_by(followable: @user)

          unless current_user.id == @user.id
            friendship = current_user.friendship_with(@user)
            if friendship
              friendship_info = {
                status:        current_user.friendship_status_with(@user),
                friendship_id: friendship.id
              }
            end
          end
        end

        render json: {
          user: serialize_user(@user),
          stats: {
            followers_count: @user.followers.count,
            following_count: @user.follows.count,
            friends_count:   @user.friends.count,
            genre_badges:    serialize_genre_badges(@user)
          },
          current_user_follow: current_follow ? {
            following: true,
            follow_id: current_follow.id
          } : {
            following: false
          },
          friendship: friendship_info
        }, status: :ok
      end

      def following
        follows = @user.follows.includes(:followable).order(created_at: :desc)
        render json: serialize_follows(follows), status: :ok
      end

      def followers
        followers = @user.followers
        render json: serialize_users(followers), status: :ok
      end

      # GET /api/v1/users/:id/friends
      # Only the user themselves or a mutual friend can see someone's friend list.
      def friends
        unless @user.id == current_user&.id || @user.friends_with?(current_user)
          return render json: { error: 'Forbidden' }, status: :forbidden
        end
        render json: serialize_users(@user.friends), status: :ok
      end

      # GET /api/v1/users/:id/genre/:genre/books
      def genre_books
        genre = params[:genre]
        books = get_genre_contributing_books(@user, genre)
        total_xp = books.sum { |b| b[:xp_contributed] }
        
        render json: {
          genre: genre,
          books: books,
          total_xp: total_xp
        }, status: :ok
      end

      # GET /api/v1/users/:id/stats
      def stats
        # Only include completed public books in stats
        public_books = @user.user_books.where(visibility: 'public', status: 'read').includes(book: :author)
        total_books  = public_books.count

        # Genre stats — map raw Google Books categories to normalised genre names
        genre_counts = Hash.new(0)

        public_books.each do |ub|
          categories = ub.book.respond_to?(:categories) ? (ub.book.categories || []) : []
          genres = map_categories_to_genres(categories)
          next unless genres  # skip books with no meaningful category data
          genres.each { |g| genre_counts[g] += 1 }
        end
        
        sorted_genres = genre_counts.sort_by { |_, count| -count }
        top_6_genres = sorted_genres.first(6).map do |name, count|
          {
            name: name,
            count: count,
            percentage: total_books > 0 ? (count.to_f / total_books * 100).round(1) : 0
          }
        end

        other_count = sorted_genres.drop(6).sum { |_, count| count }
        if other_count > 0
          top_6_genres << {
            name: 'Other',
            count: other_count,
            percentage: total_books > 0 ? (other_count.to_f / total_books * 100).round(1) : 0
          }
        end

        # Top Author stats
        author_counts = Hash.new(0)
        total_books = public_books.count
        
        public_books.each do |ub|
          author_counts[ub.book.author.name] += 1
        end
        
        top_authors = author_counts.sort_by { |_, count| -count }.first(10).map do |name, count|
          {
            name: name,
            count: count,
            percentage: total_books > 0 ? (count.to_f / total_books * 100).round(1) : 0
          }
        end

        render json: {
          genres: top_6_genres,
          top_authors: top_authors
        }, status: :ok
      end

      # Search users
      def search
        users = User.all.order(:username)
        
        # Support search query parameter
        if params[:query].present?
          query = params[:query].downcase
          users = users.where(
            "LOWER(username) LIKE ? OR LOWER(display_name) LIKE ? OR LOWER(bio) LIKE ?",
            "%#{query}%",
            "%#{query}%",
            "%#{query}%"
          )
        end
        
        # Support pagination
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min # Cap at 100
        
        total_count = users.count
        users = users.limit(per_page).offset((page - 1) * per_page)
        
        render json: {
          users: serialize_users(users),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      # Get current user's preferences
      def preferences
        user = current_user
        render json: {
          preferences: {
            genres: user.preferences['genres'] || [],
            author_ids: user.preferences['author_ids'] || [],
            milestones_viewed: user.preferences['milestones_viewed'] || [],
            reading_goal: user.preferences['reading_goal'],
            onboarding_completed: user.onboarding_completed,
            zipcode: user.zipcode
          }
        }, status: :ok
      end

      # Update current user's preferences
      def update_preferences
        user = current_user
        preferences_params = params.require(:preferences).permit(
          :onboarding_completed, 
          :zipcode, 
          :reading_goal,
          genres: [], 
          author_ids: [],
          milestones_viewed: []
        )

        # Update onboarding_completed if provided
        if preferences_params.key?(:onboarding_completed)
          user.onboarding_completed = preferences_params[:onboarding_completed]
        end

        # Update zipcode if provided
        if preferences_params.key?(:zipcode)
          user.zipcode = preferences_params[:zipcode]
        end

        # Update preferences JSONB
        user.preferences ||= {}
        user.preferences['genres'] = preferences_params[:genres] if preferences_params.key?(:genres)
        user.preferences['author_ids'] = preferences_params[:author_ids] if preferences_params.key?(:author_ids)
        user.preferences['milestones_viewed'] = preferences_params[:milestones_viewed] if preferences_params.key?(:milestones_viewed)
        user.preferences['reading_goal'] = preferences_params[:reading_goal].to_i if preferences_params.key?(:reading_goal)

        if user.save
          # Trigger recommendations generation if onboarding is completed
          if user.onboarding_completed? && user.saved_change_to_onboarding_completed?
            GenerateRecommendationsJob.perform_later(user.id)
          end

          render json: {
            message: 'Preferences updated successfully',
            preferences: {
              genres: user.preferences['genres'] || [],
              author_ids: user.preferences['author_ids'] || [],
              milestones_viewed: user.preferences['milestones_viewed'] || [],
              reading_goal: user.preferences['reading_goal'],
              onboarding_completed: user.onboarding_completed,
              zipcode: user.zipcode
            }
          }, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:display_name, :bio, :avatar_url, :zipcode, :avatar)
      end

      # Maps raw Google Books category strings to normalised display names.
      # Google Books returns very coarse data — most novels are just ["Fiction"].
      # We do keyword/substring matching so slash-separated strings like
      # "Fiction / Science Fiction / Space Opera" resolve to "Science Fiction".
      # Books with no categories, or only junk tags, are excluded from the chart.
      GENRE_MAP = {
        'Science Fiction'    => ['science fiction', 'sci-fi', 'space opera', 'dystopian', 'cyberpunk'],
        'Fantasy'            => ['fantasy', 'epic fantasy', 'urban fantasy'],
        'Romance'            => ['romance', 'love stories'],
        'Mystery & Thriller' => ['mystery', 'thriller', 'crime', 'suspense', 'detective'],
        'Horror'             => ['horror', 'gothic', 'supernatural', 'occult'],
        'Historical Fiction' => ['historical fiction'],
        'Young Adult'        => ['juvenile fiction', 'young adult'],
        'Biography'          => ['biography & autobiography', 'biography', 'autobiography'],
        'History'            => ['history'],
        'Science'            => ['science'],
        'Psychology'         => ['psychology'],
        'Social Science'     => ['social science'],
        'Self-Help'          => ['self-help'],
        'Business'           => ['business & economics', 'business'],
        'Philosophy'         => ['philosophy'],
        'Nature'             => ['nature'],
        'Cooking'            => ['cooking'],
        'Humor'              => ['humor'],
        'Classics'           => ['classics', 'classic literature'],
        'Comics & Graphic Novels' => ['comics', 'graphic novel', 'manga'],
      }.freeze

      # Tags that carry no genre signal — skip them entirely
      JUNK_CATEGORIES = %w[
        large\ type\ books audiobook concentration\ camp
        orchestral american\ literature
      ].freeze

      def map_categories_to_genres(categories)
        return nil if categories.blank?

        matched = categories.flat_map do |cat|
          lower = cat.downcase.strip
          next [] if JUNK_CATEGORIES.any? { |j| lower.include?(j) }

          GENRE_MAP.filter_map do |genre, keywords|
            genre if keywords.any? { |kw| lower.include?(kw) }
          end
        end.uniq

        if matched.any?
          matched
        else
          # Only remaining option: bare "Fiction" with no sub-genre info.
          # Show it honestly rather than hiding these books from the chart.
          categories.any? { |c| c.strip.downcase == 'fiction' } ? ['Fiction'] : nil
        end
      end

      def serialize_genre_badges(user)
        user.user_genre_stats.order(xp: :desc).map do |stat|
          {
            genre: stat.genre,
            xp: stat.xp,
            tier: stat.tier_info
          }
        end
      end

      def get_genre_contributing_books(user, genre)
        # Get the genre stat for this user and genre
        stat = user.user_genre_stats.find_by(genre: genre)
        return [] unless stat
        
        # Get all books that contributed to this genre via the join table
        stat.user_genre_stat_books
          .includes(user_book: { book: :author })
          .order(xp_contributed: :desc)
          .map do |stat_book|
            ub = stat_book.user_book
            next unless ub&.book.present?
            
            {
              id: ub.book.id,
              title: ub.book.title,
              author_name: ub.book.author&.name || 'Unknown Author',
              cover_image_url: ub.book.cover_image_url,
              pages_read: ub.pages_read.to_i,
              total_pages: ub.total_pages || (ub.book.respond_to?(:page_count) ? ub.book.page_count : nil),
              status: ub.status,
              finished_at: ub.finished_at,
              xp_contributed: stat_book.xp_contributed
            }
          end
          .compact
      end

      def serialize_user(user)
        data = {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url_with_attachment,
          created_at: user.created_at
        }

        # Private fields — only returned when a user requests their own profile
        if user == current_user
          favourite_author_ids = user.preferences['author_ids'] || []
          favourite_authors = favourite_author_ids.any? ?
            Author.where(id: favourite_author_ids)
                  .select(:id, :name)
                  .map { |a| { id: a.id, name: a.name } } : []

          data[:zipcode]              = user.zipcode
          data[:favourite_authors]    = favourite_authors
          data[:onboarding_completed] = user.onboarding_completed
          data[:reading_streak]       = user.reading_streak.to_i
          data[:preferences] = {
            milestones_viewed: user.preferences['milestones_viewed'] || [],
            reading_goal: user.preferences['reading_goal']
          }
        end

        data
      end

      def serialize_users(users)
        users.map { |user| serialize_user(user) }
      end

      def serialize_follows(follows)
        follows.map do |follow|
          {
            id: follow.id,
            followable_type: follow.followable_type,
            followable_id: follow.followable_id,
            followable: serialize_followable(follow.followable),
            created_at: follow.created_at
          }
        end
      end

      def serialize_followable(followable)
        case followable
        when User
          serialize_user(followable)
        when Author
          serialize_author(followable)
        when Book
          serialize_book(followable)
        end
      end

      def serialize_author(author)
        {
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url
        }
      end

      def serialize_book(book)
        {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          cover_image_url: book.cover_image_url,
          release_date: book.release_date,
          author_name: book.author.name,
          google_books_id: book.google_books_id,
          categories: book.respond_to?(:categories) ? (book.categories || []) : []
        }
      end

      def serialize_user_book(user_book, include_notes: false)
        {
          id: user_book.id,
          book_id: user_book.book_id,
          book: serialize_book(user_book.book),
          status: user_book.status,
          shelf: user_book.shelf,
          visibility: user_book.visibility,
          pages_read: user_book.pages_read,
          total_pages: user_book.total_pages,
          completion_percentage: user_book.completion_percentage,
          rating: user_book.rating,
          review: user_book.review,
          notes: include_notes ? user_book.notes : nil,
          dnf_reason: user_book.dnf_reason,
          dnf_page: user_book.dnf_page,
          started_at: user_book.started_at,
          finished_at: user_book.finished_at,
          created_at: user_book.created_at,
          updated_at: user_book.updated_at
        }
      end
    end
  end
end

