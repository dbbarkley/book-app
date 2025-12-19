// Follow Author Hook - Toggle follow/unfollow for authors
// Reusable in Next.js and React Native
// Integrates with follows store for state management

import { useState, useEffect } from 'react'
import { useFollowsStore } from '../store/followsStore'
import { useAuthStore } from '../store/authStore'

interface UseFollowAuthorResult {
  isFollowing: boolean
  isLoading: boolean
  error: string | null
  toggleFollow: () => Promise<void>
  followId: number | null
}

/**
 * Hook for following/unfollowing an author
 * Integrates with Zustand follows store for state management
 * 
 * Usage:
 * ```tsx
 * const { isFollowing, isLoading, toggleFollow } = useFollowAuthor(authorId)
 * 
 * <button onClick={toggleFollow} disabled={isLoading}>
 *   {isFollowing ? 'Unfollow' : 'Follow'}
 * </button>
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Ensure follows store is properly initialized
 */
export function useFollowAuthor(authorId: number | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const follows = useFollowsStore((state) => state.follows)
  const { isAuthenticated } = useAuthStore()
  const { follow, unfollow, fetchFollows, isFollowing: checkFollowing, getFollowId } =
    useFollowsStore()

  useEffect(() => {
    if (isAuthenticated && (!Array.isArray(follows) || follows.length === 0)) {
      fetchFollows().catch(() => {
        // store handles errors
      })
    }
  }, [isAuthenticated, fetchFollows, follows])

  const isFollowing = authorId ? checkFollowing('Author', authorId) : false
  const followId = authorId ? getFollowId('Author', authorId) : null

  const toggleFollow = async () => {
    if (authorId === null || authorId === undefined) return

    console.log('toggleFollow called:', { authorId, isFollowing, followId })
    setIsLoading(true)
    setError(null)

    try {
      if (isFollowing && followId) {
        console.log('Calling unfollow:', followId)
        await unfollow(followId)
        console.log('Unfollow successful')
      } else {
        console.log('Calling follow:', { authorId })
        await follow('Author', authorId)
        console.log('Follow successful')
      }
    } catch (err) {
      console.error('toggleFollow error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update follow status')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isFollowing,
    isLoading,
    error,
    toggleFollow,
    followId,
  } as UseFollowAuthorResult
}

