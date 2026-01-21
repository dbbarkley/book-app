'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'

export function useComingSoon() {
  const [comingSoon, setComingSoon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComingSoon = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getComingSoon()
        setComingSoon(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch coming soon books')
      } finally {
        setLoading(false)
      }
    }

    fetchComingSoon()
  }, [])

  return { comingSoon, loading, error }
}

