'use client'

import { useState } from 'react'
import type { ForumComment } from '@book-app/shared'
import { 
  useHeartComment, 
  useDeleteComment, 
  useEditComment, 
  useReportComment, 
  useAuth 
} from '@book-app/shared/hooks'
import { formatDate } from '../../utils/format'
import ModerationMenu from './ModerationMenu'
import EditCommentModal from './EditCommentModal'

interface CommentProps {
  comment: ForumComment
  isReply?: boolean
  onReplyClick?: () => void
}

/**
 * Comment displays a single comment or thread reply.
 * supports hearts, replies (if top-level), and moderation actions.
 */
export default function Comment({ 
  comment, 
  isReply = false, 
  onReplyClick 
}: CommentProps) {
  const { user: currentUser } = useAuth()
  const { heartComment } = useHeartComment()
  const { deleteComment } = useDeleteComment()
  const { editComment } = useEditComment()
  const { reportComment } = useReportComment()

  const [isEditing, setIsEditing] = useState(false)
  
  const isAuthor = currentUser?.id === comment.user_id

  const handleHeart = () => {
    heartComment(comment.id)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(comment.id)
    }
  }

  const handleReport = () => {
    const reason = prompt('Please enter a reason for reporting:')
    if (reason) {
      reportComment(comment.id, reason)
      alert('Thank you for reporting. Our moderators will review it.')
    }
  }

  return (
    <div className={`group ${isReply ? 'pl-4 border-l-2 border-primary-100 dark:border-primary-900/30' : 'pb-6'}`}>
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className={`flex-shrink-0 rounded-full bg-background-muted flex items-center justify-center font-bold text-xs uppercase overflow-hidden ${isReply ? 'w-6 h-6' : 'w-10 h-10'}`}>
          {comment.user.avatar_url ? (
            <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
          ) : (
            comment.user.username.charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-text-primary ${isReply ? 'text-xs' : 'text-sm'}`}>
                {comment.user.display_name || comment.user.username}
              </span>
              <span className="text-[10px] text-text-muted">
                {formatDate(comment.created_at)}
              </span>
            </div>
            
            <ModerationMenu 
              isAuthor={isAuthor}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          </div>

          {/* Content */}
          <p className={`text-text-primary whitespace-pre-wrap leading-relaxed ${isReply ? 'text-sm' : 'text-[15px]'}`}>
            {comment.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button 
              onClick={handleHeart}
              className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                comment.is_hearted ? 'text-red-500' : 'text-text-muted hover:text-red-500'
              }`}
            >
              <svg className={`w-4 h-4 ${comment.is_hearted ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.heart_count > 0 && comment.heart_count}
            </button>

            {!isReply && (
              <button 
                onClick={onReplyClick}
                className="flex items-center gap-1 text-[11px] font-bold text-text-muted hover:text-primary-600 uppercase tracking-wider transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <EditCommentModal 
          initialContent={comment.body}
          onSave={async (content) => { await editComment(comment.id, content) }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  )
}

