// Book Progress Hook - Update reading progress (pages, percentage)
// Reusable in Next.js and React Native

import { useState } from 'react'
import { useBooksStore } from '../store/booksStore'
import type { BookShelf, UserBook } from '../types'

interface UpdateProgressParams {
  shelf?: BookShelf
  pages_read?: number
  total_pages?: number
  completion_percentage?: number
}

interface UseBookProgressReturn {
  updateProgress: (bookId: number, updates: UpdateProgressParams) => Promise<UserBook>
  loading: boolean
  error: string | null
}

/**
 * Hook for updating reading progress
 * 
 * Usage:
 * ```tsx
 * const { updateProgress, loading } = useBookProgress()
 * 
 * // Update pages read
 * await updateProgress(bookId, { pages_read: 100, total_pages: 300 })
 * 
 * // Update completion percentage
 * await updateProgress(bookId, { completion_percentage: 50 })
 * 
 * // Change shelf
 * await updateProgress(bookId, { shelf: 'reading' })
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Automatically syncs with Zustand store and backend
 */
export function useBookProgress(): UseBookProgressReturn {
  const { updateProgress: updateProgressStore, loading, error } = useBooksStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const updateProgress = async (bookId: number, updates: UpdateProgressParams) => {
    setLocalError(null)
    try {
      return await updateProgressStore(bookId, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress'
      setLocalError(errorMessage)
      throw err
    }
  }

  return {
    updateProgress,
    loading,
    error: error || localError,
  }
}

