'use client'

import Link from 'next/link'
import type { Forum } from '@book-app/shared'
import { useFollowForum } from '@book-app/shared/hooks'

interface ForumCardProps {
  forum: Forum
}

/**
 * ForumCard displays a summary of a forum on the index page.
 * Includes basic info: name, description, stats, and a follow button.
 */
export default function ForumCard({ forum }: ForumCardProps) {
  const { followForum, unfollowForum, loading } = useFollowForum()

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (forum.is_following) {
      unfollowForum(forum.id)
    } else {
      followForum(forum.id)
    }
  }

  return (
    <Link
      href={`/forums/${forum.id}`}
      className="block p-5 bg-background-card rounded-xl border border-border-default hover:border-primary-500 transition-colors shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-text-primary leading-tight">
            {forum.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {forum.visibility === 'public_access' ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Public
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Followers Only
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleFollowClick}
          disabled={loading}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            forum.is_following
              ? 'bg-background-muted text-text-secondary border border-border-default hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
          }`}
        >
          {forum.is_following ? 'Following' : 'Follow'}
        </button>
      </div>

      {forum.description && (
        <p className="text-text-secondary text-sm line-clamp-2 mb-4 leading-relaxed">
          {forum.description}
        </p>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border-default/50">
        <div className="flex flex-col">
          <span className="text-text-primary font-bold text-sm">
            {forum.followers_count.toLocaleString()}
          </span>
          <span className="text-text-muted text-[11px] uppercase tracking-wide font-medium">
            Followers
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-primary font-bold text-sm">
            {forum.posts_count.toLocaleString()}
          </span>
          <span className="text-text-muted text-[11px] uppercase tracking-wide font-medium">
            Posts
          </span>
        </div>
      </div>
    </Link>
  )
}

