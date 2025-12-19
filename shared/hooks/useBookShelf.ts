// Book Shelf Hook - Add/update book shelf status
// Reusable in Next.js and React Native

import { useState } from 'react'
import { useBooksStore } from '../store/booksStore'
import type { BookShelf, UserBook, Book, Visibility } from '../types'

interface UseBookShelfReturn {
  addToShelf: (
    bookId: number,
    shelf: BookShelf,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number }
  ) => Promise<UserBook>
  loading: boolean
  error: string | null
}

/**
 * Hook for managing book shelves (to-read, reading, read)
 * 
 * Usage:
 * ```tsx
 * const { addToShelf, loading } = useBookShelf()
 * 
 * // Add book to shelf (with optional book data for Google Books results)
 * await addToShelf(bookId, 'to_read', book)
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Automatically syncs with Zustand store and backend
 */
export function useBookShelf(): UseBookShelfReturn {
  const { addToShelf: addToShelfStore, loading, error } = useBooksStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const addToShelf = async (
    bookId: number,
    shelf: BookShelf,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number }
  ) => {
    setLocalError(null)
    try {
      return await addToShelfStore(bookId, shelf, bookData, options)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add book to shelf'
      setLocalError(errorMessage)
      throw err
    }
  }

  return {
    addToShelf,
    loading,
    error: error || localError,
  }
}

