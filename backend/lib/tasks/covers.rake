# frozen_string_literal: true

namespace :covers do
  desc 'Upgrade zoom=1 to zoom=0 in existing Google Books cover URLs (run once after deploy)'
  task upgrade_zoom_urls: :environment do
    scope   = Book.where("cover_image_url LIKE '%zoom=1%'")
    total   = scope.count
    updated = 0

    puts "Upgrading #{total} cover URLs..."

    scope.find_each do |book|
      new_url = book.cover_image_url
        .gsub('zoom=1', 'zoom=0')
        .gsub('&edge=curl', '')
        .sub('http://', 'https://')
      book.update_column(:cover_image_url, new_url)
      updated += 1
      print '.' if (updated % 100).zero?
    end

    puts "\nDone. #{updated}/#{total} URLs upgraded."
  end
end
