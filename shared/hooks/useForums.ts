import { useEffect } from 'react'
import { useForumsStore } from '../store/forumsStore'

/**
 * Hook to fetch and manage the list of forums
 */
export const useForums = () => {
  const { forums, loading, error, fetchForums } = useForumsStore()

  useEffect(() => {
    fetchForums()
  }, [fetchForums])

  return {
    forums: Object.values(forums),
    loading,
    error,
    refresh: fetchForums
  }
}

/**
 * Hook to fetch and manage a single forum's details
 */
export const useForum = (forumId: number) => {
  const { forums, loading, error, fetchForum, followForum, unfollowForum } = useForumsStore()
  const forum = forums[forumId]

  useEffect(() => {
    if (forumId) fetchForum(forumId)
  }, [forumId, fetchForum])

  return {
    forum,
    loading,
    error,
    follow: () => followForum(forumId),
    unfollow: () => unfollowForum(forumId)
  }
}

