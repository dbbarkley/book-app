import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { UserList, ReorderItem } from '../types'

/**
 * Manages a single list — fetching, adding/removing books, reordering, liking.
 * Designed for both the edit screen (owner) and the view screen (any user).
 *
 * @param userId  The owner's user ID
 * @param listId  The list ID, or 'top_10' to fetch-or-create the Top 10 list
 */
export function useUserList(userId: number | undefined, listId: number | 'top_10' | undefined) {
  const [list, setList]     = useState<UserList | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    if (!userId || listId === undefined) return
    setLoading(true)
    setError(null)
    try {
      const data = listId === 'top_10'
        ? await apiClient.getOrCreateTop10List(userId)
        : await apiClient.getUserList(userId, listId)
      setList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list')
    } finally {
      setLoading(false)
    }
  }, [userId, listId])

  useEffect(() => { fetchList() }, [fetchList])

  const addBook = useCallback(async (bookId: number, position?: number) => {
    if (!userId || !list) return
    setSaving(true)
    try {
      const updated = await apiClient.addBookToList(userId, list.id, bookId, position)
      setList(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book')
      throw err
    } finally {
      setSaving(false)
    }
  }, [userId, list])

  const removeBook = useCallback(async (itemId: number) => {
    if (!userId || !list) return
    setSaving(true)
    try {
      const updated = await apiClient.removeBookFromList(userId, list.id, itemId)
      setList(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove book')
      throw err
    } finally {
      setSaving(false)
    }
  }, [userId, list])

  const reorder = useCallback(async (items: ReorderItem[]) => {
    if (!userId || !list) return
    setSaving(true)
    // Optimistic update
    setList((prev) => {
      if (!prev?.items) return prev
      const itemMap = new Map(items.map((i) => [i.id, i.position]))
      const updated = prev.items
        .map((item) => ({ ...item, position: itemMap.get(item.id) ?? item.position }))
        .sort((a, b) => a.position - b.position)
      return { ...prev, items: updated }
    })
    try {
      const updated = await apiClient.reorderList(userId, list.id, items)
      setList(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder list')
      fetchList() // Roll back optimistic update
      throw err
    } finally {
      setSaving(false)
    }
  }, [userId, list, fetchList])

  const toggleLike = useCallback(async () => {
    if (!userId || !list) return
    const wasLiked = list.liked_by_current_user
    // Optimistic update
    setList((prev) => prev ? {
      ...prev,
      liked_by_current_user: !wasLiked,
      likes_count: wasLiked ? prev.likes_count - 1 : prev.likes_count + 1,
    } : prev)
    try {
      const result = wasLiked
        ? await apiClient.unlikeList(userId, list.id)
        : await apiClient.likeList(userId, list.id)
      setList((prev) => prev ? {
        ...prev,
        liked_by_current_user: result.liked,
        likes_count: result.likes_count,
      } : prev)
    } catch (err) {
      // Roll back on error
      setList((prev) => prev ? {
        ...prev,
        liked_by_current_user: wasLiked,
        likes_count: wasLiked ? prev.likes_count + 1 : prev.likes_count - 1,
      } : prev)
      throw err
    }
  }, [userId, list])

  return {
    list,
    loading,
    saving,
    error,
    refresh: fetchList,
    addBook,
    removeBook,
    reorder,
    toggleLike,
  }
}
