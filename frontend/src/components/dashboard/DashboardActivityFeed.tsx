'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Rss, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useFeed } from '@book-app/shared'
import type { FeedEntry } from '@book-app/shared'
import FeedEntryCard from '@/components/FeedEntryCard'
import EmptyState from '@/components/EmptyState'

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-lit-3)',
}

// ── Date grouping ─────────────────────────────────────────────────────────────

type DateGroup = { label: string; entries: FeedEntry[] }

export function groupEntriesByDate(entries: FeedEntry[]): DateGroup[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  const startOfWeek = startOfToday - 6 * 86_400_000

  const buckets: Record<string, FeedEntry[]> = {
    Today: [], Yesterday: [], 'This week': [], Earlier: [],
  }

  for (const entry of entries) {
    const t = new Date(entry.created_at).getTime()
    if (t >= startOfToday) buckets['Today'].push(entry)
    else if (t >= startOfYesterday) buckets['Yesterday'].push(entry)
    else if (t >= startOfWeek) buckets['This week'].push(entry)
    else buckets['Earlier'].push(entry)
  }

  return (['Today', 'Yesterday', 'This week', 'Earlier'] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, entries: buckets[label] }))
}

export function DateSeparator({ label, newCount }: { label: string; newCount: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 10 }}>
      <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-rim)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-lit-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {label}
        </span>
        {newCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-accent)',
            backgroundColor: 'rgba(201,168,76,0.16)',
            border: '1px solid rgba(201,168,76,0.33)',
            borderRadius: 9999, padding: '2px 7px',
          }}>
            {newCount} new
          </span>
        )}
      </div>
      <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-rim)' }} />
    </div>
  )
}

export default function DashboardActivityFeed() {
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

  // Mark feed as viewed once loaded — once per mount
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
    <section>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
          >
            <Rss size={14} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-none mb-0.5" style={{ color: 'var(--color-lit)' }}>
              Activity
            </h2>
            <p style={{ ...labelStyle, fontSize: 11 }}>Friends, follows &amp; updates</p>
          </div>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-lit-3)' }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* ── First-load skeleton ─────────────────────────────── */}
      {loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>Loading your feed…</p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div
          className="p-4 rounded-2xl text-sm text-center"
          style={{
            backgroundColor: 'var(--color-grove)',
            color: 'var(--color-lit-2)',
            border: '1px solid var(--color-rim)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────── */}
      {!loading && !error && entries.length === 0 && (
        <EmptyState
          icon={Rss}
          title="Nothing here yet"
          body="Follow authors and connect with friends — their updates will appear here."
          size="sm"
        />
      )}

      {/* ── Feed entries ────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {groupEntriesByDate(entries).map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <DateSeparator
                label={group.label}
                newCount={group.entries.filter((e) => e.new).length}
              />
              {group.entries.map((entry) => (
                <FeedEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors mt-1 flex items-center justify-center gap-2"
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
              You&rsquo;re all caught up ✓
            </p>
          )}
        </div>
      )}

    </section>
  )
}
