import { create } from 'zustand'
import { apiClient } from '../api/client'
import type { RecommendedBook, RecommendedAuthor } from '../types'

interface RecommendationsState {
  books: RecommendedBook[]
  authors: RecommendedAuthor[]
  booksLoading: boolean
  authorsLoading: boolean
  booksError: string | null
  authorsError: string | null
  fetchBooks: () => Promise<void>
  fetchAuthors: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Zustand store for caching recommended books and authors
 * Reusable in Next.js and React Native
 */
export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  books: [],
  authors: [],
  booksLoading: false,
  authorsLoading: false,
  booksError: null,
  authorsError: null,

  fetchBooks: async () => {
    set({ booksLoading: true, booksError: null })
    try {
      const books = await apiClient.getRecommendedBooks()
      set({ books, booksLoading: false })
    } catch (error) {
      set({
        booksError: error instanceof Error ? error.message : 'Failed to load recommended books',
        booksLoading: false,
      })
    }
  },

  fetchAuthors: async () => {
    set({ authorsLoading: true, authorsError: null })
    try {
      const authors = await apiClient.getRecommendedAuthors()
      set({ authors, authorsLoading: false })
    } catch (error) {
      set({
        authorsError: error instanceof Error ? error.message : 'Failed to load recommended authors',
        authorsLoading: false,
      })
    }
  },

  refresh: async () => {
    try {
      await Promise.all([get().fetchBooks(), get().fetchAuthors()])
    } catch (error) {
      console.warn('Failed to refresh recommendations', error)
    }
  },
}))

