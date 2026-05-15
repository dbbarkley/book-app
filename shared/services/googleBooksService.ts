// Google Books API Service
// Provides access to Google Books API for searching authors and books
// Reusable in Next.js and React Native

// Google Books API v1 — proxied through /api/books/search to:
//   • add server-side retry logic for transient 503s
//   • avoid complex field masks that can trigger Google-side errors
//   • enable Next.js server-side caching (60s revalidate)
// Documentation: https://developers.google.com/books/docs/v1/using

import { apiClient } from '../api/client'

// Use an absolute URL when a base is available (browser) so the proxy works
// correctly regardless of how the page is accessed (localhost vs LAN IP).
// React Native: window exists but window.location is undefined — guard both.
const PROXY_BASE =
  typeof window !== 'undefined' && window.location != null
    ? `${window.location.origin}/api/books/search`
    : '/api/books/search'

// In React Native there is no Next.js proxy — detect by checking for location
const IS_NATIVE = typeof window === 'undefined' || window.location == null

/** Build auth headers for the internal Next.js proxy routes. */
function authHeaders(): HeadersInit {
  const token = apiClient.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface GoogleBooksAuthor {
  name: string
  bio?: string
  avatar_url?: string
  books_count?: number
  external_id?: string // Google Books author ID
}

export interface GoogleBooksBook {
  id: string
  title: string
  authors: string[]
  description?: string
  cover_image_url?: string
  published_date?: string
  isbn?: string
  page_count?: number
}

export interface GoogleBooksSearchResult {
  authors: GoogleBooksAuthor[]
  books: GoogleBooksBook[]
  total_results: number
}

/**
 * Extract unique authors from Google Books search results
 * Groups books by author and creates author objects
 */
function extractAuthorsFromBooks(books: any[]): GoogleBooksAuthor[] {
  const authorMap = new Map<string, GoogleBooksAuthor>()

  books.forEach((book) => {
    if (book.volumeInfo?.authors) {
      book.volumeInfo.authors.forEach((authorName: string) => {
        if (!authorMap.has(authorName)) {
          authorMap.set(authorName, {
            name: authorName,
            books_count: 1,
            avatar_url: undefined,
            external_id: undefined,
          })
        } else {
          const author = authorMap.get(authorName)!
          author.books_count = (author.books_count || 0) + 1
        }
      })
    }
  })

  return Array.from(authorMap.values())
}

/**
 * Transform Google Books API book object to our format
 */
function transformBook(book: any): GoogleBooksBook {
  const volumeInfo = book.volumeInfo || {}
  const imageLinks = volumeInfo.imageLinks || {}
  
  return {
    id: book.id,
    title: volumeInfo.title || 'Unknown Title',
    authors: volumeInfo.authors || [],
    description: volumeInfo.description,
    cover_image_url: imageLinks.thumbnail || imageLinks.smallThumbnail,
    published_date: volumeInfo.publishedDate,
    isbn: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
          volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
    page_count: volumeInfo.pageCount,
  }
}

/**
 * Search for authors using Google Books API
 * Searches by author name and returns unique authors with their book counts
 * 
 * @param query - Search query (author name)
 * @param maxResults - Maximum number of results (default: 20, max: 40)
 * @returns Array of unique authors found
 */
export async function searchAuthors(
  query: string,
  maxResults: number = 20
): Promise<GoogleBooksAuthor[]> {
  if (!query.trim()) return []

  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(maxResults * 2, 40)),
      type: 'authors',
    })
    const response = await fetch(`${PROXY_BASE}?${params}`, { headers: authHeaders() })

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`)
    }

    const data = await response.json()
    const books = data.items || []
    return extractAuthorsFromBooks(books).slice(0, maxResults)
  } catch (error) {
    console.error('Error searching Google Books API:', error)
    throw error
  }
}

/**
 * Search for books using Google Books API
 * 
 * @param query - Search query (book title, author, ISBN, etc.)
 * @param maxResults - Maximum number of results (default: 20, max: 40)
 * @returns Array of books
 */
export async function searchBooks(
  query: string,
  maxResults: number = 20
): Promise<GoogleBooksBook[]> {
  if (!query.trim()) return []

  // React Native: no Next.js proxy — go straight to the backend API
  if (IS_NATIVE) {
    const { apiClient } = await import('../api/client')
    const results = await apiClient.searchBooks(query, 1, maxResults)
    // apiClient.searchBooks returns { books, pagination } — extract books array
    const bookList = (results as any).books ?? results
    return (bookList as any[]).map((b: any) => ({
      id:              b.google_books_id ?? String(b.id),
      title:           b.title,
      authors:         b.author_name ? [b.author_name] : [],
      description:     b.description,
      cover_image_url: b.cover_image_url,
      published_date:  b.release_date,
      page_count:      b.page_count,
      genres:          b.genres ?? [],
      isbn:            b.isbn,
    }))
  }

  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(maxResults, 40)),
      type: 'books',
    })
    const response = await fetch(`${PROXY_BASE}?${params}`, { headers: authHeaders() })

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`)
    }

    const data = await response.json()
    return (data.items || []).map(transformBook)
  } catch (error) {
    console.error('Error searching Google Books API:', error)
    throw error
  }
}

/**
 * Get author details from Google Books API
 * Searches for books by author and aggregates information
 * 
 * @param authorName - Author name
 * @returns Author details with books
 */
export async function getAuthorDetails(authorName: string): Promise<{
  author: GoogleBooksAuthor
  books: GoogleBooksBook[]
}> {
  const books = await searchBooks(`inauthor:"${authorName}"`, 10)
  const authors = extractAuthorsFromBooks(books.map((book) => ({
    volumeInfo: {
      authors: book.authors,
    },
  })))

  const author = authors.find((a) => 
    a.name.toLowerCase() === authorName.toLowerCase()
  ) || authors[0] || {
    name: authorName,
    books_count: books.length,
  }

  return {
    author: {
      ...author,
      books_count: books.length,
    },
    books,
  }
}

