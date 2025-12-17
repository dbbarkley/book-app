'use client'

/**
 * Events Page - Surface recommended events
 *
 * This page consumes `/recommendations/events` and groups events by followed authors
 * and books you already love. Rendering is lightweight so React Native can reuse the
 * same hook and UI structure.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRecommendedEvents } from '@book-app/shared'
import EventCard from '@/components/EventCard'
import { Button, SkeletonLoader } from '@/components'

export default function EventsPage() {
  const { groups, loading, error, refresh } = useRecommendedEvents()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const hasEvents = groups.some((group) => group.events.length > 0)
  const populatedGroups = groups.filter((group) => group.events.length > 0)

  const skeletons = useMemo(
    () =>
      Array.from({ length: 2 }).map((_, index) => (
        <div key={`event-skeleton-${index}`} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SkeletonLoader className="h-4 w-1/3 rounded-full" />
          <SkeletonLoader className="h-6 w-1/2 rounded-md" />
          <SkeletonLoader className="h-40 rounded-2xl" />
        </div>
      )),
    []
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="container-mobile flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
              Event recommendations
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Events tailored to you
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Grouped by followed authors and events tied to books you&apos;ve read. Refresh
              to pull the latest from the backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" isLoading={refreshing}>
              Refresh Events
            </Button>
            <Link
              href="/feed"
              className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
            >
              Back to feed
            </Link>
          </div>
        </div>
      </div>

      <div className="container-mobile py-8 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Unable to load events</p>
              <p>{error}</p>
              <p className="text-xs text-red-700">Please try again or visit the feed.</p>
            </div>
          )}

          {loading && skeletons}

          {!loading && !hasEvents && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">No events found yet</h2>
              <p className="text-sm text-slate-600">
                Follow authors or add books to your library to unlock event recommendations.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/authors/search" className="btn btn-primary">
                  Discover authors
                </Link>
                <Link href="/books" className="btn btn-secondary">
                  Update library
                </Link>
              </div>
            </div>
          )}

          {populatedGroups.map((group) => (
            <section
              key={group.group}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{group.title}</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{group.description}</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <div className="space-y-5">
                {group.events.map((rec) => (
                  <div key={`${group.group}-${rec.id}`} className="space-y-3">
                    <EventCard event={rec.event} compact />
                    <p className="text-sm text-slate-500 italic">{rec.reason}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <Link
                        href={`/events/${rec.event.id}`}
                        className="rounded-full border border-slate-200 px-4 py-1.5 font-medium text-slate-600 hover:border-slate-300 hover:text-primary-600 transition"
                      >
                        View event
                      </Link>
                      <span>Score: {rec.score ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {!loading && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Future-proofing</p>
            <p>
              Feeding this page with grouped recommendations makes it easy to insert ML-based
              ranking or real-time updates later: just adjust the backend&apos;s ordering and metadata.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

