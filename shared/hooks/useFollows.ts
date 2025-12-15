// Follows Hook - Wrapper around follows store for easier React usage
// Reusable in Next.js and React Native

import { useEffect } from 'react'
import { useFollowsStore } from '../store/followsStore'
import { useAuthStore } from '../store/authStore'

/**
 * Hook for follows state and actions
 * Uses Zustand store for state management
 * 
 * Usage:
 * ```tsx
 * const { follows, isFollowing, follow, unfollow } = useFollows()
 * 
 * useEffect(() => {
 *   if (isAuthenticated) {
 *     fetchFollows()
 *   }
 * }, [isAuthenticated])
 * ```
 */
export function useFollows() {
  const store = useFollowsStore()
  const { isAuthenticated } = useAuthStore()

  // Fetch follows when authenticated
  useEffect(() => {
    if (isAuthenticated && Array.isArray(store.follows) && store.follows.length === 0) {
      store.fetchFollows().catch(() => {
        // Error handled by store
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  return {
    follows: store.follows || [],
    loading: store.loading,
    error: store.error,
    fetchFollows: store.fetchFollows,
    follow: store.follow,
    unfollow: store.unfollow,
    isFollowing: store.isFollowing,
    getFollowId: store.getFollowId,
  }
}
