// Feed Hook - Wrapper around feed store for easier React usage
// Reusable in Next.js and React Native

import { useFeedStore } from '../store/feedStore'

export function useFeed() {
  const store = useFeedStore()

  // Derived state — computed once here so callers don't repeat the logic
  const hasMore  = store.pagination
    ? store.pagination.page < store.pagination.total_pages
    : false
  const isEmpty  = !store.loading && store.entries.length === 0 && !store.error
  const newCount = store.entries.filter((e) => e.new).length

  return {
    // Raw store state
    entries:          store.entries,
    pagination:       store.pagination,
    loading:          store.loading,
    error:            store.error,
    unreadCount:      store.unreadCount,
    // Derived
    hasMore,
    isEmpty,
    newCount,
    // Actions
    fetchFeed:        store.fetchFeed,
    refreshFeed:      store.refreshFeed,
    markViewed:       store.markViewed,
    fetchUnreadCount: store.fetchUnreadCount,
    clearFeed:        store.clearFeed,
  }
}
