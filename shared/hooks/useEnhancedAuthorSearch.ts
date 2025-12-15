// Enhanced Author Search Hook - Search authors from both local DB and Google Books API
// Reusable in Next.js and React Native

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { searchAuthors as searchGoogleBooksAuthors } from '../services/googleBooksService'
import type { Author, PaginationMeta } from '../types'

interface UseEnhancedAuthorSearchOptions {
  debounceMs?: number
  initialQuery?: string
  pageSize?: number
  includeGoogleBooks?: boolean
}

interface EnhancedAuthorSearchResult {
  authors: Author[]
  loading: boolean
  error: string | null
  hasMore: boolean
  source: 'local' | 'google' | 'both'
}

/**
 * Hook for searching authors from both local database and Google Books API
 * Combines results from both sources for comprehensive author search
 * 
 * Usage:
 * ```tsx
 * const { authors, loading, search, loadMore, hasMore } = useEnhancedAuthorSearch({
 *   debounceMs: 300,
 *   pageSize: 20,
 *   includeGoogleBooks: true
 * })
 * 
 * // In search input:
 * <input onChange={(e) => search(e.target.value)} />
 * ```
 * 
 * For React Native:
 * - Works the same way with TextInput onChangeText
 * - Ensure apiClient is configured for React Native environment
 */
export function useEnhancedAuthorSearch(options: UseEnhancedAuthorSearchOptions = {}) {
  const {
    debounceMs = 300,
    initialQuery = '',
    pageSize = 20,
    includeGoogleBooks = true,
  } = options

  const [query, setQuery] = useState(initialQuery)
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [source, setSource] = useState<'local' | 'google' | 'both'>('local')

  // Merge and deduplicate authors by name
  const mergeAuthors = useCallback((localAuthors: Author[], googleAuthors: any[]): Author[] => {
    const authorMap = new Map<string, Author>()

    // Add local authors first (they have IDs and can be followed)
    localAuthors.forEach((author) => {
      const key = author.name.toLowerCase().trim()
      authorMap.set(key, author)
    })

    // Add Google Books authors if not already present
    googleAuthors.forEach((googleAuthor) => {
      const key = googleAuthor.name.toLowerCase().trim()
      if (!authorMap.has(key)) {
        // Convert Google Books author to our Author format
        authorMap.set(key, {
          id: 0, // External authors don't have local IDs
          name: googleAuthor.name,
          bio: googleAuthor.bio,
          avatar_url: googleAuthor.avatar_url,
          books_count: googleAuthor.books_count,
          events_count: 0,
          followers_count: 0,
        })
      } else {
        // Update existing author with Google Books data if available
        const existing = authorMap.get(key)!
        if (!existing.bio && googleAuthor.bio) {
          existing.bio = googleAuthor.bio
        }
        if (!existing.books_count && googleAuthor.books_count) {
          existing.books_count = googleAuthor.books_count
        }
      }
    })

    return Array.from(authorMap.values())
  }, [])

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!searchQuery.trim()) {
        setAuthors([])
        setError(null)
        setSource('local')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Search local database
        const localResult = await apiClient.searchAuthors(searchQuery, page, pageSize)
        const localAuthors = localResult.authors || []

        let allAuthors = localAuthors
        let searchSource: 'local' | 'google' | 'both' = 'local'

        // Search Google Books API if enabled
        if (includeGoogleBooks) {
          try {
            const googleAuthors = await searchGoogleBooksAuthors(searchQuery, pageSize)
            
            // Merge results
            allAuthors = mergeAuthors(localAuthors, googleAuthors)
            searchSource = localAuthors.length > 0 && googleAuthors.length > 0 ? 'both' : 'google'
          } catch (googleError) {
            // If Google Books fails, just use local results
            console.warn('Google Books API search failed:', googleError)
            // Continue with local results only
          }
        }

        setAuthors(allAuthors)
        setCurrentPage(page)
        setSource(searchSource)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search authors')
        setAuthors([])
      } finally {
        setLoading(false)
      }
    },
    [pageSize, includeGoogleBooks, mergeAuthors]
  )

  // Debounce the search
  useEffect(() => {
    if (!query.trim()) {
      setAuthors([])
      setSource('local')
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query, 1)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, debounceMs, performSearch])

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    setCurrentPage(1)
  }, [])

  const loadMore = useCallback(() => {
    // For Google Books, we can't easily paginate, so just return
    // Local search pagination could be added here if needed
    if (!loading && query.trim() && source === 'local') {
      performSearch(query, currentPage + 1)
    }
  }, [loading, source, currentPage, query, performSearch])

  const hasMore = source === 'local' && authors.length >= pageSize

  return {
    authors,
    loading,
    error,
    query,
    search,
    loadMore,
    hasMore,
    source,
    refetch: () => performSearch(query, 1),
  } as EnhancedAuthorSearchResult & {
    query: string
    search: (query: string) => void
    loadMore: () => void
    refetch: () => void
  }
}

