'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useFollowAuthor, type RecommendedAuthor } from '@book-app/shared'
import Button from './Button'
import Avatar from './Avatar'

interface RecommendedAuthorCardProps {
  recommendation: RecommendedAuthor
}

export default function RecommendedAuthorCard({ recommendation }: RecommendedAuthorCardProps) {
  if (!recommendation || !recommendation.author) {
    return null
  }

  const { author, reason } = recommendation
  const { isFollowing, isLoading, toggleFollow } = useFollowAuthor(author.id)

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFollow()
  }

  return (
    <Link href={`/authors/${author.id}`} className="block h-full group">
      <article className="rounded-2xl p-5 flex flex-col gap-3 w-full h-full transition-all" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
        <div className="flex items-center gap-3">
          <Avatar
            src={author.avatar_url}
            name={author.name}
            size="md"
            className="group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink leading-tight truncate group-hover:text-accent-hover transition-colors">
              {author.name}
            </h3>
            <p className="text-xs text-ink-2 font-medium truncate">Author</p>
          </div>
        </div>

        <p className="text-xs text-ink-2 line-clamp-3 italic flex-1">
          &ldquo;{reason}&rdquo;
        </p>

        <Button
          onClick={handleFollow}
          variant={isFollowing ? 'outline' : 'primary'}
          size="sm"
          isLoading={isLoading}
          className="mt-2 w-full font-bold shadow-sm"
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </article>
    </Link>
  )
}

