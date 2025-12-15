// Book Details Hook - Fetch book details and user's reading status
// Reusable in Next.js and React Native
// Handles both local DB books and Google Books API results

import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { useBooksStore } from '../store/booksStore'
import type { Book, UserBook } from '../types'

interface UseBookDetailsReturn {
  book: Book | null
  userBook: UserBook | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching book details and user's reading status
 * 
 * Usage:
 * ```tsx
 * const { book, userBook, loading } = useBookDetails(bookId)
 * 
 * // book contains the book details (from DB or passed in)
 * // userBook contains user's shelf, progress, rating, etc.
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Automatically syncs with Zustand store
 */
export function useBookDetails(
  bookIdOrBook: number | Book | null
): UseBookDetailsReturn {
  const [book, setBook] = useState<Book | null>(
    typeof bookIdOrBook === 'object' ? bookIdOrBook : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { fetchUserBook, getUserBookByBookId, getSearchResult } = useBooksStore()
  
  // Get book ID (handle both number ID and Book object)
  const bookId = typeof bookIdOrBook === 'number' 
    ? bookIdOrBook 
    : bookIdOrBook?.id || null

  const userBook = bookId && bookId > 0 ? getUserBookByBookId(bookId) : null

  const fetchBook = async () => {
    // If we received a Book object, use it (Google Books result)
    if (typeof bookIdOrBook === 'object' && bookIdOrBook) {
      setBook(bookIdOrBook)
      setLoading(false)
      return
    }

    if (!bookId) {
      setBook(null)
      return
    }

    // Negative IDs indicate Google Books results (not in our DB yet)
    if (bookId < 0) {
      // Try to get from search results cache
      const cachedBook = getSearchResult(bookId)
      if (cachedBook) {
        setBook(cachedBook)
        setLoading(false)
      } else {
        setError('Book not found. Please search again.')
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Fetch book details from our database
      const bookData = await apiClient.getBook(bookId)
      setBook(bookData)

      // Fetch user's book status (if authenticated)
      // This will return null if book is not on user's shelf
      try {
        await fetchUserBook(bookId)
      } catch (err) {
        // Not an error - book just isn't on user's shelf yet
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch book details')
      setBook(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBook()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  return {
    book,
    userBook,
    loading,
    error,
    refetch: fetchBook,
  }
}

