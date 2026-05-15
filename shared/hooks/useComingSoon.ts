'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { UpcomingRelease, UpcomingReleasesMeta } from '../types'

interface UseComingSoonOptions {
  genre?:     string | null
  page?:      number
  per?:       number
  date_from?: string | null   // ISO date, e.g. "2026-05-06"
  date_to?:   string | null   // ISO date, e.g. "2026-05-12"
}

interface UseComingSoonReturn {
  books:   UpcomingRelease[]
  meta:    UpcomingReleasesMeta | null
  loading: boolean
  error:   string | null
  refetch: () => void
}

export function useComingSoon({
  genre     = null,
  page      = 1,
  per       = 20,
  date_from = null,
  date_to   = null,
}: UseComingSoonOptions = {}): UseComingSoonReturn {
  const [books,   setBooks]   = useState<UpcomingRelease[]>([])
  const [meta,    setMeta]    = useState<UpcomingReleasesMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  // Incrementing this forces a refetch without changing any filter param.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // Cancellation flag — if deps change before this fetch resolves, the
    // cleanup function flips this to true and we discard the stale response.
    // This prevents a slow page-2 fetch from overwriting a newer page-1 result.
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await apiClient.getComingSoon({
          ...(genre     ? { genre }     : {}),
          ...(date_from ? { date_from } : {}),
          ...(date_to   ? { date_to }   : {}),
          page,
          per,
        })

        if (cancelled) return

        const incoming = data.coming_soon ?? []

        if (page === 1) {
          // New filter or initial load — replace the list entirely.
          setBooks(incoming)
        } else {
          // Paginating forward — append, deduplicating by isbn13 so a
          // slow duplicate request can never produce double entries.
          setBooks((prev: UpcomingRelease[]) => {
            const seen = new Set(prev.map((b: UpcomingRelease) => b.isbn13))
            return [...prev, ...incoming.filter((b: UpcomingRelease) => !seen.has(b.isbn13))]
          })
        }

        setMeta(data.meta ?? null)
      } catch (err: any) {
        if (cancelled) return
        setError(err.message || 'Failed to fetch upcoming releases')
        if (page === 1) setBooks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [genre, page, per, date_from, date_to, tick])

  const refetch = useCallback(() => setTick((t: number) => t + 1), [])

  return { books, meta, loading, error, refetch }
}
