'use client'

import { useState } from 'react'
import { useEvents, useVenues } from '@book-app/shared'
import EventCard from '@/components/EventCard'
import { Button, SkeletonLoader } from '@/components'

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'venues'>('events')
  const [audienceFilter, setAudienceFilter] = useState<'kids' | 'young_adult' | 'adult' | undefined>()
  
  const { 
    events, 
    isLoading: eventsLoading, 
    isLoadingMore,
    error: eventsError,
    hasMore,
    loadMore,
    refetch: refetchEvents 
  } = useEvents({ 
    upcoming: false, 
    per_page: 50,
    audience_type: audienceFilter
  }) // Increased per_page for diagnostics

  const { 
    venues, 
    isLoading: venuesLoading, 
    error: venuesError,
    refetch: refetchVenues 
  } = useVenues()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Diagnostics</h1>
            <p className="text-slate-600 dark:text-gray-400">View all discovered venues and events across the system.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {activeTab === 'events' && (
              <div className="flex items-center gap-2 mr-4">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 whitespace-nowrap">Audience:</label>
                <select 
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                  value={audienceFilter || ''}
                  onChange={(e) => setAudienceFilter(e.target.value as any || undefined)}
                >
                  <option value="">All Audiences</option>
                  <option value="adult">Adult</option>
                  <option value="young_adult">Young Adult</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
            )}
            
            <div className="flex gap-2 p-1 bg-slate-200 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'events' 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('venues')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'venues' 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'
                }`}
              >
                Venues ({venues.length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'events' ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Discovered Events</h2>
              <Button onClick={() => refetchEvents()} variant="outline" size="sm">Refresh Events</Button>
            </div>
            
            {eventsError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">{eventsError}</div>
            )}

            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <SkeletonLoader key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500">No events found in the database.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8">
                    <Button 
                      onClick={loadMore} 
                      disabled={isLoadingMore}
                      variant="outline"
                      className="px-8"
                    >
                      {isLoadingMore ? 'Loading More...' : 'Load More Events'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Discovered Venues</h2>
              <Button onClick={() => refetchVenues()} variant="outline" size="sm">Refresh Venues</Button>
            </div>

            {venuesError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">{venuesError}</div>
            )}

            {venuesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <SkeletonLoader key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500">No venues found in the database.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-gray-700 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Last Fetched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {venues.map(venue => (
                      <tr key={venue.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          {venue.website_url ? (
                            <a 
                              href={venue.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline block"
                            >
                              {venue.name}
                            </a>
                          ) : (
                            <div className="font-bold text-slate-900 dark:text-white">{venue.name}</div>
                          )}
                          <div className="text-xs text-slate-400">{venue.external_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium capitalize">
                            {venue.venue_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-400">
                          {venue.city}, {venue.state} {venue.zipcode}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {venue.source}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {venue.last_fetched_at ? new Date(venue.last_fetched_at).toLocaleString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

