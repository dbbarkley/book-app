// Generic Follow Hook - Toggle follow/unfollow for any entity type
// Reusable in Next.js and React Native
// Integrates with follows store for state management

import { useState } from 'react'
import { useFollowsStore } from '../store/followsStore'

interface UseFollowResult {
  isFollowing: boolean
  isLoading: boolean
  error: string | null
  toggleFollow: () => Promise<void>
  followId: number | null
}

type FollowableType = 'User' | 'Author' | 'Book'

/**
 * Generic hook for following/unfollowing any entity (User, Author, or Book)
 * Integrates with Zustand follows store for state management
 * 
 * Usage:
 * ```tsx
 * // Follow an author
 * const { isFollowing, isLoading, toggleFollow } = useFollow('Author', authorId)
 * 
 * // Follow a user
 * const { isFollowing, isLoading, toggleFollow } = useFollow('User', userId)
 * 
 * // Follow a book
 * const { isFollowing, isLoading, toggleFollow } = useFollow('Book', bookId)
 * 
 * <button onClick={toggleFollow} disabled={isLoading}>
 *   {isFollowing ? 'Unfollow' : 'Follow'}
 * </button>
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Ensure follows store is properly initialized
 * - Can be used with TouchableOpacity or Pressable components
 * 
 * @param followableType - The type of entity to follow ('User' | 'Author' | 'Book')
 * @param followableId - The ID of the entity to follow
 * @returns Object with follow state and toggle function
 */
export function useFollow(
  followableType: FollowableType | null,
  followableId: number | null
): UseFollowResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isFollowing: checkFollowing, getFollowId, follow, unfollow } = useFollowsStore()

  const isFollowing = followableType && followableId 
    ? checkFollowing(followableType, followableId) 
    : false
  
  const followId = followableType && followableId 
    ? getFollowId(followableType, followableId) 
    : null

  const toggleFollow = async () => {
    if (!followableType || !followableId) {
      setError('Invalid entity type or ID')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isFollowing && followId) {
        await unfollow(followId)
      } else {
        await follow(followableType, followableId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update follow status'
      setError(errorMessage)
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
  }
}

