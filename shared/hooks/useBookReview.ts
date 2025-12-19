// Book Review Hook - Save rating and review
// Reusable in Next.js and React Native

import { useState } from 'react'
import { useBooksStore } from '../store/booksStore'
import type { UserBook } from '../types'

interface UseBookReviewReturn {
  saveReview: (userBookId: number, rating: number, review?: string) => Promise<UserBook>
  loading: boolean
  error: string | null
}

/**
 * Hook for saving book reviews (rating and optional review text)
 * 
 * Usage:
 * ```tsx
 * const { saveReview, loading } = useBookReview()
 * 
 * // Save rating only
 * await saveReview(bookId, 5)
 * 
 * // Save rating and review
 * await saveReview(bookId, 5, 'Amazing book!')
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Automatically syncs with Zustand store and backend
 * 
 * Note: This is a placeholder feature. The backend endpoint
 * `/user/books/:id/review` needs to be implemented.
 */
export function useBookReview(): UseBookReviewReturn {
  const { saveReview: saveReviewStore, loading, error } = useBooksStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const saveReview = async (userBookId: number, rating: number, review?: string) => {
    setLocalError(null)
    try {
      return await saveReviewStore(bookId, rating, review)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save review'
      setLocalError(errorMessage)
      throw err
    }
  }

  return {
    saveReview,
    loading,
    error: error || localError,
  }
}

