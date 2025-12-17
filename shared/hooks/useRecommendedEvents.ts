'use client'

import { useEffect } from 'react'
import { useRecommendedEventsStore } from '../store/recommendedEventsStore'

/**
 * Hook for event recommendations.
 * Results are cached via Zustand and reused across platforms.
 */
export function useRecommendedEvents() {
  const { groups, loading, error, fetchRecommendedEvents, refresh } = useRecommendedEventsStore((state) => ({
    groups: state.groups,
    loading: state.loading,
    error: state.error,
    fetchRecommendedEvents: state.fetchRecommendedEvents,
    refresh: state.refresh,
  }))

  useEffect(() => {
    fetchRecommendedEvents().catch((err) => {
      console.warn('Failed to load recommended events', err)
    })
  }, [fetchRecommendedEvents])

  return {
    groups,
    loading,
    error,
    refresh,
  }
}

