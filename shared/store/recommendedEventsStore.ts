import { create } from 'zustand'
import { apiClient } from '../api/client'
import type { RecommendedEventGroup } from '../types'

interface RecommendedEventsState {
  groups: RecommendedEventGroup[]
  loading: boolean
  error: string | null
  fetchRecommendedEvents: () => Promise<void>
  refresh: () => Promise<void>
}

export const useRecommendedEventsStore = create<RecommendedEventsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  fetchRecommendedEvents: async () => {
    set({ loading: true, error: null })
    try {
      const groups = await apiClient.getRecommendedEvents()
      set({ groups, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load recommended events',
        loading: false,
      })
      throw error
    }
  },

  refresh: async () => {
    await get().fetchRecommendedEvents()
  },
}))

