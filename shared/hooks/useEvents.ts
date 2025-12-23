/**
 * useEvents Hook
 * 
 * Fetches and manages events from venues and followed authors.
 * 
 * ARCHITECTURE CONTEXT:
 * - Venues are the source of truth for event discovery.
 * - Events belong to venues (bookstores, libraries, universities) which are globally cached.
 * - This system scales as more cities/venues are added via background jobs.
 * - Events may appear without followed authors because they are discovered via local venues.
 * 
 * Features:
 * - Automatic caching via Zustand store
 * - Geographic filtering (zipcode, radius)
 * - Pagination support
 * - Loading/error states
 */

import { useEffect, useCallback } from 'react'
import { useEventsStore, shouldRefreshEvents } from '../store/eventsStore'
import { getEvents } from '../services/eventService'
import type { EventSearchParams } from '../types'

interface UseEventsOptions extends EventSearchParams {
  autoFetch?: boolean // Default: true
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const {
    autoFetch = true,
    ...searchParams
  } = options

  const {
    events,
    isLoading,
    isLoadingMore,
    error,
    currentPage,
    hasMore,
    setEvents,
    addEvents,
    setLoading,
    setLoadingMore,
    setError,
    setPagination,
    setLastRefreshed,
  } = useEventsStore()

  // Fetch events
  const fetchEvents = useCallback(async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await getEvents({
        ...searchParams,
        page,
        per_page: searchParams.per_page || 20,
      })

      if (page === 1) {
        setEvents(response.events)
      } else {
        addEvents(response.events)
      }

      // Update pagination
      const pagination = response.pagination
      if (pagination) {
        setPagination(
          pagination.page,
          pagination.total_pages,
          pagination.page < pagination.total_pages
        )
      }

      // Update last refreshed timestamp
      setLastRefreshed('global', new Date().toISOString())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events'
      setError(message)
      console.error('useEvents error:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchParams, setEvents, addEvents, setLoading, setLoadingMore, setError, setPagination, setLastRefreshed])

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(currentPage + 1)
    }
  }, [currentPage, hasMore, isLoadingMore, fetchEvents])

  // Refetch (refresh data)
  const refetch = useCallback(() => {
    fetchEvents(1)
  }, [fetchEvents])

  // Auto-fetch on mount or when search params change
  useEffect(() => {
    // We fetch if it's the first time OR if search params have changed
    // (except for autoFetch being false)
    if (autoFetch) {
      fetchEvents(1)
    }
  }, [
    autoFetch, 
    searchParams.zipcode, 
    searchParams.radius, 
    searchParams.author_id, 
    searchParams.event_type,
    searchParams.audience_type,
    searchParams.upcoming,
    searchParams.start_date
  ])

  return {
    events,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    currentPage,
  }
}

