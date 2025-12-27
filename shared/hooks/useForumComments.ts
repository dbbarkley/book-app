import { useEffect } from 'react'
import { useForumsStore } from '../store/forumsStore'

/**
 * Hook to fetch and manage top-level comments for a forum post
 */
export const useComments = (postId: number) => {
  const { comments, loading, commentsError, fetchComments } = useForumsStore()
  const postComments = comments[postId] || []

  useEffect(() => {
    if (postId) fetchComments(postId)
  }, [postId, fetchComments])

  return {
    comments: postComments,
    loading,
    error: commentsError,
    refresh: () => fetchComments(postId)
  }
}

/**
 * Hook to fetch and manage threaded replies for a comment
 */
export const useThread = (parentCommentId: number) => {
  const { threads, loading, error, fetchThread } = useForumsStore()
  const replies = threads[parentCommentId] || []

  useEffect(() => {
    if (parentCommentId) fetchThread(parentCommentId)
  }, [parentCommentId, fetchThread])

  return {
    replies,
    loading,
    error,
    refresh: () => fetchThread(parentCommentId)
  }
}

