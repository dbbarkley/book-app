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
import { motion, Variants } from 'framer-motion'
import { useFeed, useFollows } from '@book-app/shared'
import { FeedItem, SkeletonLoader, Button, FeedEmptyState } from '@/components'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    }
  },
}

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
          className="space-y-3 rounded-2xl border border-border-default bg-background-card p-5 shadow-sm"
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
    <div className="min-h-screen bg-background-app">
      {/* <div className="bg-background-app border-b border-border-default sticky top-0 z-10">
        <div className="container-mobile py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                className="inline-flex items-center text-sm font-medium text-brand-indigo hover:text-brand-indigo-dark transition"
              >
                Event Recommendations →
              </Link>
            </div>
          </div>
        </div>
      </div> */}

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
            <FeedEmptyState />
          )}

          {hasItems && (
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {items.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <FeedItem item={item} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {pagination && pagination.page < pagination.total_pages && (
            <div className="text-center space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loading}
                isLoading={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </Button>
              <p className="text-xs text-text-muted">
                Page {pagination.page} of {pagination.total_pages}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

