'use client'

import React, { useState } from 'react'
import { useForumsStore } from '@/shared/store/forumsStore'

interface NewPostComposerProps {
  forumId: number
  isFollowing: boolean
}

/**
 * NewPostComposer allows users to create new posts in a forum.
 * Logic: Slack-style input where the post is created on button click or Ctrl+Enter.
 * Automatically follows the forum if the user isn't already following.
 */
const NewPostComposer: React.FC<NewPostComposerProps> = ({ forumId, isFollowing }) => {
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createPost, followForum } = useForumsStore()

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!body.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Create the post
      await createPost(forumId, { body })
      
      // Automatically follow if not already following
      if (!isFollowing) {
        await followForum(forumId)
      }
      
      setBody('')
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start a discussion..."
            className="w-full min-h-[100px] p-4 text-gray-900 placeholder-gray-400 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-gray-200 focus:ring-0 transition-all resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit()
              }
            }}
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Your post will be visible to members of this forum. 
              Submitting will automatically follow this forum.
            </p>
            
            <button
              type="submit"
              disabled={!body.trim() || isSubmitting}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !body.trim() || isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPostComposer

