import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useBooksStore } from '../store/booksStore'
import type { UserBook, Visibility } from '../types'

interface UsePrivateLibraryReturn {
  privateBooks: UserBook[]
  loading: boolean
  error: string | null
  refreshPrivateLibrary: () => Promise<void>
}

export function usePrivateLibrary(): UsePrivateLibraryReturn {
  const { isAuthenticated } = useAuth()
  const { getUserBooks } = useBooksStore()
  const [privateBooks, setPrivateBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshPrivateLibrary = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const books = await getUserBooks({ visibility: 'private' as Visibility })
      setPrivateBooks(books)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load private list')
    } finally {
      setLoading(false)
    }
  }, [getUserBooks, isAuthenticated])

  useEffect(() => {
    refreshPrivateLibrary()
  }, [refreshPrivateLibrary])

  return {
    privateBooks,
    loading,
    error,
    refreshPrivateLibrary,
  }
}

