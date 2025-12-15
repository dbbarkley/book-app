# This file should ensure all the data records needed to run the application in a basic state are present.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Creating sample data..."

# Create sample users
user1 = User.create!(
  email: 'alice@example.com',
  username: 'alice_reader',
  password: 'password123',
  display_name: 'Alice Reader',
  bio: 'Book lover and avid reader'
)

user2 = User.create!(
  email: 'bob@example.com',
  username: 'bob_books',
  password: 'password123',
  display_name: 'Bob Books',
  bio: 'Sci-fi enthusiast'
)

# Create sample authors
author1 = Author.create!(
  name: 'Jane Smith',
  bio: 'Award-winning fantasy author',
  avatar_url: 'https://example.com/avatars/jane.jpg'
)

author2 = Author.create!(
  name: 'John Doe',
  bio: 'Bestselling science fiction writer',
  avatar_url: 'https://example.com/avatars/john.jpg'
)

# Create sample books
book1 = Book.create!(
  title: 'The Magic Forest',
  isbn: '978-1234567890',
  description: 'An epic fantasy adventure',
  cover_image_url: 'https://example.com/covers/magic-forest.jpg',
  release_date: 1.month.from_now,
  author: author1
)

book2 = Book.create!(
  title: 'Space Odyssey',
  isbn: '978-0987654321',
  description: 'A journey through the stars',
  cover_image_url: 'https://example.com/covers/space-odyssey.jpg',
  release_date: 2.months.from_now,
  author: author2
)

# Create sample events
event1 = Event.create!(
  title: 'Book Signing Event',
  description: 'Meet the author and get your book signed',
  event_type: 'signing',
  starts_at: 2.weeks.from_now,
  ends_at: 2.weeks.from_now + 2.hours,
  location: 'Central Library, Main Street',
  author: author1,
  book: book1
)

event2 = Event.create!(
  title: 'New Book Announcement',
  description: 'Announcing the sequel to Space Odyssey',
  event_type: 'author_announcement',
  starts_at: 1.week.from_now,
  author: author2
)

# Create sample follows
Follow.create!(
  follower: user1,
  followable: author1
)

Follow.create!(
  follower: user1,
  followable: book1
)

Follow.create!(
  follower: user2,
  followable: author2
)

puts "Sample data created successfully!"
puts "Users: #{User.count}"
puts "Authors: #{Author.count}"
puts "Books: #{Book.count}"
puts "Events: #{Event.count}"
puts "Follows: #{Follow.count}"

