'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Rss, Loader2 } from 'lucide-react'
import { useFeed } from '@book-app/shared'
import FeedEntryCard from '@/components/FeedEntryCard'

export default function FeedPage() {
  const {
    entries,
    pagination,
    loading,
    error,
    fetchFeed,
    markViewed,
  } = useFeed()

  const viewedRef = useRef(false)

  useEffect(() => {
    fetchFeed(1)
  }, [fetchFeed])

  // Mark feed as viewed once entries are loaded (only once per mount)
  useEffect(() => {
    if (!viewedRef.current && entries.length > 0) {
      viewedRef.current = true
      markViewed()
    }
  }, [entries, markViewed])

  const loadMore = useCallback(() => {
    if (pagination && pagination.page < pagination.total_pages && !loading) {
      fetchFeed(pagination.page + 1)
    }
  }, [pagination, loading, fetchFeed])

  const hasMore = pagination ? pagination.page < pagination.total_pages : false

  return (
    <div className="container-mobile py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
        >
          <Rss size={18} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-lit)' }}>Activity</h1>
          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>Friends, follows &amp; updates</p>
        </div>
      </div>

      {/* Loading state (first load) */}
      {loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>Loading your feed…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="p-4 rounded-2xl text-sm text-center mb-4"
          style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
          >
            <Rss size={28} style={{ color: 'var(--color-lit-3)' }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--color-lit)' }}>Nothing here yet</p>
            <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
              Follow authors, connect with friends, and your activity will show up here.
            </p>
          </div>
        </div>
      )}

      {/* Feed entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <FeedEntryCard key={entry.id} entry={entry} />
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors mt-2 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--color-grove)',
                border: '1px solid var(--color-rim)',
                color: 'var(--color-lit-2)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </button>
          )}

          {/* All caught up */}
          {!hasMore && entries.length > 0 && (
            <p className="text-center text-xs py-4" style={{ color: 'var(--color-lit-3)' }}>
              You're all caught up ✓
            </p>
          )}
        </div>
      )}
    </div>
  )
}
