'use client'

/**
 * Feed Page - Real-time activity stream
 *
 * This page renders `/api/v1/feed` directly, so every `FeedItem` mirrors the backend
 * recommendation pipeline (book recs, event recs, follow activity, etc.). ML-based rank
 * tuning happens by adjusting the metadata (`score`, `reason`, etc.) that arrives here.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useFeed, useFollows } from '@book-app/shared'
import { FeedItem, SkeletonLoader, Button } from '@/components'

export default function FeedPage() {
  const { items, loading, error, pagination, fetchFeed, refreshFeed } = useFeed()
  const { fetchFollows } = useFollows()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchFollows().catch(() => {
      // follow cache is helpful but not required
    })

    fetchFeed().catch(() => {
      console.warn('Failed to load feed items')
    })
  }, [fetchFeed, fetchFollows])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshFeed()
    } finally {
      setRefreshing(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.total_pages && !loading) {
      fetchFeed(pagination.page + 1).catch(() => {
        console.error('Failed to load more feed items')
      })
    }
  }

  const skeletons = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`feed-skeleton-${index}`}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <SkeletonLoader className="h-5 w-2/3 rounded-md" />
          <SkeletonLoader className="h-4 w-1/2 rounded-md" />
          <SkeletonLoader className="h-32 rounded-2xl" />
        </div>
      )),
    []
  )

  const hasItems = items.length > 0
  const isInitialLoading = loading && !hasItems

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container-mobile py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                Feed
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Personalized Stream</h1>
              <p className="text-sm text-slate-600">
                Powered by <code className="rounded bg-slate-100 px-2 py-0.5">GET /api/v1/feed</code>.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                isLoading={refreshing}
              >
                Refresh
              </Button>
              <Link
                href="/events"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 transition"
              >
                Event Recommendations →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-mobile py-8 sm:py-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && !loading && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <p className="font-semibold">Unable to load feed</p>
              <p>{error}</p>
              <p className="mt-1 text-xs text-yellow-700">Retrying will hit the same backend endpoint.</p>
            </div>
          )}

          {isInitialLoading && <div className="space-y-4">{skeletons}</div>}

          {!loading && !hasItems && !error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">Feed is loading</h2>
              <p className="text-sm text-slate-600">
                Follow authors, add books, or refresh to see activity tailored to your interests.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/recommendations" className="btn btn-primary">
                  Explore recommendations
                </Link>
                <Link href="/books" className="btn btn-secondary">
                  Open library
                </Link>
              </div>
            </div>
          )}

          {hasItems && (
            <div className="space-y-4">
              {items.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </div>
          )}

          {pagination && pagination.page < pagination.total_pages && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn btn-outline inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-60"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Page {pagination.page} of {pagination.total_pages}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

