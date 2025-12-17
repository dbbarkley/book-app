'use client'

import { useEffect } from 'react'
import { useRecommendationsStore } from '../store/recommendationsStore'

/**
 * Hook for recommended authors data
 * Caches results in Zustand for cross-platform reuse
 */
export function useRecommendedAuthors() {
  const { authors, authorsLoading, authorsError, fetchAuthors, refresh } = useRecommendationsStore((state) => ({
    authors: state.authors,
    authorsLoading: state.authorsLoading,
    authorsError: state.authorsError,
    fetchAuthors: state.fetchAuthors,
    refresh: state.refresh,
  }))

  useEffect(() => {
    fetchAuthors().catch((error) => {
      console.warn('Failed to load recommended authors', error)
    })
  }, [fetchAuthors])

  return {
    authors,
    loading: authorsLoading,
    error: authorsError,
    refresh: refresh,
  }
}

