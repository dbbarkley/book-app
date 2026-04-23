'use client'

import Link from 'next/link'
import type { Author } from '@book-app/shared'
import { formatNumber, truncateText } from '../utils/format'
import FollowButton from './FollowButton'
import Avatar from './Avatar'

interface AuthorCardProps {
  author: Author
  showBio?: boolean
  showFollowButton?: boolean
  onFollowToggle?: () => void
}

export default function AuthorCard({
  author,
  showBio = true,
  showFollowButton = false,
  onFollowToggle,
}: AuthorCardProps) {
  return (
    <div
      className="flex gap-4 rounded-[28px] p-5 transition-all"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)' }}
    >
      <Link href={`/authors/${author.id}`} className="flex gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <Avatar
            src={author.avatar_url}
            name={author.name}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-ink mb-1 truncate">{author.name}</h3>
          {showBio && author.bio && (
            <p className="text-sm text-ink-2 mb-2 line-clamp-2">
              {truncateText(author.bio, 120)}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-ink-3">
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
