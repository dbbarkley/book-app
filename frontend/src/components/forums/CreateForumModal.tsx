'use client'

import { useState } from 'react'
import { apiClient } from '@book-app/shared/api/client'

interface CreateForumModalProps {
  onClose: () => void
  onSuccess: () => void
}

/**
 * CreateForumModal allows users to start a new forum.
 */
export default function CreateForumModal({ onClose, onSuccess }: CreateForumModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public_access' | 'private_access'>('public_access')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSaving) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await apiClient.createForum({
        title: title.trim(),
        description: description.trim(),
        visibility: visibility
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to create forum', err)
      setError('Failed to create forum. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-background-card w-full max-w-lg rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-background-muted/30">
          <h3 className="font-bold text-text-primary">Create New Forum</h3>
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
            <label className="block text-sm font-bold text-text-primary mb-1.5">Forum Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Science Fiction Deep Dives"
              required
              autoFocus
              className="w-full bg-background-muted border border-border-default rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-[15px]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-primary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this forum about?"
              rows={3}
              className="w-full bg-background-muted border border-border-default rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none text-[15px]"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-background-muted/50 rounded-xl border border-border-default">
            <input
              type="checkbox"
              id="isPublic"
              checked={visibility === 'public_access'}
              onChange={(e) => setVisibility(e.target.checked ? 'public_access' : 'private_access')}
              className="w-5 h-5 rounded border-border-default text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isPublic" className="flex-1 cursor-pointer">
              <span className="block text-sm font-bold text-text-primary">Public Forum</span>
              <span className="block text-xs text-text-muted">Anyone can see and join this forum.</span>
            </label>
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
              disabled={!title.trim() || isSaving}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSaving ? 'Creating...' : 'Create Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

