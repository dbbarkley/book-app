// Book Details Hook - Fetch book details and user's reading status
// Reusable in Next.js and React Native
// Handles DB books (positive integer ID), Google Books ID strings, ISBN-13/10, and Book objects

/** True for ISBN-13 (13 digits) or ISBN-10 (9 digits + optional X check digit). */
function isIsbn(s: string): boolean {
  return /^\d{13}$/.test(s) || /^\d{9}[\dX]$/i.test(s)
}

import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { useBooksStore } from '../store/booksStore'
import type { Book, UserBook } from '../types'

interface UseBookDetailsReturn {
  book: Book | null
  userBook: UserBook | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching book details and user's reading status.
 *
 * Accepts three forms:
 *   - number > 0  — internal DB book ID  → GET /books/:id
 *   - string      — Google Books ID       → GET /books/by_google/:id (DB hit first, then live fallback)
 *   - Book object — use directly (no network call)
 *   - null        — clears state
 *
 * Hard-refresh safe: string IDs are fetched from the backend on every mount,
 * so the page renders correctly without a Zustand cache.
 */
export function useBookDetails(
  bookIdOrBook: number | string | Book | null
): UseBookDetailsReturn {
  const [book, setBook] = useState<Book | null>(
    typeof bookIdOrBook === 'object' && bookIdOrBook !== null ? bookIdOrBook : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Tracks the resolved internal DB id once a Google-Books-ID fetch completes.
  const [resolvedInternalId, setResolvedInternalId] = useState<number | null>(null)

  const { fetchUserBook, getUserBookByBookId, getSearchResult, getSearchResultByGoogleId } = useBooksStore()

  // Derive a stable key for the effect dependency so it fires when the identifier changes.
  const fetchKey =
    typeof bookIdOrBook === 'string'
      ? bookIdOrBook
      : typeof bookIdOrBook === 'number'
      ? bookIdOrBook
      : (bookIdOrBook as Book | null)?.id ?? null

  // userBook is resolved from the store by whichever internal ID we currently know about.
  const numericBookId =
    typeof bookIdOrBook === 'number' && bookIdOrBook > 0 ? bookIdOrBook : null
  const userBook = getUserBookByBookId(resolvedInternalId ?? numericBookId ?? 0) ?? null

  const fetchBook = async () => {
    // ── Case 1: Book object passed directly ──────────────────────────────────
    if (typeof bookIdOrBook === 'object' && bookIdOrBook !== null) {
      setBook(bookIdOrBook)
      if (bookIdOrBook.id && bookIdOrBook.id > 0) {
        setResolvedInternalId(bookIdOrBook.id)
        try { await fetchUserBook(bookIdOrBook.id) } catch { /* not on shelf */ }
      }
      setLoading(false)
      return
    }

    if (bookIdOrBook === null) {
      setBook(null)
      setResolvedInternalId(null)
      return
    }

    // ── Case 2: Google Books ID string ───────────────────────────────────────
    if (typeof bookIdOrBook === 'string') {
      // Open Library fallback IDs (ol_XXXXX) cannot be resolved via the Rails
      // by_google endpoint. Check the client-side Zustand cache first — it will
      // always be populated when the user navigated here from the search results.
      // If the cache misses (hard-refresh / direct link), we try a live title search
      // via our proxy so the page still works without a stale URL.
      if (bookIdOrBook.startsWith('ol_')) {
        // Check Zustand cache first (populated when user navigated from a results page).
        const cached = getSearchResultByGoogleId(bookIdOrBook)
        if (cached) {
          setBook(cached)
          setLoading(false)
          return
        }
        // Cache miss — OL IDs are stored in book_catalog.google_books_id, so
        // show_by_google can resolve them. Try the backend before any live fallback.
        setLoading(true)
        setError(null)
        try {
          const bookData = await apiClient.getBookByGoogleId(bookIdOrBook)
          setBook(bookData)
          if (bookData?.id && bookData.id > 0) {
            setResolvedInternalId(bookData.id)
            try { await fetchUserBook(bookData.id) } catch { /* not on shelf */ }
          }
          setLoading(false)
          return
        } catch {
          // Not in book_catalog yet — fall through to live OL lookup.
        }
        try {
          const olWorkId = bookIdOrBook.replace(/^ol_/, '') // e.g. "41943074W"
          const olRes = await fetch(`https://openlibrary.org/works/OL${olWorkId}.json`)
          if (olRes.ok) {
            const olData = await olRes.json()
            const title = olData.title as string | undefined
            if (title) {
              const resolved: Book = {
                id: null,
                google_books_id: bookIdOrBook,
                title,
                author_name: undefined,
                cover_image_url: undefined,
                description: undefined,
                release_date: undefined,
                page_count: undefined,
                isbn: undefined,
              }
              setBook(resolved)
              setLoading(false)
              return
            }
          }
        } catch {
          // Fall through to error state
        }
        setError('This book link has expired. Please search for the book to view it.')
        setLoading(false)
        return
      }

      // ── ISBN-13 / ISBN-10 ─────────────────────────────────────────────────────
      // ISBNdb-sourced IDs (e.g. from Upcoming Releases) are pure numeric ISBN
      // strings, not Google Books volume IDs. Route them to the dedicated endpoint
      // so we get DB → UpcomingRelease → Google Books fallback in that order.
      if (isIsbn(bookIdOrBook)) {
        setLoading(true)
        setError(null)
        try {
          const bookData = await apiClient.getBookByIsbn(bookIdOrBook)
          setBook(bookData)
          if (bookData?.id && bookData.id > 0) {
            setResolvedInternalId(bookData.id)
            try { await fetchUserBook(bookData.id) } catch { /* not on shelf */ }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch book details')
          setBook(null)
        } finally {
          setLoading(false)
        }
        return
      }

      // Check the client-side cache first — populated by search results and the
      // barcode scanner. If we have the book already, skip the network round-trip.
      const cachedByGoogleId = getSearchResultByGoogleId(bookIdOrBook)
      if (cachedByGoogleId) {
        setBook(cachedByGoogleId)
        if (cachedByGoogleId.id && cachedByGoogleId.id > 0) {
          setResolvedInternalId(cachedByGoogleId.id)
          try { await fetchUserBook(cachedByGoogleId.id) } catch { /* not on shelf */ }
        }
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const bookData = await apiClient.getBookByGoogleId(bookIdOrBook)
        setBook(bookData)
        // If the book was found in our DB it has a real internal id
        if (bookData?.id && bookData.id > 0) {
          setResolvedInternalId(bookData.id)
          try { await fetchUserBook(bookData.id) } catch { /* not on shelf */ }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch book details')
        setBook(null)
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Case 3: Numeric ID ───────────────────────────────────────────────────
    const bookId = bookIdOrBook as number

    if (!bookId) {
      setBook(null)
      return
    }

    // Negative IDs are legacy cached Google Books results — look up in store
    if (bookId < 0) {
      const cachedBook = getSearchResult(bookId)
      if (cachedBook) {
        setBook(cachedBook)
        setLoading(false)
      } else {
        setError('Book not found. Please search again.')
        setLoading(false)
      }
      return
    }

    // Positive numeric ID → fetch from our DB
    setLoading(true)
    setError(null)
    try {
      const bookData = await apiClient.getBook(bookId)
      setBook(bookData)
      setResolvedInternalId(bookId)
      try { await fetchUserBook(bookId) } catch { /* not on shelf */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch book details')
      setBook(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setResolvedInternalId(null)
    fetchBook()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey])

  return {
    book,
    userBook,
    loading,
    error,
    refetch: fetchBook,
  }
}
