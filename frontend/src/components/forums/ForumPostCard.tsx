'use client'

import Link from 'next/link'
import type { ForumPost } from '@book-app/shared'
import { formatDate } from '../../utils/format'

interface ForumPostCardProps {
  post: ForumPost
}

/**
 * ForumPostCard displays a single post in the forum detail list.
 * Minimalist, book-like aesthetic focusing on text and readability.
 */
export default function ForumPostCard({ post }: ForumPostCardProps) {
  return (
    <Link
      href={`/forums/${post.forum_id}/posts/${post.id}`}
      className="block p-6 bg-background-card rounded-xl border border-border-default hover:border-primary-400 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs uppercase overflow-hidden">
          {post.user.avatar_url ? (
            <img 
              src={post.user.avatar_url} 
              alt={post.user.username} 
              className="w-full h-full object-cover"
            />
          ) : (
            post.user.username.charAt(0)
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary leading-none">
            {post.user.display_name || post.user.username}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5">
            {formatDate(post.created_at)}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors leading-snug">
        {post.title}
      </h2>

      <p className="text-text-secondary line-clamp-3 mb-4 text-[15px] leading-relaxed italic opacity-90">
        "{post.body}"
      </p>

      <div className="flex items-center gap-4 text-xs text-text-muted font-medium uppercase tracking-wider">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-muted/50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
        </div>
        
        {/* Placeholder for "Most Active" or other metrics */}
        <span className="ml-auto opacity-50">View Post →</span>
      </div>
    </Link>
  )
}

