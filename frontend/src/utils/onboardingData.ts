// Mock data for onboarding workflow
// Provides placeholder genres and authors for development
// Replace with API calls when backend endpoints are ready

import type { Genre, Author } from '@book-app/shared'

/**
 * Mock genres list
 * TODO: Replace with API call to GET /api/v1/genres when backend is ready
 * Expected response: { genres: Genre[] }
 */
export const mockGenres: Genre[] = [
  { id: 'fiction', name: 'Fiction', description: 'Literary works of imagination' },
  { id: 'non-fiction', name: 'Non-Fiction', description: 'Factual and informative works' },
  { id: 'mystery', name: 'Mystery', description: 'Crime and detective stories' },
  { id: 'thriller', name: 'Thriller', description: 'Suspenseful and exciting stories' },
  { id: 'romance', name: 'Romance', description: 'Love stories and romantic fiction' },
  { id: 'sci-fi', name: 'Science Fiction', description: 'Futuristic and speculative fiction' },
  { id: 'fantasy', name: 'Fantasy', description: 'Magical and mythical worlds' },
  { id: 'horror', name: 'Horror', description: 'Scary and suspenseful stories' },
  { id: 'historical', name: 'Historical Fiction', description: 'Stories set in the past' },
  { id: 'biography', name: 'Biography', description: 'Life stories of real people' },
  { id: 'memoir', name: 'Memoir', description: 'Personal accounts and experiences' },
  { id: 'self-help', name: 'Self-Help', description: 'Personal development and growth' },
  { id: 'business', name: 'Business', description: 'Business and entrepreneurship' },
  { id: 'philosophy', name: 'Philosophy', description: 'Philosophical works and ideas' },
  { id: 'poetry', name: 'Poetry', description: 'Poetic works and collections' },
  { id: 'young-adult', name: 'Young Adult', description: 'Books for young adult readers' },
  { id: 'children', name: 'Children\'s Books', description: 'Books for children' },
  { id: 'graphic-novel', name: 'Graphic Novels', description: 'Comics and graphic novels' },
]

/**
 * Mock authors list (subset for development)
 * TODO: Replace with API call to GET /api/v1/authors when backend is ready
 * Expected response: { authors: Author[] }
 */
export const mockAuthors: Author[] = [
  {
    id: 1,
    name: 'Jane Austen',
    bio: 'English novelist known for social commentary',
    avatar_url: undefined,
  },
  {
    id: 2,
    name: 'Ernest Hemingway',
    bio: 'American novelist and short story writer',
    avatar_url: undefined,
  },
  {
    id: 3,
    name: 'Toni Morrison',
    bio: 'American novelist and Nobel Prize winner',
    avatar_url: undefined,
  },
  {
    id: 4,
    name: 'Gabriel García Márquez',
    bio: 'Colombian novelist and Nobel Prize winner',
    avatar_url: undefined,
  },
  {
    id: 5,
    name: 'Maya Angelou',
    bio: 'American poet, memoirist, and civil rights activist',
    avatar_url: undefined,
  },
  {
    id: 6,
    name: 'Haruki Murakami',
    bio: 'Japanese writer known for surrealist fiction',
    avatar_url: undefined,
  },
  {
    id: 7,
    name: 'Chimamanda Ngozi Adichie',
    bio: 'Nigerian writer and feminist',
    avatar_url: undefined,
  },
  {
    id: 8,
    name: 'J.K. Rowling',
    bio: 'British author of the Harry Potter series',
    avatar_url: undefined,
  },
  {
    id: 9,
    name: 'Stephen King',
    bio: 'American author of horror and suspense',
    avatar_url: undefined,
  },
  {
    id: 10,
    name: 'Margaret Atwood',
    bio: 'Canadian poet, novelist, and literary critic',
    avatar_url: undefined,
  },
]

