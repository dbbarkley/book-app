'use client'

import { useState, useCallback, useMemo } from 'react'
import { apiClient } from '../api/client'
import type { Book } from '../types'

// Maximum number of seed books the user can pick
const MAX_SEEDS = 3

/**
 * useBookSimilarity
 *
 * Manages the "Find My Next Book" flow.
 *
 * Progressive loading: the moment a seed book is added, we fire a request to
 * the backend immediately — before the user taps "Find". By the time they do,
 * results are likely already cached in memory and the experience feels instant.
 *
 * Merge logic: books that appear as similar to multiple seeds are ranked higher.
 * A book matching 2 seeds beats one matching only 1, regardless of order.
 */
export function useBookSimilarity() {
  // Ordered list of books the user has selected as seeds
  const [seeds, setSeeds] = useState<Book[]>([])

  // Per-seed results keyed by book id (string for Map stability)
  const [resultsByBookId, setResultsByBookId] = useState<Map<string, Book[]>>(new Map())

  // Set of book ids whose requests are still in flight
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  // Any fetch error (non-blocking — partial results are still shown)
  const [error, setError] = useState<string | null>(null)

  // Whether the user has explicitly tapped "Find My Next Book"
  const [showResults, setShowResults] = useState(false)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const bookKey = (book: Book) =>
    String(book.id ?? book.google_books_id ?? book.isbn ?? book.title)

  // ── Add seed (fires fetch immediately) ────────────────────────────────────

  const addSeed = useCallback(async (book: Book) => {
    const key = bookKey(book)

    setSeeds(prev => {
      if (prev.length >= MAX_SEEDS) return prev
      if (prev.some(s => bookKey(s) === key)) return prev
      return [...prev, book]
    })

    // Only fetch if the book has a real DB id (required by the endpoint)
    if (!book.id) return
    // Don't re-fetch if already loading or already have results
    if (loadingIds.has(key)) return
    if (resultsByBookId.has(key)) return

    setLoadingIds(prev => new Set(prev).add(key))
    setError(null)

    try {
      const similar = await apiClient.getSimilarBooks(book.id as number)
      setResultsByBookId(prev => new Map(prev).set(key, similar))
    } catch (e) {
      setError('Could not fetch similar books for one of your selections.')
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [loadingIds, resultsByBookId])

  // ── Remove seed ───────────────────────────────────────────────────────────

  const removeSeed = useCallback((book: Book) => {
    const key = bookKey(book)
    setSeeds(prev => prev.filter(s => bookKey(s) !== key))
    // Keep cached results — if the user re-selects the same book it's instant
  }, [])

  // ── Commit: user tapped "Find My Next Book" ───────────────────────────────

  const commit = useCallback(() => {
    if (seeds.length < 2) return
    setShowResults(true)
  }, [seeds])

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setSeeds([])
    setResultsByBookId(new Map())
    setLoadingIds(new Set())
    setError(null)
    setShowResults(false)
  }, [])

  // ── Merged results (computed) ─────────────────────────────────────────────
  //
  // Build a frequency map across all seed results.
  // Books appearing for multiple seeds rank higher (they cross genre lines).
  // Deduplicated by isbn > google_books_id > title.

  const mergedResults = useMemo<Book[]>(() => {
    type Entry = { book: Book; count: number }
    const freq = new Map<string, Entry>()

    for (const books of resultsByBookId.values()) {
      for (const book of books) {
        const key =
          book.isbn ||
          book.google_books_id ||
          book.title?.toLowerCase().trim() ||
          ''
        if (!key) continue

        const existing = freq.get(key)
        if (existing) {
          existing.count++
        } else {
          freq.set(key, { book, count: 1 })
        }
      }
    }

    return Array.from(freq.values())
      .sort((a, b) => b.count - a.count)
      .map(e => e.book)
  }, [resultsByBookId])

  // ── Derived state ─────────────────────────────────────────────────────────

  const isLoading  = loadingIds.size > 0
  const canCommit  = seeds.length >= 2 && !isLoading
  const hasResults = mergedResults.length > 0

  return {
    // Seed management
    seeds,
    addSeed,
    removeSeed,
    canAddMore: seeds.length < MAX_SEEDS,
    maxSeeds:   MAX_SEEDS,

    // Fetching state
    isLoading,
    loadingIds,
    error,

    // Results
    mergedResults,
    hasResults,

    // Flow control
    canCommit,
    showResults,
    commit,
    reset,
  }
}
