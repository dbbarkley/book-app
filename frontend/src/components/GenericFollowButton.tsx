'use client'

/**
 * Generic FollowButton Component
 * 
 * A reusable button for following/unfollowing any entity (User, Author, or Book).
 * Uses the generic useFollow hook for maximum flexibility.
 * 
 * Features:
 * - Works with Users, Authors, and Books
 * - Shows loading state
 * - Shows following/not following state
 * - Customizable size and variant
 * - Mobile-first design
 * - Error handling
 * 
 * Usage:
 * ```tsx
 * // Follow an author
 * <GenericFollowButton type="Author" id={authorId} />
 * 
 * // Follow a user
 * <GenericFollowButton type="User" id={userId} />
 * 
 * // Follow a book
 * <GenericFollowButton type="Book" id={bookId} />
 * 
 * // With custom size and variant
 * <GenericFollowButton 
 *   type="Author" 
 *   id={authorId}
 *   size="sm"
 *   variant="outline"
 * />
 * 
 * // With callback
 * <GenericFollowButton 
 *   type="Author" 
 *   id={authorId}
 *   onToggle={(isFollowing) => console.log('Now following:', isFollowing)}
 * />
 * ```
 * 
 * For React Native:
 * - Replace Button with Pressable or TouchableOpacity
 * - Adjust styling with StyleSheet
 * - Same prop interface and logic
 */

import { useFollow } from '@book-app/shared'
import Button from './Button'

interface GenericFollowButtonProps {
  type: 'User' | 'Author' | 'Book'
  id: number
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  label?: string  // Custom label (e.g., "Author", "User")
  onToggle?: (isFollowing: boolean) => void
}

/**
 * Generic FollowButton component for any entity type
 * 
 * Automatically handles:
 * - Follow state (isFollowing)
 * - Loading state
 * - API calls
 * - Error handling
 * - State persistence
 * 
 * The component uses the useFollow hook which integrates with:
 * - Zustand followsStore for state management
 * - API client for backend communication
 * - LocalStorage for persistence
 */
export default function GenericFollowButton({
  type,
  id,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  label,
  onToggle,
}: GenericFollowButtonProps) {
  const { isFollowing, isLoading, toggleFollow, error } = useFollow(type, id)

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent event bubbling (useful when button is inside a Link)
    e.preventDefault()
    e.stopPropagation()

    try {
      await toggleFollow()
      onToggle?.(!isFollowing)
    } catch (err) {
      // Error is already handled by the hook and stored in error state
      console.error(`Failed to toggle follow for ${type} ${id}:`, err)
    }
  }

  // Determine button text
  const getButtonText = () => {
    if (isFollowing) {
      return '✓ Following'
    }
    if (label) {
      return `+ Follow ${label}`
    }
    return '+ Follow'
  }

  return (
    <div className="inline-block">
      <Button
        variant={isFollowing ? 'secondary' : variant}
        size={size}
        fullWidth={fullWidth}
        isLoading={isLoading}
        onClick={handleClick}
        className={`whitespace-nowrap ${className}`}
        aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${type.toLowerCase()}`}
      >
        {getButtonText()}
      </Button>
      
      {/* Optional: Show error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * React Native Example:
 * 
 * ```tsx
 * import { Pressable, Text, ActivityIndicator, View } from 'react-native'
 * import { useFollow } from '@book-app/shared'
 * 
 * function GenericFollowButton({ type, id }) {
 *   const { isFollowing, isLoading, toggleFollow } = useFollow(type, id)
 * 
 *   return (
 *     <Pressable
 *       onPress={toggleFollow}
 *       disabled={isLoading}
 *       style={({ pressed }) => [
 *         styles.button,
 *         isFollowing && styles.buttonFollowing,
 *         pressed && styles.buttonPressed
 *       ]}
 *     >
 *       {isLoading ? (
 *         <ActivityIndicator color="#fff" />
 *       ) : (
 *         <Text style={styles.buttonText}>
 *           {isFollowing ? '✓ Following' : '+ Follow'}
 *         </Text>
 *       )}
 *     </Pressable>
 *   )
 * }
 * 
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: '#4F46E5',
 *     paddingHorizontal: 16,
 *     paddingVertical: 8,
 *     borderRadius: 6,
 *   },
 *   buttonFollowing: {
 *     backgroundColor: '#6B7280',
 *   },
 *   buttonPressed: {
 *     opacity: 0.7,
 *   },
 *   buttonText: {
 *     color: '#fff',
 *     fontWeight: '600',
 *   },
 * })
 * ```
 */

