import { useState, useEffect, useCallback, useRef } from 'react'
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
  searchNow: () => void
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useBookSearch(options: UseBookSearchOptions = {}): UseBookSearchReturn {
  const { debounceMs = 600, initialQuery = '', perPage = 20 } = options

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

  const { cacheSearchResults } = useBooksStore()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        const googleBooks = await searchGoogleBooks(searchQuery, Math.min(perPage, 40))

        const transformedBooks: Book[] = googleBooks.map((gb, index) => ({
          id: -1 * (page * 1000 + index),
          title: gb.title,
          isbn: gb.isbn,
          description: gb.description,
          cover_image_url: gb.cover_image_url,
          release_date: gb.published_date || new Date().toISOString().split('T')[0],
          author_name: gb.authors.join(', '),
          page_count: gb.page_count,
          google_books_id: gb.id,
        }))

        if (page === 1) {
          setBooks(transformedBooks)
        } else {
          setBooks((prev) => [...prev, ...transformedBooks])
        }

        cacheSearchResults(transformedBooks)

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

  // Fire search for initialQuery on mount only
  useEffect(() => {
    if (initialQuery.trim()) performSearch(initialQuery, 1)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // setQuery schedules a debounced search. The timeout is cancelled and restarted
  // on every call, so only the final keystroke in a burst triggers the API call.
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (newQuery.trim()) {
      timeoutRef.current = setTimeout(() => {
        setCurrentPage(1)
        performSearch(newQuery, 1)
      }, debounceMs)
    } else {
      setBooks([])
      setPagination(null)
      setCurrentPage(1)
    }
  }, [performSearch, debounceMs])

  // Cancel any pending debounce and fire immediately — used for Enter key / search button.
  const searchNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (query.trim()) {
      setCurrentPage(1)
      performSearch(query, 1)
    }
  }, [query, performSearch])

  const search = useCallback(
    (searchQuery: string) => {
      setQueryState(searchQuery)
    },
    []
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
    searchNow,
    loadMore,
    hasMore,
  }
}
