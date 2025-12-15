'use client'

// FollowButton Component - Reusable button for following/unfollowing authors
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import { useState } from 'react'
import { useFollowAuthor } from '@book-app/shared'
import { apiClient } from '@book-app/shared/api/client'
import type { Author } from '@book-app/shared'
import Button from './Button'

interface FollowButtonProps {
  authorId: number
  author?: Author // Optional: Full author object for importing external authors
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  onToggle?: (isFollowing: boolean) => void
}

/**
 * Reusable FollowButton component for authors
 * 
 * Supports auto-importing external authors (ID 0 from Google Books):
 * 1. When user clicks Follow on external author
 * 2. Creates author in database first
 * 3. Then follows the newly created author
 * 
 * Usage:
 * ```tsx
 * <FollowButton authorId={author.id} author={author} />
 * ```
 * 
 * For React Native:
 * - Replace Button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function FollowButton({
  authorId,
  author,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onToggle,
}: FollowButtonProps) {
  const { isFollowing, isLoading, toggleFollow } = useFollowAuthor(authorId)
  const [isImporting, setIsImporting] = useState(false)

  // Check if this is an external author (from Google Books)
  const isExternalAuthor = authorId === 0

  const handleClick = async () => {
    // If external author, import them first
    if (isExternalAuthor && author) {
      console.log('Importing external author:', author.name)
      setIsImporting(true)
      
      try {
        // Create author in database
        const newAuthor = await apiClient.createAuthor({
          name: author.name,
          bio: author.bio,
          avatar_url: author.avatar_url,
          website_url: author.website_url,
        })
        
        console.log('Author imported successfully:', newAuthor)
        
        // Now follow the newly created author
        await apiClient.follow('Author', newAuthor.id)
        
        console.log('Followed imported author')
        
        // Refresh the page or update the author ID
        // For now, just show success message
        alert(`Successfully imported and followed ${author.name}!`)
        
        // Reload to show updated state
        window.location.reload()
      } catch (error) {
        console.error('Failed to import author:', error)
        alert('Failed to import author. They may already exist in the database.')
      } finally {
        setIsImporting(false)
      }
      
      return
    }

    // Normal follow/unfollow for local authors
    console.log('FollowButton clicked:', { authorId, isFollowing })
    try {
      await toggleFollow()
      console.log('Toggle follow successful')
      onToggle?.(!isFollowing)
    } catch (error) {
      // Error is handled by the hook
      console.error('Failed to toggle follow:', error)
    }
  }

  const buttonLoading = isLoading || isImporting

  return (
    <Button
      variant={isFollowing ? 'secondary' : variant}
      size={size}
      fullWidth={fullWidth}
      isLoading={buttonLoading}
      onClick={handleClick}
      disabled={buttonLoading}
      className={className}
      title={isExternalAuthor ? 'Import from Google Books and follow' : undefined}
    >
      {isImporting ? 'Importing...' : isExternalAuthor ? '+ Import & Follow' : isFollowing ? '✓ Following' : '+ Follow'}
    </Button>
  )
}

