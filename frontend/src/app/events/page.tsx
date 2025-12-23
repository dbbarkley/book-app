'use client'

/**
 * Events Page
 * 
 * Features:
 * - List upcoming events near the user (geographic discovery)
 * - Filter by distance from zipcode, author, and date
 * - Mobile-first responsive design
 * 
 * ARCHITECTURE CONTEXT:
 * 1. Venues as Source of Truth: Events are discovered via venues (bookstores, libraries, etc.)
 *    rather than being tied strictly to authors. This allows users to find local book 
 *    happenings they might otherwise miss.
 * 2. Scaling: This system scales globally. As background jobs discover more venues in more 
 *    cities, the "local events" pool grows without any frontend changes.
 * 3. Discovery: Events may appear without followed authors because the system prioritizes 
 *    geographic relevance alongside author follows.
 */

import { useState, useMemo } from 'react'
import { useEvents, useAuth, useFollows, Author } from '@book-app/shared'
import EventCard from '@/components/EventCard'
import { Button, InputField, SkeletonLoader } from '@/components'
import Link from 'next/link'

export default function EventsPage() {
  const { user } = useAuth()
  const { follows } = useFollows()
  
  // State for filters
  const [zipcode, setZipcode] = useState(user?.zipcode || '')
  const [radius, setRadius] = useState('25')
  const [startDate, setStartDate] = useState('')
  const [authorId, setAuthorId] = useState<string>('')
  
  // Get followed authors for the filter dropdown
  const followedAuthors = useMemo(() => {
    return follows
      .filter(f => f.followable_type === 'Author' && f.followable)
      .map(f => f.followable as Author)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [follows])

  // Fetch events using the geographic-aware hook
  const { 
    events, 
    isLoading, 
    isLoadingMore,
    error, 
    hasMore, 
    loadMore, 
    refetch 
  } = useEvents({
    zipcode: zipcode || undefined,
    radius: parseInt(radius) || undefined,
    author_id: authorId ? parseInt(authorId) : undefined,
    start_date: startDate || undefined,
    upcoming: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header & Filters Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Discover Book Events
              </h1>
              <p className="text-slate-600 dark:text-gray-400 max-w-2xl">
                Find book signings, readings, and releases at local bookstores and libraries near you.
              </p>
            </div>
            
            <Link 
              href="/feed"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Feed
            </Link>
          </div>

          {/* Filter Form */}
          <form onSubmit={handleSearch} className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <InputField
              label="Zipcode"
              placeholder="e.g. 10001"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              className="bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600"
            />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                Author
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="">All Authors</option>
                {followedAuthors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Starting From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600"
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Update Search
            </Button>
          </form>
        </div>
      </div>

      {/* Events List Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
            <p className="font-semibold">Error loading events</p>
            <p>{error}</p>
          </div>
        )}

        {/* Initial Loading State */}
        {isLoading && !events.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-gray-700">
                <SkeletonLoader className="h-4 w-1/4 rounded-full mb-4" />
                <SkeletonLoader className="h-6 w-3/4 rounded-md mb-2" />
                <SkeletonLoader className="h-4 w-1/2 rounded-md mb-6" />
                <SkeletonLoader className="h-24 w-full rounded-lg mb-4" />
                <SkeletonLoader className="h-8 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-slate-300 dark:border-gray-700 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Searching local venues near you...
            </h2>
            <p className="text-slate-600 dark:text-gray-400 max-w-md mb-8">
              We couldn&apos;t find any upcoming events in this area. We&apos;re constantly scanning local bookstores and libraries for new happenings.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => { setRadius('100'); refetch(); }} variant="secondary">
                Expand search radius
              </Button>
              <Button onClick={() => setStartDate('')} variant="ghost">
                Show all dates
              </Button>
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={loadMore} 
              variant="outline" 
              isLoading={isLoadingMore}
              className="px-8"
            >
              Load more events
            </Button>
          </div>
        )}

        {/* Future/Scale Info */}
        {!isLoading && events.length > 0 && (
          <div className="mt-16 p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-2">
              System Scaling & Future-Proofing
            </h3>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
              This discovery engine scales automatically as users join from new cities. Background jobs 
              continuously index new venues and fetch events from Eventbrite, venue websites, and local 
              library APIs. Because events are venue-first, you&apos;ll see local signings even for authors 
              you don&apos;t follow yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
