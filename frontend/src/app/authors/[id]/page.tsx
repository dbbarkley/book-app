'use client'

// Author Profile Page - Shows author information, books, events, and follow status
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useParams } from 'next/navigation'
import { useAuthorProfile, useAuthorEvents, useRefreshEvents } from '@book-app/shared'
import { BookList, FollowButton } from '@/components'
import EventCard from '@/components/EventCard'
import { formatNumber } from '@/utils/format'

/**
 * Author Profile Page
 * 
 * Features:
 * - Author details (name, bio, avatar, stats)
 * - Follow/Unfollow button
 * - List of books by author
 * - Upcoming events
 * - Placeholder sections for reviews/posts
 * 
 * For React Native:
 * - Replace Next.js navigation with React Navigation
 * - Use ScrollView or FlatList for better performance
 * - Adjust styling to StyleSheet
 * - Replace Link components with TouchableOpacity
 */
export default function AuthorProfilePage() {
  const params = useParams()
  const authorId = parseInt(params.id as string, 10)

  const { author, books, loading, error, refetch } = useAuthorProfile(
    isNaN(authorId) ? null : authorId
  )

  // Fetch author events separately with new hook
  const { 
    events, 
    isLoading: eventsLoading, 
    error: eventsError,
    refetch: refetchEvents 
  } = useAuthorEvents(isNaN(authorId) ? null : authorId, { upcoming: true })

  // Manual refresh for events
  const { 
    refreshEvents, 
    isRefreshing, 
    successMessage,
    lastRefreshed 
  } = useRefreshEvents(authorId)

  if (loading) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Loading author...</p>
        </div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Author Not Found</h1>
          <p className="text-slate-600 mb-4">
            {error || "The author you're looking for doesn't exist."}
          </p>
          {error && (
            <button
              onClick={refetch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Author Header Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {author.avatar_url && (
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={author.avatar_url}
                  alt={author.name}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-md"
                />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                {author.name}
              </h1>
              {author.bio && (
                <p className="text-slate-700 leading-relaxed mb-4">{author.bio}</p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4 text-sm text-slate-600">
                {author.books_count !== undefined && (
                  <span>{formatNumber(author.books_count)} books</span>
                )}
                {author.events_count !== undefined && author.events_count > 0 && (
                  <span>{formatNumber(author.events_count)} events</span>
                )}
                {author.followers_count !== undefined && (
                  <span>{formatNumber(author.followers_count)} followers</span>
                )}
              </div>
              {author.website_url && (
                <a
                  href={author.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block"
                >
                  Visit Website →
                </a>
              )}
              <div className="flex justify-center sm:justify-start">
                <FollowButton authorId={author.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Books Section */}
        {books.length > 0 && (
          <div className="mb-6">
            <BookList books={books} title="Books" showDescription={false} gridCols={4} />
          </div>
        )}

        {/* Events Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
            <button
              onClick={async () => {
                await refreshEvents()
                refetchEvents()
              }}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-1.5 h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg 
                    className="-ml-1 mr-1.5 h-4 w-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  Check for new events
                </>
              )}
            </button>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
          )}

          {/* Last refreshed */}
          {lastRefreshed && (
            <p className="text-xs text-slate-500 mb-3">
              Last updated: {lastRefreshed}
            </p>
          )}

          {/* Events loading state */}
          {eventsLoading && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-slate-600">Loading events...</p>
            </div>
          )}

          {/* Events error state */}
          {eventsError && !eventsLoading && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
              <p className="text-sm text-red-600 mb-2">{eventsError}</p>
              <button
                onClick={refetchEvents}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Events list */}
          {!eventsLoading && !eventsError && events.length > 0 && (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} showAuthor={false} />
              ))}
            </div>
          )}

          {/* No events state */}
          {!eventsLoading && !eventsError && events.length === 0 && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-slate-400 mb-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-slate-600 mb-2">No upcoming events found</p>
              <p className="text-sm text-slate-500">
                {author.name} doesn't have any scheduled events yet. Check back later!
              </p>
            </div>
          )}
        </div>

        {/* Placeholder: Reviews Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Reviews</h2>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600 mb-2">Reviews coming soon</p>
            <p className="text-sm text-slate-500">
              This section will display reviews and discussions about this author's books
            </p>
          </div>
        </div>

        {/* Placeholder: Posts Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Posts & Updates</h2>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600 mb-2">Posts coming soon</p>
            <p className="text-sm text-slate-500">
              This section will display author posts, announcements, and updates
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

