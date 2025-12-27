// Forums Store - Zustand store for forums, posts, and comments
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type { Forum, ForumPost, ForumComment, PaginationMeta } from '../types'
import { apiClient } from '../api/client'

interface ForumsState {
  forums: Record<number, Forum>
  posts: Record<number, ForumPost>
  comments: Record<number, ForumComment[]> // Map of postId -> top-level comments
  threads: Record<number, ForumComment[]> // Map of parentCommentId -> replies
  loading: boolean
  error: string | null
  postError: string | null
  commentsError: string | null
  expandedThreads: Set<number> // Set of postId whose threads are expanded

  // Actions
  toggleThread: (postId: number) => void
  fetchForums: () => Promise<Forum[]>
  fetchForum: (id: number) => Promise<Forum>
  fetchForumBySlug: (slug: string) => Promise<Forum | null>
  followForum: (id: number) => Promise<void>
  unfollowForum: (id: number) => Promise<void>
  fetchForumPosts: (forumId: number, page?: number) => Promise<ForumPost[]>
  fetchForumPost: (postId: number) => Promise<ForumPost>
  fetchComments: (postId: number) => Promise<ForumComment[]>
  fetchThread: (commentId: number) => Promise<ForumComment[]>
  
  createPost: (forumId: number, postData: { body: string }) => Promise<ForumPost>
  updatePost: (postId: number, content: string) => Promise<ForumPost>
  deletePost: (postId: number) => Promise<void>
  reportPost: (postId: number, reason: string) => Promise<void>
  
  createComment: (postId: number, content: string) => Promise<ForumComment>
  createReply: (postId: number, parentId: number, content: string) => Promise<ForumComment>
  updateReply: (replyId: number, content: string) => Promise<ForumComment>
  deleteReply: (replyId: number) => Promise<void>
  reportReply: (replyId: number, reason: string) => Promise<void>
  
  heartPost: (postId: number) => Promise<void>
  heartReply: (replyId: number) => Promise<void>
}

/**
 * Zustand store for managing forums, posts, and comments
 */
export const useForumsStore = create<ForumsState>((set, get) => ({
  forums: {},
  posts: {},
  comments: {},
  threads: {},
  loading: false,
  error: null,
  postError: null,
  commentsError: null,
  expandedThreads: new Set(),

  toggleThread: (postId) => {
    const { expandedThreads } = get()
    const newExpanded = new Set(expandedThreads)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    set({ expandedThreads: newExpanded })
  },

  fetchForums: async () => {
    set({ loading: true, error: null })
    try {
      const forums = await apiClient.getForums()
      const forumsMap = forums.reduce((acc, f) => ({ ...acc, [f.id]: f }), {})
      set({ forums: { ...get().forums, ...forumsMap }, loading: false })
      return forums
    } catch (error) {
      set({ error: 'Failed to fetch forums', loading: false })
      return []
    }
  },

  fetchForum: async (id) => {
    set({ loading: true, error: null })
    try {
      const { forum, posts } = await apiClient.getForum(id)
      const postsMap = posts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      set((state) => ({ 
        forums: { ...state.forums, [forum.id]: forum }, 
        posts: { ...state.posts, ...postsMap },
        loading: false 
      }))
      return forum
    } catch (error) {
      set({ error: 'Failed to fetch forum', loading: false })
      return null
    }
  },

  fetchForumBySlug: async (slug) => {
    set({ loading: true, error: null })
    try {
      const forums = await get().fetchForums()
      const forum = forums.find(f => f.slug === slug)
      
      if (forum) {
        await get().fetchForumPosts(forum.id)
        return forum
      }
      
      set({ error: 'Forum not found', loading: false })
      return null
    } catch (error) {
      set({ error: 'Failed to fetch forum', loading: false })
      return null
    }
  },

  followForum: async (id) => {
    try {
      const forum = await apiClient.followForum(id)
      set({ 
        forums: { 
          ...get().forums, 
          [id]: { 
            ...get().forums[id], 
            ...forum,
            is_following: true,
            followers_count: (get().forums[id]?.followers_count || 0) + 1
          } 
        } 
      })
    } catch (error) {
      console.error('Failed to follow forum', error)
    }
  },

  unfollowForum: async (id) => {
    try {
      await apiClient.unfollowForum(id)
      const forum = get().forums[id]
      if (forum) {
        set({ 
          forums: { 
            ...get().forums, 
            [id]: { 
              ...forum, 
              is_following: false, 
              followers_count: Math.max(0, forum.followers_count - 1) 
            } 
          } 
        })
      }
    } catch (error) {
      console.error('Failed to unfollow forum', error)
    }
  },

  fetchForumPosts: async (forumId, page = 1) => {
    set({ loading: true, error: null })
    try {
      const { posts } = await apiClient.getForumPosts(forumId, page)
      const postsMap = posts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      set({ posts: { ...get().posts, ...postsMap }, loading: false })
      return posts
    } catch (error) {
      set({ error: 'Failed to fetch posts', loading: false })
      return []
    }
  },

  fetchForumPost: async (postId) => {
    set({ loading: true, postError: null })
    try {
      const { post, replies } = await apiClient.getForumPost(postId)
      set((state) => ({ 
        posts: { ...state.posts, [post.id]: post },
        comments: { ...state.comments, [postId]: replies },
        loading: false,
        postError: null
      }))
      return post
    } catch (error) {
      set({ postError: 'Failed to fetch post', loading: false })
      return null
    }
  },

  fetchComments: async (postId) => {
    set({ loading: true, commentsError: null })
    try {
      const comments = await apiClient.getPostComments(postId)
      set({ comments: { ...get().comments, [postId]: comments }, loading: false, commentsError: null })
      return comments
    } catch (error) {
      set({ commentsError: 'Failed to fetch comments', loading: false })
      return []
    }
  },

  fetchThread: async (commentId) => {
    set({ loading: true, error: null })
    try {
      const replies = await apiClient.getCommentThread(commentId)
      set({ threads: { ...get().threads, [commentId]: replies }, loading: false })
      return replies
    } catch (error) {
      set({ error: 'Failed to fetch thread', loading: false })
      return []
    }
  },

  createPost: async (forumId, postData) => {
    const post = await apiClient.createForumPost(forumId, postData)
    set({ posts: { ...get().posts, [post.id]: post } })
    return post
  },

  updatePost: async (postId: number, content: string) => {
    const updated = await apiClient.updatePost(postId, content)
    set({
      posts: {
        ...get().posts,
        [postId]: updated
      }
    })
    return updated
  },

  deletePost: async (postId: number) => {
    await apiClient.deletePost(postId)
    const { posts } = get()
    const newPosts = { ...posts }
    delete newPosts[postId]
    set({ posts: newPosts })
  },

  reportPost: async (postId: number, reason: string) => {
    await apiClient.reportPost(postId, reason)
  },

  createComment: async (postId, content) => {
    const comment = await apiClient.createPostComment(postId, content)
    if (comment) {
      const existingComments = get().comments[postId] || []
      set({ comments: { ...get().comments, [postId]: [...existingComments, comment] } })
    }
    return comment
  },

  createReply: async (postId, parentId, content) => {
    const reply = await apiClient.createThreadReply(postId, parentId, content)
    if (reply) {
      const existingReplies = get().threads[parentId] || []
      set({ threads: { ...get().threads, [parentId]: [...existingReplies, reply] } })
    }
    return reply
  },

  updateReply: async (replyId: number, content: string) => {
    const updated = await apiClient.updateReply(replyId, content)
    const { comments, threads } = get()
    
    // Update in top-level comments
    const updatedComments = { ...comments }
    Object.keys(updatedComments).forEach(postId => {
      const pid = Number(postId)
      if (updatedComments[pid]) {
        updatedComments[pid] = updatedComments[pid].map(c => c.id === replyId ? updated : c)
      }
    })

    // Update in threads
    const updatedThreads = { ...threads }
    Object.keys(updatedThreads).forEach(parentId => {
      const pid = Number(parentId)
      if (updatedThreads[pid]) {
        updatedThreads[pid] = updatedThreads[pid].map(c => c.id === replyId ? updated : c)
      }
    })

    set({ comments: updatedComments, threads: updatedThreads })
    return updated
  },

  deleteReply: async (replyId: number) => {
    await apiClient.deleteReply(replyId)
    const { comments, threads } = get()
    
    const updatedComments = { ...comments }
    Object.keys(updatedComments).forEach(postId => {
      const pid = Number(postId)
      if (updatedComments[pid]) {
        updatedComments[pid] = updatedComments[pid].filter(c => c.id !== replyId)
      }
    })
    
    const updatedThreads = { ...threads }
    Object.keys(updatedThreads).forEach(parentId => {
      const pid = Number(parentId)
      if (updatedThreads[pid]) {
        updatedThreads[pid] = updatedThreads[pid].filter(c => c.id !== replyId)
      }
    })
    
    set({ comments: updatedComments, threads: updatedThreads })
  },

  reportReply: async (replyId: number, reason: string) => {
    await apiClient.reportReply(replyId, reason)
  },

  heartPost: async (postId: number) => {
    try {
      const response = await apiClient.heartPost(postId)
      const post = get().posts[postId]
      if (post) {
        set({
          posts: {
            ...get().posts,
            [postId]: {
              ...post,
              heart_count: response.heart_count,
              is_hearted: !post.is_hearted
            }
          }
        })
      }
    } catch (error) {
      console.error('Failed to heart post', error)
    }
  },

  heartReply: async (replyId: number) => {
    try {
      const response = await apiClient.heartReply(replyId)
      const { comments, threads } = get()
      
      const updatedComments = { ...comments }
      Object.keys(updatedComments).forEach(postId => {
        const pid = Number(postId)
        if (updatedComments[pid]) {
          updatedComments[pid] = updatedComments[pid].map(c => 
            c.id === replyId ? { ...c, heart_count: response.heart_count, is_hearted: !c.is_hearted } : c
          )
        }
      })

      const updatedThreads = { ...threads }
      Object.keys(updatedThreads).forEach(parentId => {
        const pid = Number(parentId)
        if (updatedThreads[pid]) {
          updatedThreads[pid] = updatedThreads[pid].map(c => 
            c.id === replyId ? { ...c, heart_count: response.heart_count, is_hearted: !c.is_hearted } : c
          )
        }
      })

      set({ comments: updatedComments, threads: updatedThreads })
    } catch (error) {
      console.error('Failed to heart reply', error)
    }
  }
}))
