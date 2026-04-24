// Feed Hook - Wrapper around feed store for easier React usage
// Reusable in Next.js and React Native

import { useFeedStore } from '../store/feedStore'

export function useFeed() {
  const store = useFeedStore()

  return {
    entries:         store.entries,
    pagination:      store.pagination,
    loading:         store.loading,
    error:           store.error,
    unreadCount:     store.unreadCount,
    fetchFeed:       store.fetchFeed,
    refreshFeed:     store.refreshFeed,
    markViewed:      store.markViewed,
    fetchUnreadCount: store.fetchUnreadCount,
    clearFeed:       store.clearFeed,
  }
}
