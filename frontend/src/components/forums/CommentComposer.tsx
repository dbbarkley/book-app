'use client'

import { useState } from 'react'
import { useCreateComment } from '@book-app/shared/hooks'

interface CommentComposerProps {
  postId: number
  onSuccess?: () => void
  placeholder?: string
}

/**
 * CommentComposer provides a text input for creating new top-level comments.
 * Sticky at the bottom of the Post page for easy access.
 */
export default function CommentComposer({ 
  postId, 
  onSuccess,
  placeholder = "Add a comment..." 
}: CommentComposerProps) {
  const [content, setContent] = useState('')
  const { createComment, loading } = useCreateComment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    try {
      await createComment(postId, content)
      setContent('')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create comment', error)
    }
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-background-card/80 backdrop-blur-md border-t border-border-default z-10">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-background-muted border border-border-default rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none min-h-[48px] max-h-32 text-[15px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:bg-text-muted transition-all shadow-sm flex-shrink-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}

