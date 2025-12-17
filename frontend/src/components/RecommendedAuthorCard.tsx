'use client'

import { useMemo } from 'react'
import { useFollowAuthor, type RecommendedAuthor } from '@book-app/shared'
import Button from './Button'

interface RecommendedAuthorCardProps {
  recommendation: RecommendedAuthor
}

export default function RecommendedAuthorCard({ recommendation }: RecommendedAuthorCardProps) {
  const { author, reason } = recommendation
  const { isFollowing, isLoading, toggleFollow } = useFollowAuthor(author.id)

  const initials = useMemo(() => {
    return author.name
      .split(' ')
      .map((chunk) => chunk[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [author.name])

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3 min-w-[220px] max-w-xs">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-slate-900 flex items-center justify-center text-lg font-semibold text-white">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">{author.name}</h3>
          <p className="text-sm text-slate-500">Recommended author</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 flex-1">{reason}</p>

      <Button
        onClick={toggleFollow}
        variant={isFollowing ? 'outline' : 'primary'}
        size="md"
        isLoading={isLoading}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    </article>
  )
}

