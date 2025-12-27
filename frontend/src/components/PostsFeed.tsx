'use client'

import React from 'react'
import { ForumPost } from '@/shared/types'
import PostCard from './PostCard'

interface PostsFeedProps {
  posts: ForumPost[]
  loading: boolean
}

/**
 * PostsFeed displays a vertical list of top-level forum posts.
 * Sorted newest first (handled by hook/API).
 * Features: Empty state, loading state.
 */
const PostsFeed: React.FC<PostsFeedProps> = ({ posts, loading }) => {
  if (loading && posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-20 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
        <p className="text-gray-500">Be the first to start a conversation in this forum!</p>
      </div>
    )
  }

  return (
    <div className="bg-white px-4 sm:px-6">
      <div className="max-w-4xl mx-auto divide-y divide-gray-50">
        {posts.map((post) => (
          <PostCard key={post.id} item={post} />
        ))}
      </div>
    </div>
  )
}

export default PostsFeed

