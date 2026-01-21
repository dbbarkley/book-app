namespace :genre_stats do
  desc "Backfill user_genre_stat_books for existing XP data"
  task backfill_books: :environment do
    puts "Backfilling user_genre_stat_books..."
    
    UserGenreStat.find_each do |stat|
      user = stat.user
      genre = stat.genre
      
      puts "Processing user #{user.id}, genre: #{genre} (#{stat.xp} XP)"
      
      # Find all user_books that might have contributed to this genre
      user.user_books
        .includes(book: :author)
        .where.not(pages_read: nil)
        .where('pages_read > 0')
        .find_each do |ub|
          next unless ub.book.present?
          
          # Get book categories and map to genres
          book_categories = ub.book.categories || []
          book_categories = [book_categories] unless book_categories.is_a?(Array)
          book_categories = book_categories.map(&:to_s).reject(&:blank?)
          
          matched_genres = GenreXpService.map_categories_to_genres(book_categories)
          matched_genres = ['Contemporary'] if matched_genres.empty?
          
          # If this book contributes to this genre, create the join record
          if matched_genres.include?(genre)
            # Estimate XP contributed (pages_read) - this is approximate for existing data
            stat_book = UserGenreStatBook.find_or_initialize_by(
              user_genre_stat: stat,
              user_book: ub
            )
            
            # Only update if it doesn't exist (don't overwrite existing data)
            if stat_book.new_record?
              stat_book.xp_contributed = ub.pages_read.to_i
              stat_book.save!
              puts "  Added book: #{ub.book.title} (#{ub.pages_read} XP)"
            end
          end
        end
    end
    
    puts "Backfill complete!"
  end
end

