'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'

export function useNewReleases() {
  const [genreGroups, setGenreGroups] = useState<Array<{ genre: string, books: any[] }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getNewReleases()
        setGenreGroups(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch new releases')
      } finally {
        setLoading(false)
      }
    }

    fetchNewReleases()
  }, [])

  return { genreGroups, loading, error }
}

