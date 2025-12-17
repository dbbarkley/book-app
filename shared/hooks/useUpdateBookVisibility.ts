import { useState } from 'react'
import { useBooksStore } from '../store/booksStore'
import type { UserBook, Visibility } from '../types'

interface UseUpdateBookVisibilityReturn {
  setVisibility: (bookId: number, visibility: Visibility) => Promise<UserBook>
  loading: boolean
  error: string | null
}

export function useUpdateBookVisibility(): UseUpdateBookVisibilityReturn {
  const { updateVisibility, loading, error } = useBooksStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const setVisibility = async (bookId: number, visibility: Visibility) => {
    setLocalError(null)
    try {
      return await updateVisibility(bookId, visibility)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update visibility'
      setLocalError(errorMessage)
      throw err
    }
  }

  return {
    setVisibility,
    loading,
    error: error || localError,
  }
}

