// Authors Store - Zustand store for author search results and caching
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type { Author } from '../types'

interface AuthorsState {
  // Search results cache
  searchResults: Record<string, Author[]>
  searchQueries: string[]
  maxCacheSize: number

  // Cached author profiles
  authorProfiles: Record<number, Author>

  // Actions
  setSearchResults: (query: string, authors: Author[]) => void
  getSearchResults: (query: string) => Author[] | null
  clearSearchResults: () => void
  setAuthorProfile: (author: Author) => void
  getAuthorProfile: (authorId: number) => Author | null
  clearAuthorProfile: (authorId: number) => void
  clearAllProfiles: () => void
}

/**
 * Zustand store for author search results and profile caching
 * 
 * Usage:
 * ```tsx
 * const { setSearchResults, getSearchResults } = useAuthorsStore()
 * 
 * // Cache search results
 * setSearchResults(query, authors)
 * 
 * // Retrieve cached results
 * const cached = getSearchResults(query)
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Consider adding persistence with AsyncStorage for offline support
 */
export const useAuthorsStore = create<AuthorsState>((set, get) => ({
  searchResults: {},
  searchQueries: [],
  maxCacheSize: 10,
  authorProfiles: {},

  setSearchResults: (query: string, authors: Author[]) => {
    const state = get()
    const queries = [...state.searchQueries]

    // Remove query if it already exists
    const existingIndex = queries.indexOf(query)
    if (existingIndex !== -1) {
      queries.splice(existingIndex, 1)
    }

    // Add to front
    queries.unshift(query)

    // Limit cache size
    if (queries.length > state.maxCacheSize) {
      const removedQuery = queries.pop()
      if (removedQuery) {
        const newResults = { ...state.searchResults }
        delete newResults[removedQuery]
        set({
          searchResults: newResults,
          searchQueries: queries,
        })
        return
      }
    }

    set({
      searchResults: {
        ...state.searchResults,
        [query]: authors,
      },
      searchQueries: queries,
    })
  },

  getSearchResults: (query: string) => {
    return get().searchResults[query] || null
  },

  clearSearchResults: () => {
    set({
      searchResults: {},
      searchQueries: [],
    })
  },

  setAuthorProfile: (author: Author) => {
    set({
      authorProfiles: {
        ...get().authorProfiles,
        [author.id]: author,
      },
    })
  },

  getAuthorProfile: (authorId: number) => {
    return get().authorProfiles[authorId] || null
  },

  clearAuthorProfile: (authorId: number) => {
    const profiles = { ...get().authorProfiles }
    delete profiles[authorId]
    set({ authorProfiles: profiles })
  },

  clearAllProfiles: () => {
    set({ authorProfiles: {} })
  },
}))

