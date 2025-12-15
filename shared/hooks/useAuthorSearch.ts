// Author Search Hook - Search authors with debounce and pagination
// Reusable in Next.js and React Native

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { Author, PaginationMeta } from '../types'

interface UseAuthorSearchOptions {
  debounceMs?: number
  initialQuery?: string
  pageSize?: number
}

interface AuthorSearchResult {
  authors: Author[]
  pagination?: PaginationMeta
  loading: boolean
  error: string | null
  hasMore: boolean
}

/**
 * Hook for searching authors with debounce and pagination
 * 
 * Usage:
 * ```tsx
 * const { authors, loading, search, loadMore, hasMore } = useAuthorSearch({
 *   debounceMs: 300,
 *   pageSize: 20
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
export function useAuthorSearch(options: UseAuthorSearchOptions = {}) {
  const { debounceMs = 300, initialQuery = '', pageSize = 20 } = options

  const [query, setQuery] = useState(initialQuery)
  const [authors, setAuthors] = useState<Author[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string, page: number = 1, append: boolean = false) => {
      if (!searchQuery.trim()) {
        setAuthors([])
        setPagination(undefined)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.searchAuthors(searchQuery, page, pageSize)
        
        if (append) {
          setAuthors((prev) => [...prev, ...result.authors])
        } else {
          setAuthors(result.authors)
        }
        
        setPagination(result.pagination)
        setCurrentPage(page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search authors')
        if (!append) {
          setAuthors([])
        }
      } finally {
        setLoading(false)
      }
    },
    [pageSize]
  )

  // Debounce the search
  useEffect(() => {
    if (!query.trim()) {
      setAuthors([])
      setPagination(undefined)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query, 1, false)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, debounceMs, performSearch])

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    setCurrentPage(1)
  }, [])

  const loadMore = useCallback(() => {
    if (!loading && pagination && currentPage < pagination.total_pages && query.trim()) {
      performSearch(query, currentPage + 1, true)
    }
  }, [loading, pagination, currentPage, query, performSearch])

  const hasMore = pagination ? currentPage < pagination.total_pages : false

  return {
    authors,
    pagination,
    loading,
    error,
    query,
    search,
    loadMore,
    hasMore,
    refetch: () => performSearch(query, 1, false),
  } as AuthorSearchResult & {
    query: string
    search: (query: string) => void
    loadMore: () => void
    refetch: () => void
  }
}

