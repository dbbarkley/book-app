'use client'

import { useState } from 'react'
import { useCreateReply } from '@book-app/shared/hooks'

interface ThreadComposerProps {
  postId: number
  commentId: number
  onSuccess?: () => void
  placeholder?: string
}

/**
 * ThreadComposer provides a text input for replying to a comment in a thread.
 */
export default function ThreadComposer({ 
  postId,
  commentId, 
  onSuccess,
  placeholder = "Reply to thread..." 
}: ThreadComposerProps) {
  const [content, setContent] = useState('')
  const { createReply, loading } = useCreateReply()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    try {
      await createReply(postId, commentId, content)
      setContent('')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create reply', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-background-muted/30 border-t border-border-default">
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-background-card border border-border-default rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none min-h-[40px] max-h-24 text-sm"
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
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors h-[40px]"
      >
        {loading ? '...' : 'Send'}
      </button>
    </form>
  )
}

