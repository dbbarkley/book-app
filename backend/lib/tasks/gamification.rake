namespace :gamification do
  desc "Recalculate genre XP for all users based on their existing library progress"
  task recalculate_xp: :environment do
    puts "Step 1: Enriching books with missing page counts..."
    BookEnrichmentService.enrich_all_books
    
    puts "Step 2: Recalculating genre XP for all users..."
    User.find_each do |user|
      puts "Recalculating for user: #{user.username} (ID: #{user.id})..."
      GenreXpService.recalculate_for_user(user)
    end
    
    puts "Gamification XP recalculation complete!"
  end

  desc "Recalculate genre XP for a specific user (ID=xxx)"
  task :recalculate_user_xp, [:user_id] => :environment do |t, args|
    user = User.find(args[:user_id])
    puts "Recalculating for user: #{user.username} (ID: #{user.id})..."
    GenreXpService.recalculate_for_user(user)
    puts "Done!"
  end
end

