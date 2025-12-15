// Book Search Hook - Search books using Google Books API
// Reusable in Next.js and React Native

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { debounce } from '../utils/debounce'
import { searchBooks as searchGoogleBooks } from '../services/googleBooksService'
import { useBooksStore } from '../store/booksStore'
import type { Book } from '../types'

interface UseBookSearchOptions {
  debounceMs?: number
  initialQuery?: string
  perPage?: number
}

interface UseBookSearchReturn {
  books: Book[]
  pagination: { page: number; per_page: number; total_pages: number; total_count: number } | null
  loading: boolean
  error: string | null
  query: string
  setQuery: (query: string) => void
  search: (query: string) => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

/**
 * Hook for searching books using Google Books API with debouncing
 * 
 * Usage:
 * ```tsx
 * const { books, loading, query, setQuery, search } = useBookSearch()
 * 
 * // In component:
 * <input value={query} onChange={(e) => setQuery(e.target.value)} />
 * ```
 * 
 * For React Native:
 * - Works the same way, just use with TextInput onChangeText
 * - Debouncing works identically
 * 
 * Note: Google Books API has a limit of 40 results per request.
 * Pagination loads more results by making multiple requests.
 */
export function useBookSearch(options: UseBookSearchOptions = {}): UseBookSearchReturn {
  const { debounceMs = 300, initialQuery = '', perPage = 20 } = options

  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<{ 
    page: number
    per_page: number
    total_pages: number
    total_count: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQueryState] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(1)

  // Get cache function from store
  const { cacheSearchResults } = useBooksStore()

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!searchQuery.trim()) {
        setBooks([])
        setPagination(null)
        setCurrentPage(1)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Google Books API returns max 40 results per request
        // We'll fetch perPage results per page
        const googleBooks = await searchGoogleBooks(searchQuery, Math.min(perPage, 40))
        
        // Transform Google Books format to our Book type
        const transformedBooks: Book[] = googleBooks.map((gb, index) => ({
          id: -1 * (page * 1000 + index), // Negative ID to indicate Google Books result
          title: gb.title,
          isbn: gb.isbn,
          description: gb.description,
          cover_image_url: gb.cover_image_url,
          release_date: gb.published_date || new Date().toISOString().split('T')[0],
          author_name: gb.authors.join(', '),
          // Note: Google Books IDs are strings, not numbers
          // When user adds to shelf, we'll create the book in our DB
          google_books_id: gb.id,
        }))

        if (page === 1) {
          setBooks(transformedBooks)
        } else {
          setBooks((prev) => [...prev, ...transformedBooks])
        }
        
        // Cache the results in the store for book detail page
        cacheSearchResults(transformedBooks)
        
        // Google Books doesn't provide total count, so we estimate
        // If we got fewer results than requested, we're on the last page
        const isLastPage = googleBooks.length < perPage
        setPagination({
          page,
          per_page: perPage,
          total_pages: isLastPage ? page : page + 1,
          total_count: isLastPage ? books.length + googleBooks.length : (page + 1) * perPage,
        })
        setCurrentPage(page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search books')
        setBooks([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    },
    [perPage, cacheSearchResults]
  )

  // Create debounced search function using useMemo and useRef for stability
  const debouncedSearchRef = useRef<ReturnType<typeof debounce>>()
  
  const debouncedSearch = useMemo(() => {
    if (debouncedSearchRef.current) {
      // Clear previous timeout if exists
      debouncedSearchRef.current = debounce(performSearch, debounceMs)
    } else {
      debouncedSearchRef.current = debounce(performSearch, debounceMs)
    }
    return debouncedSearchRef.current
  }, [performSearch, debounceMs])

  // Effect to trigger search when query changes
  useEffect(() => {
    if (query.trim()) {
      setCurrentPage(1)
      debouncedSearch(query, 1)
    } else {
      setBooks([])
      setPagination(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
  }, [])

  const search = useCallback(
    async (searchQuery: string) => {
      setQueryState(searchQuery)
      await performSearch(searchQuery, 1)
    },
    [performSearch]
  )

  const loadMore = useCallback(async () => {
    if (!query.trim() || loading || !pagination) return
    const nextPage = currentPage + 1
    if (nextPage <= (pagination.total_pages || 1)) {
      await performSearch(query, nextPage)
    }
  }, [query, currentPage, pagination, loading, performSearch])

  const hasMore = pagination ? currentPage < pagination.total_pages : false

  return {
    books,
    pagination,
    loading,
    error,
    query,
    setQuery,
    search,
    loadMore,
    hasMore,
  }
}

