/**
 * useAuthorEvents Hook
 * 
 * Fetches events for a specific author.
 * Useful for author profile pages.
 * 
 * Features:
 * - Per-author caching
 * - Loading/error states
 * - Automatic refetch when authorId changes
 * 
 * Usage:
 * ```tsx
 * const { events, isLoading, error, refetch } = useAuthorEvents(authorId, { upcoming: true })
 * ```
 */

import { useEffect, useCallback } from 'react'
import { useEventsStore } from '../store/eventsStore'
import { getAuthorEvents } from '../services/eventService'
import type { EventSearchParams } from '../types'

interface UseAuthorEventsOptions extends EventSearchParams {
  autoFetch?: boolean // Default: true
}

export const useAuthorEvents = (
  authorId: number | null,
  options: UseAuthorEventsOptions = {}
) => {
  const {
    autoFetch = true,
    ...searchParams
  } = options

  const {
    authorEvents,
    isLoading,
    error,
    setAuthorEvents,
    setLoading,
    setError,
  } = useEventsStore()

  // Get events for this specific author
  const events = authorId ? (authorEvents[authorId] || []) : []

  // Fetch author events
  const fetchAuthorEvents = useCallback(async () => {
    if (!authorId) return

    try {
      setLoading(true)
      setError(null)

      const response = await getAuthorEvents(authorId, {
        ...searchParams,
        per_page: searchParams.per_page || 20,
      })

      setAuthorEvents(authorId, response.events)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch author events'
      setError(message)
      console.error('useAuthorEvents error:', err)
    } finally {
      setLoading(false)
    }
  }, [authorId, searchParams, setAuthorEvents, setLoading, setError])

  // Refetch
  const refetch = useCallback(() => {
    fetchAuthorEvents()
  }, [fetchAuthorEvents])

  // Auto-fetch when authorId changes
  useEffect(() => {
    if (autoFetch && authorId) {
      fetchAuthorEvents()
    }
  }, [authorId, autoFetch]) // Refetch when authorId changes

  return {
    events,
    isLoading,
    error,
    refetch,
  }
}

