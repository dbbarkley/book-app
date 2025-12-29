'use client'

import { useMemo } from 'react'
import { useFollowAuthor, type RecommendedAuthor } from '@book-app/shared'
import Button from './Button'
import Avatar from './Avatar'

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
        <Avatar
          src={author.avatar_url}
          name={author.name}
          size="md"
        />
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

