// Books Store - Zustand store for user books, shelves, and reading progress
// Reusable in Next.js and React Native
// Manages user's book shelves (to-read, reading, read) and reading progress

import { create } from 'zustand'
import type { UserBook, BookShelf, Book, PaginationMeta } from '../types'
import { apiClient } from '../api/client'
import { useRecommendationsStore } from './recommendationsStore'

interface BooksState {
  // User books by book ID for quick lookup
  userBooks: Record<number, UserBook>
  // Search results cache (includes Google Books results)
  searchResults: Record<number, Book>
  searchPagination: PaginationMeta | null
  // Loading states
  loading: boolean
  searchLoading: boolean
  error: string | null
  // Actions
  fetchUserBook: (bookId: number) => Promise<UserBook | null>
  addToShelf: (bookId: number, shelf: BookShelf, bookData?: Book) => Promise<UserBook>
  updateProgress: (
    bookId: number,
    updates: {
      shelf?: BookShelf
      pages_read?: number
      total_pages?: number
      completion_percentage?: number
      rating?: number
      review?: string
    }
  ) => Promise<UserBook>
  saveReview: (bookId: number, rating: number, review?: string) => Promise<UserBook>
  getUserBooks: (shelf?: BookShelf, page?: number, perPage?: number) => Promise<UserBook[]>
  // Search result management
  cacheSearchResults: (books: Book[]) => void
  getSearchResult: (bookId: number) => Book | null
  clearSearchResults: () => void
  // Helpers
  getUserBookByBookId: (bookId: number) => UserBook | null
  getShelfBooks: (shelf: BookShelf) => UserBook[]
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
  searchResults: {},
  searchPagination: null,
  loading: false,
  searchLoading: false,
  error: null,

  fetchUserBook: async (bookId: number) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.getUserBook(bookId)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [bookId]: userBook,
        },
        loading: false,
      }))
      return userBook
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

  addToShelf: async (bookId: number, shelf: BookShelf, bookData?: Book) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.addBookToShelf(bookId, shelf, bookData)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [userBook.book_id]: userBook,
        },
        loading: false,
      }))
      useRecommendationsStore
        .getState()
        .refresh()
        .catch((error) => {
          console.warn('Failed to refresh recommendations after shelf update', error)
        })
      return userBook
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add book to shelf',
        loading: false,
      })
      throw error
    }
  },

  updateProgress: async (bookId: number, updates) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.updateBookProgress(bookId, updates)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [bookId]: userBook,
        },
        loading: false,
      }))
      useRecommendationsStore
        .getState()
        .refresh()
        .catch((error) => {
          console.warn('Failed to refresh recommendations after updating progress', error)
        })
      return userBook
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update progress',
        loading: false,
      })
      throw error
    }
  },

  saveReview: async (bookId: number, rating: number, review?: string) => {
    set({ loading: true, error: null })
    try {
      const userBook = await apiClient.saveBookReview(bookId, rating, review)
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          [bookId]: userBook,
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

  getUserBooks: async (shelf?: BookShelf, page = 1, perPage = 20) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.getUserBooks({ shelf, page, per_page: perPage })
      const userBooksMap: Record<number, UserBook> = {}
      response.user_books.forEach((ub) => {
        userBooksMap[ub.book_id] = ub
      })
      set((state) => ({
        userBooks: {
          ...state.userBooks,
          ...userBooksMap,
        },
        loading: false,
      }))
      return response.user_books
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

  getShelfBooks: (shelf: BookShelf) => {
    return Object.values(get().userBooks).filter((ub) => ub.shelf === shelf)
  },
}))

