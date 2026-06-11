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
  { id: 'fiction',       name: 'Fiction',        description: 'Imagined worlds' },
  { id: 'non-fiction',   name: 'Non-Fiction',    description: 'Factual & true' },
  { id: 'mystery',       name: 'Mystery',        description: 'Whodunits' },
  { id: 'thriller',      name: 'Thriller',       description: 'Pulse-quickening' },
  { id: 'romance',       name: 'Romance',        description: 'Love stories' },
  { id: 'sci-fi',        name: 'Sci-Fi',         description: 'Future, machines, stars' },
  { id: 'fantasy',       name: 'Fantasy',        description: 'Magic & myth' },
  { id: 'horror',        name: 'Horror',         description: 'Read with the light on' },
  { id: 'historical',    name: 'Historical',     description: 'Set in the past' },
  { id: 'biography',     name: 'Biography',      description: 'Real lives' },
  { id: 'memoir',        name: 'Memoir',         description: 'Personal accounts' },
  { id: 'self-help',     name: 'Self-Help',      description: 'Personal growth' },
  { id: 'business',      name: 'Business',       description: 'Work, money, ideas' },
  { id: 'philosophy',    name: 'Philosophy',     description: 'Big ideas' },
  { id: 'poetry',        name: 'Poetry',         description: 'Verse & collections' },
  { id: 'young-adult',   name: 'Young Adult',    description: 'Coming of age' },
  { id: 'children',      name: "Children's",     description: 'For little readers' },
  { id: 'graphic-novel', name: 'Graphic Novels', description: 'Comics & illustrated' },
]

/**
 * Mock authors list (subset for development)
 * TODO: Replace with API call to GET /api/v1/authors when backend is ready
 * Expected response: { authors: Author[] }
 */
export const mockAuthors: Author[] = [
  { id: 1,  name: 'Jane Austen',               bio: 'English novelist, sharp social satire',       avatar_url: undefined },
  { id: 2,  name: 'Ernest Hemingway',           bio: 'American, sparse and aching',                 avatar_url: undefined },
  { id: 3,  name: 'Toni Morrison',              bio: 'American, Nobel laureate, unforgettable',     avatar_url: undefined },
  { id: 4,  name: 'Gabriel García Márquez',     bio: 'Colombian, magical realism',                  avatar_url: undefined },
  { id: 5,  name: 'Maya Angelou',               bio: 'Poet, memoirist, activist',                   avatar_url: undefined },
  { id: 6,  name: 'Haruki Murakami',            bio: 'Japanese, surreal and solitary',              avatar_url: undefined },
  { id: 7,  name: 'Chimamanda Ngozi Adichie',   bio: 'Nigerian, feminist, essential',               avatar_url: undefined },
  { id: 8,  name: 'J.K. Rowling',               bio: 'British, built a generation\'s childhood',   avatar_url: undefined },
  { id: 9,  name: 'Stephen King',               bio: 'American, master of the dark',                avatar_url: undefined },
  { id: 10, name: 'Margaret Atwood',            bio: 'Canadian, feminist, prescient',               avatar_url: undefined },
]

