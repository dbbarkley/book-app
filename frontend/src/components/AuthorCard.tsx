'use client'

// AuthorCard Component - Reusable card for displaying author information
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import Link from 'next/link'
import type { Author } from '@book-app/shared'
import { formatNumber, truncateText } from '../utils/format'
import FollowButton from './FollowButton'

interface AuthorCardProps {
  author: Author
  showBio?: boolean
  showFollowButton?: boolean
  onFollowToggle?: () => void
}

/**
 * Reusable AuthorCard component for displaying author information
 * 
 * Usage:
 * ```tsx
 * <AuthorCard author={author} showFollowButton />
 * ```
 * 
 * For React Native:
 * - Replace Link with TouchableOpacity and navigation
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function AuthorCard({
  author,
  showBio = true,
  showFollowButton = false,
  onFollowToggle,
}: AuthorCardProps) {
  return (
    <div className="flex gap-4 bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-shadow">
      <Link href={`/authors/${author.id}`} className="flex gap-4 flex-1 min-w-0">
        {author.avatar_url && (
          <div className="flex-shrink-0">
            <img
              src={author.avatar_url}
              alt={author.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{author.name}</h3>
          {showBio && author.bio && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
              {truncateText(author.bio, 120)}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {author.books_count !== undefined && (
              <span>{formatNumber(author.books_count)} books</span>
            )}
            {author.events_count !== undefined && author.events_count > 0 && (
              <span>{formatNumber(author.events_count)} events</span>
            )}
            {author.followers_count !== undefined && (
              <span>{formatNumber(author.followers_count)} followers</span>
            )}
          </div>
        </div>
      </Link>
      {showFollowButton && (
        <div className="flex-shrink-0 flex items-center">
          <FollowButton 
            authorId={author.id} 
            author={author} 
            size="sm" 
            onToggle={onFollowToggle} 
          />
        </div>
      )}
    </div>
  )
}

