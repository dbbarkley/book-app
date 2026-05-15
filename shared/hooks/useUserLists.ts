import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { UserList } from '../types'

/**
 * Fetches all public lists for a given user.
 * Used on profile pages to display another user's (or your own) lists.
 */
export function useUserLists(userId: number | undefined) {
  const [lists, setLists]   = useState<UserList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getUserLists(userId)
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchLists() }, [fetchLists])

  const top10 = lists.find((l) => l.list_type === 'top_10') ?? null

  return { lists, top10, loading, error, refresh: fetchLists }
}
