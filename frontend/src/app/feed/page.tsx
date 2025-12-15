'use client'

/**
 * Feed Page - Main activity feed for the book social app
 * 
 * Features:
 * - Displays comprehensive feed of activities from followed users, authors, and books
 * - Mobile-first responsive design
 * - Real-time follow/unfollow actions
 * - Infinite scroll ready (pagination support)
 * - Filter options (optional for MVP)
 * - Pull to refresh (future enhancement)
 * 
 * Activity Types Displayed:
 * - Book releases from followed authors
 * - Upcoming events
 * - User activity (friends adding books, finishing books, reviews)
 * - Author announcements
 * - Reading progress updates
 * - New follows
 * 
 * Integration Points:
 * - Uses shared/hooks/useFeed for data fetching
 * - Uses shared/hooks/useFollows to initialize follow state
 * - Uses EnhancedFeedItem component for rendering
 * - Falls back to mock data for MVP/development
 * 
 * For React Native:
 * - Replace with FlatList or ScrollView
 * - Use RefreshControl for pull-to-refresh
 * - Same hooks and logic work across platforms
 * - Adjust navigation and styling
 */

import { useEffect, useState } from 'react'
import { useFeed, useFollows } from '@book-app/shared'
import { EnhancedFeedItem } from '@/components'
import { mockFeedItems } from '@/utils/mockData'

export default function FeedPage() {
  const { items, loading, error, fetchFeed, pagination } = useFeed()
  const { fetchFollows } = useFollows()
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Initialize feed and follows on mount
  useEffect(() => {
    // Fetch follows first to populate follow state
    fetchFollows().catch(() => {
      // Ignore errors, will use empty state
    })

    // Fetch feed from API
    fetchFeed().catch(() => {
      // API call failed, will use mock data below
      console.log('Using mock feed data for development')
    })
  }, [fetchFeed, fetchFollows])

  // Use mock data if no items loaded (for development)
  // In production, remove this fallback once backend is ready
  const displayItems = items && items.length > 0 ? items : mockFeedItems

  // Optional: Filter items by activity type (MVP feature)
  const filteredItems = activeFilter === 'all' 
    ? displayItems 
    : displayItems.filter(item => {
        if (activeFilter === 'books') {
          return ['book_release', 'user_added_book', 'user_finished_book'].includes(item.activity_type)
        }
        if (activeFilter === 'events') {
          return item.activity_type === 'author_event'
        }
        if (activeFilter === 'social') {
          return ['user_followed_author', 'user_review', 'user_progress_update'].includes(item.activity_type)
        }
        return true
      })

  // Handle load more (pagination)
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.total_pages && !loading) {
      fetchFeed(pagination.page + 1).catch(() => {
        console.error('Failed to load more feed items')
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container-mobile py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Feed</h1>
          <p className="text-sm text-slate-600 mt-1">
            Stay updated with your favorite authors and readers
          </p>
        </div>

        {/* Filter Tabs (Optional for MVP) */}
        <div className="container-mobile">
          <div className="flex gap-2 overflow-x-auto pb-3 -mb-px scrollbar-hide">
            {[
              { id: 'all', label: 'All', icon: '📚' },
              { id: 'books', label: 'Books', icon: '📖' },
              { id: 'events', label: 'Events', icon: '📅' },
              { id: 'social', label: 'Social', icon: '👥' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors
                  ${
                    activeFilter === filter.id
                      ? 'bg-slate-50 text-primary-600 border-b-2 border-primary-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-mobile py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Loading State - Initial Load */}
          {loading && (!items || items.length === 0) && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-slate-600">Loading your feed...</p>
            </div>
          )}

          {/* Error State with Fallback to Mock Data */}
          {error && (!items || items.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-900 mb-1">
                    Unable to load feed from server
                  </h3>
                  <p className="text-sm text-yellow-800">
                    {error}. Showing sample data for development.
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    💡 <strong>Note:</strong> This feed will connect to your Rails backend at{' '}
                    <code className="bg-yellow-100 px-1 py-0.5 rounded">
                      http://localhost:3000/api/v1/feed
                    </code>
                    {' '}once the endpoint is ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Your feed is empty
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Start following authors, users, and books to see their activities here!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/authors/search"
                  className="btn btn-primary inline-flex items-center justify-center"
                >
                  Find Authors
                </a>
                <a
                  href="/books/search"
                  className="btn btn-secondary inline-flex items-center justify-center"
                >
                  Browse Books
                </a>
              </div>
            </div>
          )}

          {/* Feed Items */}
          {filteredItems.length > 0 && (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <EnhancedFeedItem 
                  key={item.id} 
                  item={item}
                  showFollowButtons={true}
                />
              ))}
            </div>
          )}

          {/* Load More Button (Pagination) */}
          {pagination && pagination.page < pagination.total_pages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                    Loading...
                  </>
                ) : (
                  <>Load More</>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Page {pagination.page} of {pagination.total_pages}
              </p>
            </div>
          )}

          {/* Loading More Indicator */}
          {loading && items && items.length > 0 && (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Development Info Box (Remove in Production) */}
          {displayItems === mockFeedItems && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <span>🔧</span>
                Development Mode
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                You're viewing mock feed data. This page is ready to connect to your Rails API.
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Backend Endpoint:</strong> GET /api/v1/feed</p>
                <p><strong>Expected Response:</strong></p>
                <pre className="bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
{`{
  "feed_items": [
    {
      "id": 1,
      "activity_type": "user_finished_book",
      "feedable": { /* Book/Event/Author data */ },
      "user": { /* User who performed action */ },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_pages": 3,
    "total_count": 125
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

