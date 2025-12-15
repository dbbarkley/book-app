/**
 * Events Store (Zustand)
 * 
 * Manages global state for events including:
 * - Cached events data
 * - Last refreshed timestamps (per author)
 * - Loading and error states
 * - Optimistic UI updates
 * 
 * Why Zustand?
 * - Lightweight state management
 * - No boilerplate compared to Redux
 * - Perfect for caching API responses
 * - Easy to use with React hooks
 * 
 * Cache Strategy:
 * - Events are cached for 5 minutes by default
 * - Refresh timestamps track when events were last synced from external sources
 * - Stale data is refetched automatically
 * 
 * Future Expandability:
 * - Add RSVP tracking (rsvpedEventIds: Set<number>)
 * - Add calendar sync status
 * - Add event reminders/notifications preferences
 */

import { create } from 'zustand'
import type { Event } from '../types'

interface EventsState {
  // Cached events data
  events: Event[]
  authorEvents: Record<number, Event[]> // Keyed by author ID
  
  // Pagination
  currentPage: number
  totalPages: number
  hasMore: boolean
  
  // Loading states
  isLoading: boolean
  isRefreshing: boolean // True when manually refreshing events
  isLoadingMore: boolean // True when loading next page
  
  // Error handling
  error: string | null
  
  // Refresh tracking
  lastRefreshed: Record<number, string> // author_id -> ISO timestamp
  globalLastRefreshed: string | null // For all followed authors
  
  // Actions
  setEvents: (events: Event[]) => void
  addEvents: (events: Event[]) => void // For pagination
  setAuthorEvents: (authorId: number, events: Event[]) => void
  
  setLoading: (isLoading: boolean) => void
  setRefreshing: (isRefreshing: boolean) => void
  setLoadingMore: (isLoadingMore: boolean) => void
  setError: (error: string | null) => void
  
  setPagination: (page: number, totalPages: number, hasMore: boolean) => void
  
  setLastRefreshed: (authorId: number | 'global', timestamp: string) => void
  getLastRefreshed: (authorId?: number) => string | null
  
  // Optimistic updates
  addEventOptimistically: (event: Event) => void
  removeEventOptimistically: (eventId: number) => void
  
  // Clear/reset
  clearEvents: () => void
  clearAuthorEvents: (authorId: number) => void
  resetStore: () => void
}

const INITIAL_STATE = {
  events: [],
  authorEvents: {},
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  lastRefreshed: {},
  globalLastRefreshed: null,
}

export const useEventsStore = create<EventsState>((set, get) => ({
  ...INITIAL_STATE,

  // Set events (replaces existing)
  setEvents: (events) => set({ events }),

  // Add events (append for pagination)
  addEvents: (events) => set((state) => ({
    events: [...state.events, ...events],
  })),

  // Set events for a specific author
  setAuthorEvents: (authorId, events) => set((state) => ({
    authorEvents: {
      ...state.authorEvents,
      [authorId]: events,
    },
  })),

  // Loading states
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setError: (error) => set({ error }),

  // Pagination
  setPagination: (page, totalPages, hasMore) => set({
    currentPage: page,
    totalPages,
    hasMore,
  }),

  // Refresh tracking
  setLastRefreshed: (authorId, timestamp) => {
    if (authorId === 'global') {
      set({ globalLastRefreshed: timestamp })
    } else {
      set((state) => ({
        lastRefreshed: {
          ...state.lastRefreshed,
          [authorId]: timestamp,
        },
      }))
    }
  },

  getLastRefreshed: (authorId) => {
    const state = get()
    if (authorId === undefined) {
      return state.globalLastRefreshed
    }
    return state.lastRefreshed[authorId] || null
  },

  // Optimistic updates
  // Add event immediately (before API confirmation)
  addEventOptimistically: (event) => set((state) => ({
    events: [event, ...state.events],
  })),

  // Remove event immediately (before API confirmation)
  removeEventOptimistically: (eventId) => set((state) => ({
    events: state.events.filter((e) => e.id !== eventId),
  })),

  // Clear functions
  clearEvents: () => set({ events: [] }),
  
  clearAuthorEvents: (authorId) => set((state) => {
    const { [authorId]: _, ...rest } = state.authorEvents
    return { authorEvents: rest }
  }),

  resetStore: () => set(INITIAL_STATE),
}))

/**
 * Utility: Check if events need refreshing
 * 
 * Events should be refreshed if:
 * - Never fetched before
 * - Last fetched > 5 minutes ago
 * 
 * @param authorId - Optional author ID
 * @returns boolean
 */
export const shouldRefreshEvents = (authorId?: number): boolean => {
  const state = useEventsStore.getState()
  const lastRefreshed = state.getLastRefreshed(authorId)
  
  if (!lastRefreshed) return true
  
  const lastRefreshedTime = new Date(lastRefreshed).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  return now - lastRefreshedTime > fiveMinutes
}

/**
 * Utility: Get time since last refresh
 * 
 * @param authorId - Optional author ID
 * @returns string - Human-readable time (e.g., "2 minutes ago")
 */
export const getTimeSinceRefresh = (authorId?: number): string | null => {
  const state = useEventsStore.getState()
  const lastRefreshed = state.getLastRefreshed(authorId)
  
  if (!lastRefreshed) return null
  
  const lastRefreshedTime = new Date(lastRefreshed).getTime()
  const now = Date.now()
  const diffMs = now - lastRefreshedTime
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}

export default useEventsStore

