import { useState } from 'react'
import { useBooksStore } from '../store/booksStore'
import type { ShelfStatus, UserBook, Visibility } from '../types'

interface UpdateShelfParams {
  userBookId: number
  status: ShelfStatus
  visibility?: Visibility
  dnf_reason?: string
  dnf_page?: number
}

interface UseUpdateBookShelfReturn {
  updateShelf: (params: UpdateShelfParams) => Promise<UserBook>
  loading: boolean
  error: string | null
}

/**
 * Hook for updating an existing user book's status (including DNF metadata).
 */
export function useUpdateBookShelf(): UseUpdateBookShelfReturn {
  const { updateProgress, loading, error } = useBooksStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const updateShelf = async (params: UpdateShelfParams) => {
    setLocalError(null)
    try {
      return await updateProgress(params.userBookId, {
        status: params.status,
        visibility: params.visibility,
        dnf_reason: params.dnf_reason,
        dnf_page: params.dnf_page,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shelf'
      setLocalError(errorMessage)
      throw err
    }
  }

  return {
    updateShelf,
    loading,
    error: error || localError,
  }
}

