'use client'

import { useEffect } from 'react'
import { useRecommendationsStore } from '../store/recommendationsStore'

/**
 * Hook for recommended books data
 * Caches results in Zustand for cross-platform reuse
 */
export function useRecommendedBooks() {
  const { books, booksLoading, booksError, fetchBooks, refresh } = useRecommendationsStore((state) => ({
    books: state.books,
    booksLoading: state.booksLoading,
    booksError: state.booksError,
    fetchBooks: state.fetchBooks,
    refresh: state.refresh,
  }))

  useEffect(() => {
    fetchBooks().catch((error) => {
      console.warn('Failed to load recommended books', error)
    })
  }, [fetchBooks])

  return {
    books,
    loading: booksLoading,
    error: booksError,
    refresh: refresh,
  }
}

