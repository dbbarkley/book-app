// Feed Store - Zustand store for feed items
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type { FeedItem, PaginationMeta, UserBook } from '../types'
import { apiClient } from '../api/client'

interface FeedState {
  items: FeedItem[]
  pagination: PaginationMeta | null
  loading: boolean
  error: string | null
  fetchFeed: (page?: number, perPage?: number, activityType?: string) => Promise<void>
  refreshFeed: () => Promise<void>
  clearFeed: () => void
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  pagination: null,
  loading: false,
  error: null,

  fetchFeed: async (page = 1, perPage = 50, activityType?: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.getFeed(page, perPage, activityType)
      const sanitizedItems = response.feed_items.filter((item) => {
        const feedable = item.feedable as UserBook | undefined
        if (!feedable || typeof feedable.visibility === 'undefined') {
          return true
        }
        // Private books should never be shared in feeds or public timelines.
        return feedable.visibility !== 'private'
      })
      set({
        items: page === 1 ? sanitizedItems : [...get().items, ...sanitizedItems],
        pagination: response.pagination,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch feed',
        loading: false,
      })
    }
  },

  refreshFeed: async () => {
    await get().fetchFeed(1)
  },

  clearFeed: () => {
    set({ items: [], pagination: null, error: null })
  },
}))

