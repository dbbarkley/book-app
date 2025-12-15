// Feed Hook - Wrapper around feed store for easier React usage
// Reusable in Next.js and React Native

import { useEffect } from 'react'
import { useFeedStore } from '../store/feedStore'

/**
 * Hook for feed state and actions
 * Uses Zustand store for state management
 * 
 * Usage:
 * ```tsx
 * const { items, loading, fetchFeed } = useFeed()
 * 
 * useEffect(() => {
 *   fetchFeed()
 * }, [])
 * ```
 */
export function useFeed() {
  const store = useFeedStore()

  return {
    items: store.items,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,
    fetchFeed: store.fetchFeed,
    clearFeed: store.clearFeed,
  }
}
