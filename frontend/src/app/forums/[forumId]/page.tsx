'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForumsStore } from '@/shared/store/forumsStore'
import { Forum } from '@/shared/types'
import ForumHeader from '@/components/ForumHeader'
import NewPostComposer from '@/components/NewPostComposer'
import PostsFeed from '@/components/PostsFeed'
import { useForumPosts } from '@/shared/hooks/useForumPosts'

/**
 * Forum Detail Page: Displays a specific forum's discussions.
 * Structure: Header -> Composer -> Posts Feed.
 * Note: Using numeric ID for now as requested.
 */
export default function ForumDetailPage() {
  const params = useParams()
  const forumId = Number(params.forumId)
  const [forum, setForum] = useState<Forum | null>(null)
  
  const { fetchForum, loading: forumLoading, error: forumError } = useForumsStore()
  
  // Fetch forum details by ID on mount
  useEffect(() => {
    if (forumId) {
      fetchForum(forumId).then(setForum)
    }
  }, [forumId, fetchForum])

  // Fetch posts for this forum
  const { posts, loading: postsLoading } = useForumPosts(forumId)

  if (forumLoading && !forum) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-50 mb-8" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="h-32 bg-gray-50 rounded-lg mb-8" />
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (forumError || (!forum && !forumLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gray-900 mb-2">Forum not found</h2>
          <p className="text-gray-500 mb-6">The forum you're looking for doesn't exist or has been moved.</p>
          <a href="/forums" className="text-black font-medium hover:underline">Return to Forums</a>
        </div>
      </div>
    )
  }

  if (!forum) return null

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Forum Header */}
      <ForumHeader forum={forum} />

      {/* 2. New Post Composer */}
      <NewPostComposer 
        forumId={forum.id} 
        isFollowing={!!forum.is_following} 
      />

      {/* 3. Posts Feed */}
      <div className="mt-4">
        <PostsFeed 
          posts={posts} 
          loading={postsLoading} 
        />
      </div>
    </div>
  )
}
