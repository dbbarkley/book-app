// useBookSuggestions — received suggestions inbox + dismiss action

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { BookSuggestion } from '../types'

interface UseBookSuggestionsReturn {
  suggestions: BookSuggestion[]
  loading: boolean
  error: string | null
  dismissSuggestion: (id: number) => Promise<void>
  refetch: () => Promise<void>
}

export function useBookSuggestions(): UseBookSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getReceivedSuggestions()
      setSuggestions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const dismissSuggestion = useCallback(async (id: number) => {
    await apiClient.dismissSuggestion(id)
    setSuggestions((prev: BookSuggestion[]) => prev.filter((s: BookSuggestion) => s.id !== id))
  }, [])

  return {
    suggestions,
    loading,
    error,
    dismissSuggestion,
    refetch: fetchSuggestions,
  }
}
