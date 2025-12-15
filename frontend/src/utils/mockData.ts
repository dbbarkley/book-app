// Mock data for development and testing
// Replace with real API calls in production

import type { FeedItem, Book, Author, Event, User, UserBook } from '@book-app/shared'

export const mockUser: User = {
  id: 1,
  username: 'booklover123',
  email: 'booklover@example.com',
  display_name: 'Book Lover',
  bio: 'Passionate reader and book enthusiast',
  avatar_url: 'https://i.pravatar.cc/150?img=1',
  created_at: '2024-01-15T10:00:00Z',
}

// Additional mock users for feed activities
export const mockUsers: User[] = [
  mockUser,
  {
    id: 2,
    username: 'readingfanatic',
    display_name: 'Reading Fanatic',
    bio: 'Always has a book in hand',
    avatar_url: 'https://i.pravatar.cc/150?img=2',
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 3,
    username: 'bookworm42',
    display_name: 'BookWorm42',
    bio: 'Life is too short to read bad books',
    avatar_url: 'https://i.pravatar.cc/150?img=3',
    created_at: '2024-01-05T12:00:00Z',
  },
  {
    id: 4,
    username: 'literarylion',
    display_name: 'Literary Lion',
    bio: 'Classic literature enthusiast',
    avatar_url: 'https://i.pravatar.cc/150?img=4',
    created_at: '2023-12-20T15:00:00Z',
  },
  {
    id: 5,
    username: 'novelnerd',
    display_name: 'Novel Nerd',
    bio: 'Fiction is my reality',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    created_at: '2023-12-15T09:00:00Z',
  },
]

export const mockAuthors: Author[] = [
  {
    id: 1,
    name: 'Jane Austen',
    bio: 'English novelist known primarily for her six major novels.',
    avatar_url: 'https://i.pravatar.cc/150?img=12',
    website_url: 'https://example.com/jane-austen',
    books_count: 6,
    events_count: 2,
    followers_count: 1250,
  },
  {
    id: 2,
    name: 'Ernest Hemingway',
    bio: 'American novelist, short-story writer, and journalist.',
    avatar_url: 'https://i.pravatar.cc/150?img=13',
    website_url: 'https://example.com/ernest-hemingway',
    books_count: 10,
    events_count: 0,
    followers_count: 890,
  },
  {
    id: 3,
    name: 'Toni Morrison',
    bio: 'American novelist, essayist, book editor, and college professor.',
    avatar_url: 'https://i.pravatar.cc/150?img=14',
    website_url: 'https://example.com/toni-morrison',
    books_count: 11,
    events_count: 1,
    followers_count: 2100,
  },
  {
    id: 4,
    name: 'Haruki Murakami',
    bio: 'Japanese writer whose works blend surrealism and realism.',
    avatar_url: 'https://i.pravatar.cc/150?img=15',
    website_url: 'https://example.com/haruki-murakami',
    books_count: 14,
    events_count: 3,
    followers_count: 3200,
  },
  {
    id: 5,
    name: 'Chimamanda Ngozi Adichie',
    bio: 'Nigerian author known for her powerful narratives and feminist themes.',
    avatar_url: 'https://i.pravatar.cc/150?img=16',
    website_url: 'https://example.com/chimamanda-adichie',
    books_count: 7,
    events_count: 5,
    followers_count: 2800,
  },
]

export const mockBooks: Book[] = [
  {
    id: 1,
    title: 'Pride and Prejudice',
    isbn: '978-0141439518',
    description:
      'A romantic novel of manners written by Jane Austen. The novel follows the character development of Elizabeth Bennet.',
    cover_image_url: 'https://picsum.photos/300/400?random=1',
    release_date: '1813-01-28',
    author: mockAuthors[0],
    author_name: 'Jane Austen',
    followers_count: 450,
  },
  {
    id: 2,
    title: 'The Old Man and the Sea',
    isbn: '978-0684801223',
    description:
      'A short novel written by Ernest Hemingway. It tells the story of Santiago, an aging Cuban fisherman.',
    cover_image_url: 'https://picsum.photos/300/400?random=2',
    release_date: '1952-09-01',
    author: mockAuthors[1],
    author_name: 'Ernest Hemingway',
    followers_count: 320,
  },
  {
    id: 3,
    title: 'Beloved',
    isbn: '978-1400033416',
    description:
      'A novel by Toni Morrison set after the American Civil War. It tells the story of a family of former slaves.',
    cover_image_url: 'https://picsum.photos/300/400?random=3',
    release_date: '1987-09-02',
    author: mockAuthors[2],
    author_name: 'Toni Morrison',
    followers_count: 680,
  },
  {
    id: 4,
    title: 'Sense and Sensibility',
    isbn: '978-0141439662',
    description:
      'A novel by Jane Austen, published in 1811. It tells the story of the Dashwood sisters.',
    cover_image_url: 'https://picsum.photos/300/400?random=4',
    release_date: '1811-10-30',
    author: mockAuthors[0],
    author_name: 'Jane Austen',
    followers_count: 290,
  },
  {
    id: 5,
    title: 'Norwegian Wood',
    isbn: '978-0375704024',
    description:
      'A nostalgic story of loss and sexuality set in late 1960s Tokyo.',
    cover_image_url: 'https://picsum.photos/300/400?random=5',
    release_date: '1987-09-04',
    author: mockAuthors[3],
    author_name: 'Haruki Murakami',
    followers_count: 520,
  },
  {
    id: 6,
    title: 'Americanah',
    isbn: '978-0307455925',
    description:
      'A powerful story about love, race, and identity across continents.',
    cover_image_url: 'https://picsum.photos/300/400?random=6',
    release_date: '2013-05-14',
    author: mockAuthors[4],
    author_name: 'Chimamanda Ngozi Adichie',
    followers_count: 890,
  },
]

export const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Book Signing: Pride and Prejudice',
    description: 'Join Jane Austen for a book signing event at the local bookstore.',
    event_type: 'signing',
    starts_at: '2024-06-15T14:00:00Z',
    ends_at: '2024-06-15T16:00:00Z',
    location: 'Downtown Bookstore, 123 Main St',
    author: mockAuthors[0],
    author_name: 'Jane Austen',
    book: mockBooks[0],
  },
  {
    id: 2,
    title: 'Author Reading: Beloved',
    description: 'Toni Morrison reads excerpts from her acclaimed novel Beloved.',
    event_type: 'reading',
    starts_at: '2024-07-20T19:00:00Z',
    ends_at: '2024-07-20T21:00:00Z',
    location: 'City Library, 456 Oak Ave',
    author: mockAuthors[2],
    author_name: 'Toni Morrison',
    book: mockBooks[2],
  },
  {
    id: 3,
    title: 'New Release: The Complete Works',
    description: 'Announcing the release of a new collection of works.',
    event_type: 'book_release',
    starts_at: '2024-08-01T00:00:00Z',
    author: mockAuthors[1],
    author_name: 'Ernest Hemingway',
  },
  {
    id: 4,
    title: 'Q&A with Chimamanda Ngozi Adichie',
    description: 'An intimate conversation about writing, feminism, and storytelling.',
    event_type: 'interview',
    starts_at: '2024-06-25T18:00:00Z',
    ends_at: '2024-06-25T20:00:00Z',
    location: 'Virtual Event',
    author: mockAuthors[4],
    author_name: 'Chimamanda Ngozi Adichie',
  },
]

// Mock User Books - User's shelves and reading progress
export const mockUserBooks: UserBook[] = [
  {
    id: 1,
    book_id: 1,
    book: mockBooks[0],
    shelf: 'read',
    pages_read: 432,
    total_pages: 432,
    completion_percentage: 100,
    rating: 5,
    review: 'A timeless classic! The character development is exceptional.',
    started_at: '2024-01-01T00:00:00Z',
    finished_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    book_id: 2,
    book: mockBooks[1],
    shelf: 'reading',
    pages_read: 120,
    total_pages: 127,
    completion_percentage: 94,
    rating: undefined,
    review: undefined,
    started_at: '2024-01-20T00:00:00Z',
    finished_at: undefined,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
  },
  {
    id: 3,
    book_id: 3,
    book: mockBooks[2],
    shelf: 'to_read',
    pages_read: undefined,
    total_pages: 324,
    completion_percentage: 0,
    rating: undefined,
    review: undefined,
    started_at: undefined,
    finished_at: undefined,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 4,
    book_id: 4,
    book: mockBooks[3],
    shelf: 'read',
    pages_read: 352,
    total_pages: 352,
    completion_percentage: 100,
    rating: 4,
    review: 'Another wonderful Austen novel. The Dashwood sisters are beautifully written.',
    started_at: '2023-12-01T00:00:00Z',
    finished_at: '2023-12-20T00:00:00Z',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-20T00:00:00Z',
  },
  {
    id: 5,
    book_id: 5,
    book: mockBooks[4],
    shelf: 'reading',
    pages_read: 180,
    total_pages: 296,
    completion_percentage: 61,
    rating: undefined,
    review: undefined,
    started_at: '2024-01-18T00:00:00Z',
    finished_at: undefined,
    created_at: '2024-01-18T00:00:00Z',
    updated_at: '2024-01-26T00:00:00Z',
  },
]

// Comprehensive Mock Feed Items with various activity types
// Demonstrates book releases, events, user activities, and social interactions
export const mockFeedItems: FeedItem[] = [
  // User finished a book (2 hours ago)
  {
    id: 1,
    activity_type: 'user_finished_book',
    metadata: { 
      user_book_id: 1,
      rating: 5,
      shelf: 'read',
    },
    feedable: mockUserBooks[0],
    user: mockUsers[1], // readingfanatic
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  
  // New book release (5 hours ago)
  {
    id: 2,
    activity_type: 'book_release',
    metadata: { book_id: 6 },
    feedable: mockBooks[5], // Americanah
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  
  // User added a book to shelf (8 hours ago)
  {
    id: 3,
    activity_type: 'user_added_book',
    metadata: { 
      user_book_id: 3,
      shelf: 'to_read',
    },
    feedable: mockUserBooks[2],
    user: mockUsers[2], // bookworm42
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
  
  // Upcoming author event (10 hours ago)
  {
    id: 4,
    activity_type: 'author_event',
    metadata: { event_id: 4 },
    feedable: mockEvents[3],
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
  },
  
  // User progress update (12 hours ago)
  {
    id: 5,
    activity_type: 'user_progress_update',
    metadata: { 
      user_book_id: 5,
      pages_read: 180,
      total_pages: 296,
      completion_percentage: 61,
    },
    feedable: mockUserBooks[4],
    user: mockUsers[3], // literarylion
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  
  // User followed an author (1 day ago)
  {
    id: 6,
    activity_type: 'user_followed_author',
    metadata: { 
      author_id: 4,
    },
    feedable: mockAuthors[3], // Haruki Murakami
    user: mockUsers[4], // novelnerd
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  
  // User review posted (1 day ago)
  {
    id: 7,
    activity_type: 'user_review',
    metadata: { 
      user_book_id: 1,
      rating: 5,
      review: 'A timeless classic! The character development is exceptional.',
    },
    feedable: mockUserBooks[0],
    user: mockUsers[1], // readingfanatic
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 1 day, 1 hour ago
  },
  
  // Author announcement (2 days ago)
  {
    id: 8,
    activity_type: 'author_announcement',
    metadata: { author_id: 2 },
    feedable: mockAuthors[1], // Ernest Hemingway
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  
  // Book release (2 days ago)
  {
    id: 9,
    activity_type: 'book_release',
    metadata: { book_id: 1 },
    feedable: mockBooks[0], // Pride and Prejudice
    created_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 2 days, 2 hours ago
  },
  
  // User added book to reading list (3 days ago)
  {
    id: 10,
    activity_type: 'user_added_book',
    metadata: { 
      user_book_id: 2,
      shelf: 'reading',
    },
    feedable: mockUserBooks[1],
    user: mockUsers[2], // bookworm42
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  
  // Author event (3 days ago)
  {
    id: 11,
    activity_type: 'author_event',
    metadata: { event_id: 1 },
    feedable: mockEvents[0],
    created_at: new Date(Date.now() - 75 * 60 * 60 * 1000).toISOString(), // 3 days, 3 hours ago
  },
  
  // User finished book (4 days ago)
  {
    id: 12,
    activity_type: 'user_finished_book',
    metadata: { 
      user_book_id: 4,
      rating: 4,
      shelf: 'read',
    },
    feedable: mockUserBooks[3],
    user: mockUsers[3], // literarylion
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
  },
]

