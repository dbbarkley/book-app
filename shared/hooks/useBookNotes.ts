// useBookNotes — save/update private personal notes on a user_book
// Notes are never exposed to other users; they live only on the owner's user_book record.

import { useState } from 'react'
import { apiClient } from '../api/client'
import type { UserBook } from '../types'

interface UseBookNotesReturn {
  saveNotes: (userBookId: number, notes: string) => Promise<UserBook>
  loading: boolean
  error: string | null
}

export function useBookNotes(): UseBookNotesReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const saveNotes = async (userBookId: number, notes: string): Promise<UserBook> => {
    setLoading(true)
    setError(null)
    try {
      return await apiClient.saveBookNotes(userBookId, notes)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save notes'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { saveNotes, loading, error }
}
