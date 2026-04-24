// Feed Store - Zustand store for the unified feed
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type { FeedEntry, PaginationMeta } from '../types'
import { apiClient } from '../api/client'

interface FeedState {
  entries: FeedEntry[]
  pagination: PaginationMeta | null
  loading: boolean
  error: string | null
  unreadCount: number
  fetchFeed: (page?: number) => Promise<void>
  refreshFeed: () => Promise<void>
  markViewed: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  clearFeed: () => void
}

export const useFeedStore = create<FeedState>((set, get) => ({
  entries: [],
  pagination: null,
  loading: false,
  error: null,
  unreadCount: 0,

  fetchFeed: async (page = 1) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.getFeed(page, 30)
      set({
        entries: page === 1 ? response.entries : [...get().entries, ...response.entries],
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

  markViewed: async () => {
    try {
      await apiClient.markFeedViewed()
      // Clear the new flag locally so the UI updates instantly
      set(state => ({
        entries: state.entries.map(e => ({ ...e, new: false })),
        unreadCount: 0,
      }))
    } catch {
      // non-fatal
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await apiClient.getFeedUnreadCount()
      set({ unreadCount: count })
    } catch {
      // non-fatal
    }
  },

  clearFeed: () => {
    set({ entries: [], pagination: null, error: null, unreadCount: 0 })
  },
}))
