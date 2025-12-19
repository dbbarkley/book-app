// Books Store - Zustand store for user books, shelves, and reading progress
// Reusable in Next.js and React Native
// Manages user's book shelves (to-read, reading, read) and reading progress

import { create } from 'zustand'
import type { UserBook, ShelfStatus, Visibility, Book, PaginationMeta } from '../types'
import { apiClient } from '../api/client'
import { useRecommendationsStore } from './recommendationsStore'

interface BooksState {
  // User books by book ID for quick lookup
  userBooks: Record<number, UserBook>
  bookIdRedirectMap: Record<number, number>
  // Search results cache (includes Google Books results)
  searchResults: Record<number, Book>
  searchPagination: PaginationMeta | null
  // Loading states
  loading: boolean
  searchLoading: boolean
  error: string | null
  // Actions
  fetchUserBook: (bookId: number) => Promise<UserBook | null>
  addToShelf: (
    bookId: number,
    status: ShelfStatus,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number }
  ) => Promise<UserBook>
  updateProgress: (
    userBookId: number,
    updates: {
      status?: ShelfStatus
      visibility?: Visibility
      dnf_reason?: string
      dnf_page?: number
      pages_read?: number
      total_pages?: number
      completion_percentage?: number
      rating?: number
      review?: string
    }
  ) => Promise<UserBook>
  updateVisibility: (userBookId: number, visibility: Visibility) => Promise<UserBook>
  saveReview: (userBookId: number, rating: number, review?: string) => Promise<UserBook>
  getUserBooks: (params?: {
    shelf?: ShelfStatus
    visibility?: Visibility
    page?: number
    perPage?: number
  }) => Promise<UserBook[]>
  // Search result management
  cacheSearchResults: (books: Book[]) => void
  getSearchResult: (bookId: number) => Book | null
  clearSearchResults: () => void
  // Helpers
  getUserBookByBookId: (bookId: number) => UserBook | null
  getShelfBooks: (status: ShelfStatus) => UserBook[]
}

const normalizeUserBook = (userBook: UserBook): UserBook => {
  return {
    ...userBook,
    shelf: userBook.status ?? userBook.shelf,
    visibility: userBook.visibility ?? 'public',
  }
}

/**
 * Zustand store for managing user books, shelves, and reading progress
 * 
 * Usage:
 * ```tsx
 * const { userBooks, addToShelf, updateProgress } = useBooksStore()
 * 
 * // Add book to shelf
 * await addToShelf(bookId, 'to_read')
 * 
 * // Update reading progress
 * await updateProgress(bookId, { pages_read: 100, total_pages: 300 })
 * ```
 * 
 * For React Native:
 * - Works the same way, just import and use
 * - Consider adding persistence with AsyncStorage if needed
 */
export const useBooksStore = create<BooksState>((set, get) => ({
  userBooks: {},
  bookIdRedirectMap: {},
  searchResults: {},
  searchPagination: null,
  loading: false,
  searchLoading: false,
  error: null,

  fetchUserBook: async (bookId: number) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.getUserBook(bookId)
      const normalized = normalizeUserBook(userBook)
      set((state) => {
        const redirectMap =
          bookId !== normalized.book_id
            ? {
                ...state.bookIdRedirectMap,
                [bookId]: normalized.book_id,
              }
            : state.bookIdRedirectMap

        return {
          userBooks: {
            ...state.userBooks,
            [normalized.book_id]: normalized,
          },
          bookIdRedirectMap: redirectMap,
          loading: false,
        }
      })
      return normalized
    } catch (error) {
      // If book is not on user's shelf, return null (not an error)
      if (error instanceof Error && error.message.includes('404')) {
        set({ loading: false })
        return null
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user book',
        loading: false,
      })
      return null
    }
  },

  addToShelf: async (
    bookId: number,
    status: ShelfStatus,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number }
  ) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.addBookToShelf(bookId, status, bookData, options)
      const normalized = normalizeUserBook(userBook)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [normalized.book_id]: normalized,
        },
        loading: false,
      }))
      useRecommendationsStore
        .getState()
        .refresh()
        .catch((error) => {
          console.warn('Failed to refresh recommendations after shelf update', error)
        })
      return normalized
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add book to shelf',
        loading: false,
      })
      throw error
    }
  },

  updateProgress: async (userBookId: number, updates) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.updateBookProgress(userBookId, updates)
      const normalized = normalizeUserBook(userBook)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [normalized.book_id]: normalized,
        },
        loading: false,
      }))
      useRecommendationsStore
        .getState()
        .refresh()
        .catch((error) => {
          console.warn('Failed to refresh recommendations after updating progress', error)
        })
      return normalized
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update progress',
        loading: false,
      })
      throw error
    }
  },
  updateVisibility: async (userBookId: number, visibility: Visibility) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.updateBookVisibility(userBookId, visibility)
      const normalized = normalizeUserBook(userBook)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [normalized.book_id]: normalized,
        },
        loading: false,
      }))
      return normalized
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update visibility',
        loading: false,
      })
      throw error
    }
  },

  saveReview: async (userBookId: number, rating: number, review?: string) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.saveBookReview(userBookId, rating, review)
      const normalized = normalizeUserBook(userBook)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [normalized.book_id]: normalized,
        },
        loading: false,
      }))
      useRecommendationsStore
        .getState()
        .refresh()
        .catch((error) => {
          console.warn('Failed to refresh recommendations after saving review', error)
        })
      return userBook
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save review',
        loading: false,
      })
      throw error
    }
  },

  getUserBooks: async ({
    shelf,
    visibility,
    page,
    perPage,
  }: {
    shelf?: ShelfStatus
    visibility?: Visibility
    page?: number
    perPage?: number
  } = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.getUserBooks({
        shelf,
        visibility,
        page,
        per_page: perPage,
      })
      const userBooksMap: Record<number, UserBook> = {}
      response.user_books.forEach((ub) => {
        const normalized = normalizeUserBook(ub)
        userBooksMap[normalized.book_id] = normalized
      })
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          ...userBooksMap,
        },
        loading: false,
      }))
      return response.user_books.map(normalizeUserBook)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user books',
        loading: false,
      })
      return []
    }
  },

  clearSearchResults: () => {
    set({ searchResults: {}, searchPagination: null })
  },

  cacheSearchResults: (books: Book[]) => {
    const resultsMap: Record<number, Book> = {}
    books.forEach((book) => {
      resultsMap[book.id] = book
    })
    set((state) => ({
      searchResults: {
        ...state.searchResults,
        ...resultsMap,
      },
    }))
  },

  getSearchResult: (bookId: number) => {
    return get().searchResults[bookId] || null
  },

  getUserBookByBookId: (bookId: number) => {
    return get().userBooks[bookId] || null
  },

  getShelfBooks: (status: ShelfStatus, visibility?: Visibility) => {
    return Object.values(get().userBooks).filter(
      (ub) => ub.status === status && (visibility ? ub.visibility === visibility : true)
    )
  },
}))

