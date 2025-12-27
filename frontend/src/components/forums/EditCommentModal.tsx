'use client'

import { useState } from 'react'

interface EditCommentModalProps {
  initialContent: string
  onSave: (newContent: string) => Promise<void>
  onClose: () => void
}

/**
 * EditCommentModal allows users to edit their own comments or replies.
 */
export default function EditCommentModal({ 
  initialContent, 
  onSave, 
  onClose 
}: EditCommentModalProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim() || isSaving) return
    setIsSaving(true)
    try {
      await onSave(content)
      onClose()
    } catch (error) {
      console.error('Failed to update comment', error)
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-background-card w-full max-w-lg rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-background-muted/30">
          <h3 className="font-bold text-text-primary">Edit Comment</h3>
          <button onClick={onClose} className="p-1 hover:bg-background-muted rounded-full text-text-muted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            autoFocus
            className="w-full bg-background-muted border border-border-default rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none text-[15px]"
          />
        </div>

        <div className="p-4 bg-background-muted/30 border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-background-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || content === initialContent || isSaving}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

