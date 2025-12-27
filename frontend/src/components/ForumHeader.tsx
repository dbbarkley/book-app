'use client'

import React from 'react'
import { Forum } from '@/shared/types'
import { useForumsStore } from '@/shared/store/forumsStore'

interface ForumHeaderProps {
  forum: Forum
}

/**
 * ForumHeader component displays the main information about a forum,
 * including its title, description, and metadata.
 */
const ForumHeader: React.FC<ForumHeaderProps> = ({ forum }) => {
  const { followForum, unfollowForum } = useForumsStore()

  const handleFollowToggle = () => {
    if (forum.is_following) {
      unfollowForum(forum.id)
    } else {
      followForum(forum.id)
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-4xl font-serif text-gray-900 mb-2">{forum.title}</h1>
          <p className="text-gray-600 text-lg mb-4 max-w-2xl">{forum.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Created by @admin</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${forum.visibility === 'public_access' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              {forum.visibility === 'public_access' ? 'Public' : 'Followers-only'}
            </span>
            <span>{forum.followers_count.toLocaleString()} followers</span>
          </div>
        </div>

        <button
          onClick={handleFollowToggle}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            forum.is_following
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {forum.is_following ? 'Following' : 'Follow Forum'}
        </button>
      </div>
    </div>
  )
}

export default ForumHeader

