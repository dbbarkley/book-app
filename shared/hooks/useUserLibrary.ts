import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { UserBook, ShelfStatus } from '../types'

/**
 * Hook to fetch and manage a user's public library
 * 
 * This hook is designed to be React Native friendly by:
 * 1. Using a standard API client
 * 2. Returning plain data and loading/error states
 * 3. Handling data grouping in the hook or component as needed
 * 
 * @param userId The ID of the user whose library to fetch
 */
export function useUserLibrary(userId: number | undefined) {
  const [library, setLibrary] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLibrary = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.getUserLibrary(userId)
      setLibrary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
      console.error('Error fetching user library:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchLibrary()
  }, [fetchLibrary])

  // Group books by shelf
  const groupedLibrary = {
    reading: library.filter(ub => ub.status === 'reading'),
    to_read: library.filter(ub => ub.status === 'to_read'),
    read: library.filter(ub => ub.status === 'read'),
    dnf: library.filter(ub => ub.status === 'dnf'),
  }

  return {
    library,
    groupedLibrary,
    loading,
    error,
    refresh: fetchLibrary
  }
}
