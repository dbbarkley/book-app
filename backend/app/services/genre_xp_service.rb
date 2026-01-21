class GenreXpService < BaseService
  DEFAULT_PAGE_COUNT = 300

  GENRE_MAP = {
    'Romance' => ['Romance', 'Contemporary Romance', 'Historical Romance', 'Love Stories'],
    'Fantasy' => ['Fantasy', 'Epic Fantasy', 'Magic', 'High Fantasy', 'Urban Fantasy'],
    'Science Fiction' => ['Science Fiction', 'Sci-Fi', 'Dystopian', 'Space Opera', 'Cyberpunk'],
    'Mystery & Thriller' => ['Mystery', 'Thriller', 'Crime', 'Suspense', 'Detective'],
    'Horror' => ['Horror', 'Gothic', 'Occult', 'Supernatural'],
    'Historical Fiction' => ['Historical Fiction', 'History Fiction'],
    'Non-Fiction' => ['Non-fiction', 'Biography', 'Autobiography', 'Self-Help', 'History', 'Science', 'Business', 'Economics', 'Philosophy', 'Psychology', 'Nature', 'Travel', 'Cooking', 'Art', 'Education', 'Social Science', 'Religion', 'True Crime'],
    'Young Adult (YA)' => ['Young Adult', 'YA', 'Juvenile Fiction'],
    'Contemporary' => ['Contemporary', 'Contemporary Fiction', 'Literary Fiction'],
    'Classics' => ['Classics', 'Classic Literature', 'Antique']
  }.freeze

  def self.award_xp(user, book, delta_pages, user_book = nil)
    return if delta_pages <= 0 || book.nil?

    # Find or create user_book if not provided
    user_book ||= user.user_books.find_by(book: book)
    return unless user_book # Can't award XP without a user_book

    target_genres = map_categories_to_genres(book.categories || [])
    
    # Fallback to 'Contemporary' if no genre matched but it's a book
    target_genres = ['Contemporary'] if target_genres.empty?

    target_genres.each do |genre|
      stat = UserGenreStat.find_or_create_by(user: user, genre: genre)
      stat.increment!(:xp, delta_pages)
      
      # Track which book contributed to this genre
      stat_book = UserGenreStatBook.find_or_initialize_by(
        user_genre_stat: stat,
        user_book: user_book
      )
      stat_book.xp_contributed += delta_pages
      stat_book.save!
    end
  end

  def self.recalculate_for_user(user)
    # Clear existing stats to avoid duplication
    UserGenreStat.where(user: user).delete_all

    # Process all user books with progress
    user.user_books.includes(book: :author).find_each do |ub|
      xp_to_award = 0
      
      if ub.status == 'read'
        # For completed books, award the full length
        xp_to_award = ub.total_pages.to_i > 0 ? ub.total_pages : (ub.book.respond_to?(:page_count) && ub.book.page_count.to_i > 0 ? ub.book.page_count : DEFAULT_PAGE_COUNT)
      else
        # For in-progress or DNF, award whatever they've read
        xp_to_award = ub.pages_read.to_i
      end

      award_xp(user, ub.book, xp_to_award, ub) if xp_to_award > 0
    end
  end

  def self.map_categories_to_genres(categories)
    return [] if categories.blank?

    mapped = []
    categories.each do |cat|
      GENRE_MAP.each do |target_genre, keywords|
        if keywords.any? { |kw| cat.downcase.include?(kw.downcase) }
          mapped << target_genre
        end
      end
    end

    mapped.uniq
  end
end
