'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForumPost, useComments } from '@book-app/shared/hooks'
import Comment from '../../../../../components/forums/Comment'
import CommentComposer from '../../../../../components/forums/CommentComposer'
import ThreadDrawer from '../../../../../components/forums/ThreadDrawer'
import { formatDate } from '../../../../../utils/format'
import type { ForumComment } from '@book-app/shared'

/**
 * ForumPostDetail Page - Displays the full content of a post and its comments.
 * Handles the opening of threaded replies in a side drawer.
 */
export default function ForumPostDetail() {
  const params = useParams()
  const router = useRouter()
  const forumId = Number(params.forumId)
  const postId = Number(params.postId)

  const { post, loading: postLoading, error: postError } = useForumPost(postId)
  const { comments, loading: commentsLoading, refresh: refreshComments } = useComments(postId)
  
  const [activeThread, setActiveThread] = useState<ForumComment | null>(null)

  if (postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted font-medium">Loading conversation...</p>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Post not found</h2>
        <p className="text-text-secondary mb-6">{postError || "This conversation may have been deleted or moved."}</p>
        <button onClick={() => router.push(`/forums/${forumId}`)} className="text-primary-600 font-bold hover:underline">
          Return to Forum
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32">
      {/* Back Button */}
      <button 
        onClick={() => router.push(`/forums/${forumId}`)}
        className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary-600 transition-colors py-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to {post.forum?.title || 'Forum'}
      </button>

      {/* Post Content */}
      <article className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300">
            {post.user.avatar_url ? (
              <img src={post.user.avatar_url} alt={post.user.username} className="w-full h-full object-cover rounded-full" />
            ) : (
              post.user.username.charAt(0)
            )}
          </div>
          <div>
            <div className="font-bold text-text-primary">
              {post.user.display_name || post.user.username}
            </div>
            <div className="text-xs text-text-muted">
              Posted {formatDate(post.created_at)}
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-6 leading-tight">
          {post.body?.split("\n")[0]?.slice(0, 100) || 'Conversation'}...
        </h1>

        <div className="text-lg text-text-primary whitespace-pre-wrap leading-relaxed italic border-l-4 border-primary-500 pl-6 py-2 bg-background-muted/20 rounded-r-xl">
          "{post.body}"
        </div>
      </article>

      <div className="border-t border-border-default pt-10">
        <h3 className="text-xl font-bold text-text-primary mb-8 flex items-center gap-2">
          Comments
          <span className="text-sm font-medium text-text-muted bg-background-muted px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </h3>

        <div className="space-y-4">
          {comments.filter(c => !!c && !!c.id).map(comment => (
            <Comment 
              key={comment.id} 
              comment={comment} 
              onReplyClick={() => setActiveThread(comment)} 
            />
          ))}

          {!commentsLoading && comments.length === 0 && (
            <div className="text-center py-12 bg-background-muted/20 rounded-2xl border-2 border-dashed border-border-default">
              <p className="text-text-muted italic">No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Composer */}
      <CommentComposer postId={postId} onSuccess={refreshComments} />

      {/* Thread Drawer */}
      {activeThread && (
        <ThreadDrawer 
          parentComment={activeThread} 
          onClose={() => {
            setActiveThread(null)
            refreshComments() // Refresh to update reply counts
          }} 
        />
      )}
    </div>
  )
}
