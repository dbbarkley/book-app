'use client'

import React, { useState } from 'react'
import { ForumPost, ForumComment } from '@/shared/types'
import { useForumsStore } from '@/shared/store/forumsStore'
import { formatRelativeTime } from '@/utils/format'
import ThreadReplies from './ThreadReplies'

interface PostCardProps {
  item: ForumPost | ForumComment
  isReply?: boolean
}

/**
 * PostCard displays a single forum post or reply.
 * Features: Avatar, metadata, body text, heart button, and reply toggle.
 * Logic: Slack-style action row. Threads are shown inline when Reply is clicked.
 * Moderation: Overflow menu allows editing (author), deleting (author/mod), or reporting.
 */
const PostCard: React.FC<PostCardProps> = ({ item, isReply = false }) => {
  const { 
    toggleThread, 
    expandedThreads, 
    heartPost, 
    heartReply, 
    deletePost, 
    deleteReply,
    updatePost,
    updateReply,
    reportPost,
    reportReply
  } = useForumsStore()
  
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(item.body)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use ID to track expanded threads only for top-level posts
  const isExpanded = !isReply && expandedThreads.has(item.id)

  const handleHeart = async () => {
    if (isReply) {
      await heartReply(item.id)
    } else {
      await heartPost(item.id)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this?')) return
    
    try {
      if (isReply) {
        await deleteReply(item.id)
      } else {
        await deletePost(item.id)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleReport = async () => {
    const reason = window.prompt('Why are you reporting this post?')
    if (!reason) return

    try {
      if (isReply) {
        await reportReply(item.id, reason)
      } else {
        await reportPost(item.id, reason)
      }
      alert('Thank you for your report. Our moderators will review it.')
    } catch (error) {
      console.error('Failed to report:', error)
    } finally {
      setShowMenu(false)
    }
  }

  const handleUpdate = async () => {
    if (!editBody.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      if (isReply) {
        await updateReply(item.id, editBody)
      } else {
        await updatePost(item.id, editBody)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplyClick = () => {
    if (!isReply) {
      toggleThread(item.id)
    }
  }

  return (
    <div className={`py-6 flex gap-4 ${isReply ? 'pl-4 border-l-2 border-gray-100 ml-4' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
          {item.user.avatar_url ? (
            <img src={item.user.avatar_url} alt={item.user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
              {item.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{item.user.username}</span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-400 text-xs">
              {formatRelativeTime(item.created_at)}
            </span>
          </div>

          {/* Overflow Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-sm py-1 z-10">
                {/* MODERATION: In a real app, check user permissions (author/moderator) before showing these */}
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button 
                  onClick={() => { handleDelete(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Delete
                </button>
                <button 
                  onClick={handleReport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full p-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-0 transition-all resize-none min-h-[100px]"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={!editBody.trim() || isSubmitting}
                className="px-4 py-1.5 text-xs font-medium bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 leading-relaxed mb-4 break-words">
            {item.body}
          </p>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-6">
          <button 
            onClick={handleHeart}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              item.is_hearted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <svg 
              className={`w-4 h-4 ${item.is_hearted ? 'fill-current' : 'fill-none stroke-current'}`} 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {item.heart_count > 0 && item.heart_count}
          </button>

          {!isReply && (
            <button 
              onClick={handleReplyClick}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isExpanded ? 'text-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {item.reply_count > 0 ? `${item.reply_count} ${item.reply_count === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>
          )}
        </div>

        {/* Inline Thread Replies */}
        {!isReply && isExpanded && (
          <div className="mt-4">
            <ThreadReplies postId={item.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PostCard

