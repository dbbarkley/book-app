'use client'

import React, { useState } from 'react'
import { useForumsStore } from '@/shared/store/forumsStore'
import PostCard from './PostCard'
import { useComments } from '@/shared/hooks/useForumComments'

interface ThreadRepliesProps {
  postId: number
}

/**
 * ThreadReplies handles displaying and creating 1st-level replies to a forum post.
 * Features: Inline composer, list of replies, no nesting allowed.
 */
const ThreadReplies: React.FC<ThreadRepliesProps> = ({ postId }) => {
  const { comments, loading, refresh } = useComments(postId)
  const { createComment } = useForumsStore()
  const [replyBody, setReplyBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyBody.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createComment(postId, replyBody)
      setReplyBody('')
      refresh() // Refresh to get the new comment
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* List of existing replies */}
      <div className="space-y-1">
        {loading && comments.length === 0 ? (
          <div className="py-4 text-sm text-gray-400">Loading replies...</div>
        ) : (
          comments.filter(c => c && c.id).map((comment) => (
            <PostCard key={comment.id} item={comment} isReply={true} />
          ))
        )}
      </div>

      {/* Inline Reply Composer */}
      <form onSubmit={handleSubmit} className="mt-4 pl-4 ml-4 border-l-2 border-gray-100">
        <div className="flex flex-col gap-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            className="w-full min-h-[60px] p-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-gray-200 focus:ring-0 transition-all resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit(e)
              }
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!replyBody.trim() || isSubmitting}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !replyBody.trim() || isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isSubmitting ? 'Replying...' : 'Reply'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ThreadReplies

