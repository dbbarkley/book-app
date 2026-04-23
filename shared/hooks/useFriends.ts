// useFriends — full friends list + pending incoming requests + actions
// Used on /friends page and notification badge

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { User, FriendRequest } from '../types'

interface UseFriendsReturn {
  friends: User[]
  pendingRequests: FriendRequest[]
  loading: boolean
  pendingLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  acceptRequest: (friendshipId: number) => Promise<void>
  declineRequest: (friendshipId: number) => Promise<void>
  removeFriend: (friendshipId: number, userId: number) => Promise<void>
}

export function useFriends(): UseFriendsReturn {
  const [friends, setFriends]                 = useState<User[]>([])
  const [pendingRequests, setPendingRequests]  = useState<FriendRequest[]>([])
  const [loading, setLoading]                 = useState(true)
  const [pendingLoading, setPendingLoading]   = useState(true)
  const [error, setError]                     = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setPendingLoading(true)
    setError(null)
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiClient.getFriends(),
        apiClient.getPendingFriendRequests(),
      ])
      setFriends(friendsData)
      setPendingRequests(requestsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends')
    } finally {
      setLoading(false)
      setPendingLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const acceptRequest = useCallback(async (friendshipId: number) => {
    await apiClient.acceptFriendRequest(friendshipId)
    // Move from pending to friends list
    const accepted = pendingRequests.find((r: FriendRequest) => r.id === friendshipId)
    if (accepted) {
      setPendingRequests((prev: FriendRequest[]) => prev.filter((r: FriendRequest) => r.id !== friendshipId))
      setFriends((prev: User[]) => [...prev, accepted.requester as User])
    }
  }, [pendingRequests])

  const declineRequest = useCallback(async (friendshipId: number) => {
    await apiClient.declineFriendRequest(friendshipId)
    setPendingRequests((prev: FriendRequest[]) => prev.filter((r: FriendRequest) => r.id !== friendshipId))
  }, [])

  const removeFriend = useCallback(async (friendshipId: number, userId: number) => {
    await apiClient.removeFriend(friendshipId)
    setFriends((prev: User[]) => prev.filter((f: User) => f.id !== userId))
  }, [])

  return {
    friends,
    pendingRequests,
    loading,
    pendingLoading,
    error,
    refetch: fetchAll,
    acceptRequest,
    declineRequest,
    removeFriend,
  }
}
