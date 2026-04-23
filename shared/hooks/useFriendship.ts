// useFriendship — friendship status + actions with a specific user
// Used on profile pages to show the correct FriendButton state

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { FriendshipStatus } from '../types'

interface UseFriendshipReturn {
  status: FriendshipStatus
  friendshipId: number | null
  loading: boolean
  sending: boolean
  sendRequest: () => Promise<void>
  acceptRequest: () => Promise<void>
  declineRequest: () => Promise<void>
  removeFriend: () => Promise<void>
}

export function useFriendship(
  userId: number | null,
  initialStatus?: FriendshipStatus,
  initialFriendshipId?: number | null
): UseFriendshipReturn {
  const [status, setStatus]           = useState<FriendshipStatus>(initialStatus ?? 'none')
  const [friendshipId, setFriendshipId] = useState<number | null>(initialFriendshipId ?? null)
  const [loading, setLoading]         = useState(false)
  const [sending, setSending]         = useState(false)

  // Re-sync if initial values change (e.g. profile data loads after mount)
  useEffect(() => {
    if (initialStatus !== undefined) setStatus(initialStatus)
    if (initialFriendshipId !== undefined) setFriendshipId(initialFriendshipId ?? null)
  }, [initialStatus, initialFriendshipId])

  const sendRequest = useCallback(async () => {
    if (!userId) return
    setSending(true)
    try {
      const friendship = await apiClient.sendFriendRequest(userId)
      setStatus(friendship.status === 'accepted' ? 'accepted' : 'pending_sent')
      setFriendshipId(friendship.id)
    } finally {
      setSending(false)
    }
  }, [userId])

  const acceptRequest = useCallback(async () => {
    if (!friendshipId) return
    setSending(true)
    try {
      const friendship = await apiClient.acceptFriendRequest(friendshipId)
      setStatus('accepted')
      setFriendshipId(friendship.id)
    } finally {
      setSending(false)
    }
  }, [friendshipId])

  const declineRequest = useCallback(async () => {
    if (!friendshipId) return
    setSending(true)
    try {
      await apiClient.declineFriendRequest(friendshipId)
      setStatus('none')
      setFriendshipId(null)
    } finally {
      setSending(false)
    }
  }, [friendshipId])

  const removeFriend = useCallback(async () => {
    if (!friendshipId) return
    setSending(true)
    try {
      await apiClient.removeFriend(friendshipId)
      setStatus('none')
      setFriendshipId(null)
    } finally {
      setSending(false)
    }
  }, [friendshipId])

  return {
    status,
    friendshipId,
    loading,
    sending,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  }
}
