import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { ShelfStatus } from '../types'

interface FriendOnShelf {
  id: number
  username: string
  display_name?: string
  avatar_url?: string
  status: ShelfStatus
}

export function useBookFriends(bookId: number | undefined) {
  const [friends, setFriends] = useState<FriendOnShelf[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    if (!bookId || bookId < 0) return

    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getBookFriends(bookId)
      setFriends(data)
    } catch (err) {
      console.error('Error fetching book friends:', err)
      setError('Failed to load friends on shelf')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return {
    friends,
    loading,
    error,
    refresh: fetchFriends
  }
}

