import { apiClient } from '../api/client'

export interface GoogleBooksAuthor {
  name: string
  bio?: string
  avatar_url?: string
  books_count?: number
  external_id?: string
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

function transformBook(item: any): GoogleBooksBook {
  const v = item.volumeInfo || {}
  return {
    id:              item.id,
    title:           v.title || 'Unknown Title',
    authors:         v.authors || [],
    description:     v.description,
    cover_image_url: v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail,
    published_date:  v.publishedDate,
    isbn:            v.industryIdentifiers?.find((x: any) => x.type === 'ISBN_13')?.identifier ||
                     v.industryIdentifiers?.find((x: any) => x.type === 'ISBN_10')?.identifier,
    page_count:      v.pageCount,
  }
}

function extractAuthorsFromBooks(items: any[]): GoogleBooksAuthor[] {
  const authorMap = new Map<string, GoogleBooksAuthor>()
  items.forEach(item => {
    (item.volumeInfo?.authors || []).forEach((name: string) => {
      const existing = authorMap.get(name)
      if (existing) {
        existing.books_count = (existing.books_count || 0) + 1
      } else {
        authorMap.set(name, { name, books_count: 1 })
      }
    })
  })
  return Array.from(authorMap.values())
}

export async function searchBooks(query: string, maxResults: number = 20): Promise<GoogleBooksBook[]> {
  if (!query.trim()) return []
  try {
    const { items } = await apiClient.searchExternal(query, maxResults, 'books')
    return items.map(transformBook)
  } catch (error) {
    console.error('Error searching books:', error)
    throw error
  }
}

export async function searchAuthors(query: string, maxResults: number = 20): Promise<GoogleBooksAuthor[]> {
  if (!query.trim()) return []
  try {
    const { items } = await apiClient.searchExternal(query, maxResults * 2, 'authors')
    return extractAuthorsFromBooks(items).slice(0, maxResults)
  } catch (error) {
    console.error('Error searching authors:', error)
    throw error
  }
}

export async function getAuthorDetails(authorName: string): Promise<{ author: GoogleBooksAuthor; books: GoogleBooksBook[] }> {
  const books = await searchBooks(`inauthor:"${authorName}"`, 10)
  const authors = extractAuthorsFromBooks(books.map(b => ({ volumeInfo: { authors: b.authors } })))
  const author = authors.find(a => a.name.toLowerCase() === authorName.toLowerCase()) ||
                 authors[0] || { name: authorName, books_count: books.length }
  return { author: { ...author, books_count: books.length }, books }
}
