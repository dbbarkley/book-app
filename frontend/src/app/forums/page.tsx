'use client'

import React from 'react'
import Link from 'next/link'
import { useForums } from '@/shared/hooks/useForums'

/**
 * Forum list page showing all available forums.
 */
export default function ForumsPage() {
  const { forums, loading, error } = useForums()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <header className="mb-12">
          <h1 className="text-4xl font-serif text-gray-900 mb-4">Forums</h1>
          <p className="text-gray-600 text-lg">
            Join the conversation with fellow book lovers.
          </p>
        </header>

        {loading && forums.length === 0 ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : forums.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No forums found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {forums.map((forum) => (
              <Link 
                key={forum.id} 
                href={`/forums/${forum.id}`}
                className="group block p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-black">
                    {forum.title}
                  </h2>
                  <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {forum.posts_count} posts
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {forum.description}
                </p>
                <div className="text-xs text-gray-400 font-medium">
                  {forum.followers_count.toLocaleString()} followers
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
