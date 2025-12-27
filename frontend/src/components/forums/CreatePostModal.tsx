'use client'

import { useState } from 'react'
import { apiClient } from '@book-app/shared/api/client'

interface CreatePostModalProps {
  forumId: number
  onClose: () => void
  onSuccess: () => void
}

/**
 * CreatePostModal allows users to start a new conversation within a forum.
 */
export default function CreatePostModal({ forumId, onClose, onSuccess }: CreatePostModalProps) {
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || isSaving) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await apiClient.createForumPost(forumId, {
        body: body.trim()
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to create post', err)
      setError('Failed to create post. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-background-card w-full max-w-lg rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-background-muted/30">
          <h3 className="font-bold text-text-primary">Start a Conversation</h3>
          <button onClick={onClose} className="p-1 hover:bg-background-muted rounded-full text-text-muted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-text-primary mb-1.5">What's on your mind?</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Admit your reading sins, ask for recommendations, or share a hot take..."
              rows={6}
              required
              autoFocus
              className="w-full bg-background-muted border border-border-default rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none text-[15px]"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-text-secondary hover:bg-background-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!body.trim() || isSaving}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSaving ? 'Posting...' : 'Post to Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

