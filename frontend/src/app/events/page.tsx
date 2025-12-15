/**
 * Events Index Page
 * 
 * Route: /events
 * 
 * Displays upcoming events from followed authors.
 * 
 * Features:
 * - Lists all upcoming events sorted by date
 * - Filters: Virtual vs In-Person, Event Type
 * - Pagination/infinite scroll
 * - Manual refresh button
 * - Empty states:
 *   - No followed authors yet
 *   - Followed authors but no events found
 * - Loading skeleton
 * 
 * Backend Integration:
 * - GET /events - Returns events for followed authors
 * - POST /events/refresh - Manually triggers event scraping
 * 
 * How Events Are Populated:
 * 1. User follows an author
 * 2. Backend enqueues a Sidekiq job
 * 3. Job scrapes Eventbrite, Ticketmaster, author's website, etc.
 * 4. Events are deduplicated and stored in PostgreSQL
 * 5. Events are globally shared across all users
 * 6. Frontend fetches events via Rails API
 * 
 * Future Expandability:
 * - Filter by date range
 * - Filter by location/distance
 * - RSVP functionality
 * - Calendar sync
 * - Event notifications
 * - Recommended events (ML-based)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEvents, useRefreshEvents } from '@/shared/hooks'
import EventCard from '@/components/EventCard'

export default function EventsPage() {
  const [filter, setFilter] = useState<'all' | 'virtual' | 'in_person'>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<string | undefined>(undefined)

  // Fetch events with filters
  const { 
    events = [], // Default to empty array
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    isLoadingMore,
    refetch 
  } = useEvents({
    upcoming: true,
    is_virtual: filter === 'virtual' ? true : filter === 'in_person' ? false : undefined,
    event_type: eventTypeFilter,
  })

  // Manual refresh
  const { 
    refreshEvents, 
    isRefreshing, 
    successMessage, 
    lastRefreshed 
  } = useRefreshEvents()

  const handleRefresh = async () => {
    await refreshEvents()
    // Refetch events after refresh completes
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Upcoming Events
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Events from authors you follow
              </p>
            </div>

            {/* Refresh Button */}
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRefreshing ? (
                  <>
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
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
                      className="-ml-1 mr-2 h-4 w-4" 
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
              {lastRefreshed && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                  Last updated: {lastRefreshed}
                </p>
              )}
            </div>
          </div>

          {/* Success message after refresh */}
          {successMessage && (
            <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-green-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Virtual/In-Person Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('virtual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'virtual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              🌐 Virtual
            </button>
            <button
              onClick={() => setFilter('in_person')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'in_person'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              📍 In Person
            </button>
          </div>

          {/* Event Type Filter */}
          <select
            value={eventTypeFilter || 'all'}
            onChange={(e) => setEventTypeFilter(e.target.value === 'all' ? undefined : e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="signing">Book Signings</option>
            <option value="reading">Readings</option>
            <option value="interview">Interviews</option>
            <option value="tour">Book Tours</option>
            <option value="virtual_event">Virtual Events</option>
            <option value="book_release">Book Releases</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <svg 
              className="mx-auto h-12 w-12 text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load events
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <button
              onClick={refetch}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State: No Followed Authors */}
        {!isLoading && !error && events.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
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
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No events yet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Follow some authors to see their upcoming events here.
            </p>
            <div className="mt-6">
              <Link
                href="/authors/search"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Discover Authors
              </Link>
            </div>
          </div>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length > 0 && (
          <>
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} showAuthor={true} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <svg 
                        className="animate-spin -ml-1 mr-2 h-4 w-4" 
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
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
