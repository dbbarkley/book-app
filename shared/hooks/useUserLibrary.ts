import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useBooksStore } from '../store/booksStore'
import type { ShelfStatus, UserBook, Visibility } from '../types'

interface LibraryState {
  toReadBooks: UserBook[]
  readingBooks: UserBook[]
  readBooks: UserBook[]
  dnfBooks: UserBook[]
}

interface UseUserLibraryReturn extends LibraryState {
  loading: boolean
  error: string | null
  refreshLibrary: () => Promise<void>
}

/**
 * Hook that keeps the logged-in user's library grouped by shelf/status.
 * DNF books stay separate so they aren’t mistakenly counted as “read.”
 */
export function useUserLibrary(): UseUserLibraryReturn {
  const { isAuthenticated } = useAuth()
  const { getUserBooks } = useBooksStore()
  const [library, setLibrary] = useState<LibraryState>({
    toReadBooks: [],
    readingBooks: [],
    readBooks: [],
    dnfBooks: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshLibrary = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const books = await getUserBooks({ visibility: 'public' as Visibility })
      setLibrary({
        toReadBooks: books.filter((ub) => ub.status === 'to_read'),
        readingBooks: books.filter((ub) => ub.status === 'reading'),
        readBooks: books.filter((ub) => ub.status === 'read'),
        dnfBooks: books.filter((ub) => ub.status === 'dnf'),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }, [getUserBooks, isAuthenticated])

  useEffect(() => {
    refreshLibrary()
  }, [refreshLibrary])

  return {
    ...library,
    loading,
    error,
    refreshLibrary,
  }
}

