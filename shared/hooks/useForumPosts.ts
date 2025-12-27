import { useEffect, useState } from 'react'
import { useForumsStore } from '../store/forumsStore'

/**
 * Hook to fetch and manage posts within a specific forum
 */
export const useForumPosts = (forumId: number) => {
  const { posts, loading, error, fetchForumPosts } = useForumsStore()
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (forumId) fetchForumPosts(forumId, page)
  }, [forumId, page, fetchForumPosts])

  // Filter posts that belong to this forum
  const forumPosts = Object.values(posts)
    .filter(p => p && (p.forum_id === forumId || !p.forum_id)) // Safety fallback
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return {
    posts: forumPosts,
    loading,
    error,
    loadMore: () => setPage(p => p + 1),
    refresh: () => fetchForumPosts(forumId, 1)
  }
}

/**
 * Hook to fetch and manage a single forum post
 */
export const useForumPost = (postId: number) => {
  const { posts, loading, postError, fetchForumPost } = useForumsStore()
  const post = posts[postId]

  useEffect(() => {
    if (postId) fetchForumPost(postId)
  }, [postId, fetchForumPost])

  return {
    post,
    loading,
    error: postError,
    refresh: () => fetchForumPost(postId)
  }
}

