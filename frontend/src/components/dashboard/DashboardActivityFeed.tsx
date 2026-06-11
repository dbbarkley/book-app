'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useFeed } from '@book-app/shared'
import type { FeedEntry } from '@book-app/shared'
import DashboardFeedCard, { isSuggestion, isReview, isHighlight } from './DashboardFeedCard'

// ── Filter ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'highlights' | 'reviews' | 'suggestions'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'highlights',  label: 'Highlights' },
  { key: 'reviews',     label: 'Reviews' },
  { key: 'suggestions', label: 'Suggestions' },
]

function applyFilter(entries: FeedEntry[], filter: Filter): FeedEntry[] {
  if (filter === 'all')         return entries
  if (filter === 'reviews')     return entries.filter(e => isReview(e.activity_type))
  if (filter === 'highlights')  return entries.filter(e => isHighlight(e))
  if (filter === 'suggestions') return entries.filter(e => isSuggestion(e.activity_type))
  return entries
}

// ── Date grouping ──────────────────────────────────────────────────────────────

type DateGroup = { label: string; entries: FeedEntry[] }

// Exported alias for the /feed page
export function groupEntriesByDate(entries: FeedEntry[]): DateGroup[] {
  return groupByDate(entries)
}

function groupByDate(entries: FeedEntry[]): DateGroup[] {
  const now            = Date.now()
  const startOfToday   = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  const startOfYest    = startOfToday - 86_400_000
  const startOfWeek    = startOfToday - 6 * 86_400_000

  const buckets: Record<string, FeedEntry[]> = {
    Today: [], Yesterday: [], 'This Week': [], Earlier: [],
  }

  for (const e of entries) {
    const t = new Date(e.created_at).getTime()
    if      (t >= startOfToday) buckets['Today'].push(e)
    else if (t >= startOfYest)  buckets['Yesterday'].push(e)
    else if (t >= startOfWeek)  buckets['This Week'].push(e)
    else                        buckets['Earlier'].push(e)
  }

  return (['Today', 'Yesterday', 'This Week', 'Earlier'] as const)
    .filter(label => buckets[label].length > 0)
    .map(label => ({ label, entries: buckets[label] }))
}

export function DateSeparator({ label, count, newCount }: { label: string; count?: number; newCount?: number }) {
  const n = count ?? newCount ?? 0
  return (
    <div className="flex items-center gap-4 mb-5">
      <span
        className="font-serif font-bold italic flex-shrink-0"
        style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', color: 'var(--color-ink)' }}
      >
        {label}.
      </span>
      <div style={{ flex: 1, height: 2, backgroundColor: 'var(--color-ink)' }} />
      {n > 0 && (
        <span
          className="text-[11px] font-bold uppercase tracking-[0.18em] flex-shrink-0"
          style={{ color: 'var(--color-ink-3)' }}
        >
          {n} Update{n !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DashboardActivityFeed() {
  const { entries, pagination, loading, error, fetchFeed, markViewed } = useFeed()
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const viewedRef = useRef(false)

  useEffect(() => { fetchFeed(1) }, [fetchFeed])

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

  const hasMore       = pagination ? pagination.page < pagination.total_pages : false
  const filtered      = applyFilter(entries, activeFilter)
  const groups        = groupByDate(filtered)

  return (
    <section>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Eyebrow + headline on one row */}
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-teal)', flexShrink: 0 }} />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.2em] flex-shrink-0"
            style={{ color: 'var(--color-accent-teal)' }}
          >
            The Feed
          </span>
          <h2
            className="font-serif font-bold leading-tight tracking-tight"
            style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', margin: 0 }}
          >
            What your{' '}
            <em style={{ color: 'var(--color-accent-teal)', fontStyle: 'italic' }}>friends</em>
            {' '}are reading
          </h2>
        </div>

        {/* Filter pills on their own row */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => {
            const active = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                  color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '8px 16px',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── First-load skeleton ─────────────────────────────── */}
      {loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>Loading your feed…</p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div
          className="p-4 rounded-2xl text-sm text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-rim)',
            color: 'var(--color-ink-2)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{
            border: '2px dashed var(--color-rim)',
            borderRadius: 16,
          }}
        >
          <p className="font-serif font-bold mb-1" style={{ fontSize: 20, color: 'var(--color-ink)' }}>
            {entries.length === 0 ? 'Nothing here yet.' : 'No entries match this filter.'}
          </p>
          <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
            {entries.length === 0
              ? 'Follow friends and their updates will appear here.'
              : 'Try switching to All.'}
          </p>
        </div>
      )}

      {/* ── Feed entries ────────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-8">
          {groups.map(group => (
            <div key={group.label}>
              <DateSeparator label={group.label} count={group.entries.length} />
              <div className="flex flex-col gap-4">
                {group.entries.map(entry => (
                  <DashboardFeedCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                color: 'var(--color-ink)',
                backgroundColor: 'transparent',
              }}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}

          {!hasMore && entries.length > 0 && (
            <p
              className="text-center text-[11px] font-bold uppercase tracking-[0.15em] py-4"
              style={{ color: 'var(--color-ink-3)' }}
            >
              You&rsquo;re all caught up
            </p>
          )}
        </div>
      )}

    </section>
  )
}
