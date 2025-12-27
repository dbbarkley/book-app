'use client'

import type { Forum } from '@book-app/shared'
import { useFollowForum } from '@book-app/shared/hooks'

interface ForumHeaderProps {
  forum: Forum
}

/**
 * ForumHeader displays the title, description, and actions at the top of the Forum Detail page.
 */
export default function ForumHeader({ forum }: ForumHeaderProps) {
  const { followForum, unfollowForum, loading } = useFollowForum()

  const handleFollowClick = () => {
    if (forum.is_following) {
      unfollowForum(forum.id)
    } else {
      followForum(forum.id)
    }
  }

  return (
    <div className="py-8 border-b border-border-default mb-6 bg-background-card/50 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight">
              {forum.title}
            </h1>
            {forum.visibility === 'private_access' && (
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Followers Only
              </span>
            )}
          </div>
          
          {forum.description && (
            <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
              {forum.description}
            </p>
          )}

          <div className="flex gap-4 mt-6 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <span className="font-bold text-text-primary">
                {forum.followers_count.toLocaleString()}
              </span>
              <span>followers</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-text-primary">
                {forum.posts_count.toLocaleString()}
              </span>
              <span>posts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFollowClick}
            disabled={loading}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-full font-bold transition-all shadow-md ${
              forum.is_following
                ? 'bg-background-muted text-text-secondary border border-border-default hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
            }`}
          >
            {forum.is_following ? 'Following' : 'Follow Forum'}
          </button>
        </div>
      </div>
    </div>
  )
}

