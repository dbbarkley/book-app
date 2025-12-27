'use client'

import { useEffect, useRef } from 'react'
import type { ForumComment } from '@book-app/shared'
import { useThread } from '@book-app/shared/hooks'
import Comment from './Comment'
import ThreadComposer from './ThreadComposer'

interface ThreadDrawerProps {
  parentComment: ForumComment
  onClose: () => void
}

/**
 * ThreadDrawer provides a Slack-style threaded reply view.
 * It opens in a slide-out panel on desktop and a full-screen view on mobile.
 */
export default function ThreadDrawer({ parentComment, onClose }: ThreadDrawerProps) {
  const { replies, loading, error, refresh } = useThread(parentComment.id)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Handle closing on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-lg bg-background-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-background-muted/30">
          <div>
            <h3 className="font-bold text-text-primary">Thread</h3>
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
              Between you and {parentComment.user.display_name || parentComment.user.username}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-background-muted rounded-full text-text-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Parent Comment (Highlighted) */}
          <div className="mb-8 pb-6 border-b border-border-default/50">
            <Comment comment={parentComment} isReply={false} />
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h4>

            {loading && replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <div className="w-8 h-8 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading thread...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                Failed to load replies. <button onClick={refresh} className="underline font-bold">Try again</button>
              </div>
            ) : (
              replies.map((reply) => (
                <Comment key={reply.id} comment={reply} isReply={true} />
              ))
            )}

            {!loading && replies.length === 0 && (
              <div className="text-center py-12 px-6 border-2 border-dashed border-border-default rounded-xl">
                <p className="text-sm text-text-muted italic">No replies yet. Be the first to chime in!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Composer */}
        <ThreadComposer 
          postId={parentComment.forum_post_id}
          commentId={parentComment.id} 
          onSuccess={refresh}
          placeholder={`Reply to ${parentComment.user.username}...`}
        />
      </div>
    </div>
  )
}

