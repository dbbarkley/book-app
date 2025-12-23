import { useState, useEffect, useCallback } from 'react'
import { getVenues } from '../services/eventService'
import type { Venue } from '../types'

export const useVenues = (params?: { city?: string; state?: string; zipcode?: string }) => {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVenues = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getVenues(params)
      setVenues(response.venues || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues')
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  return { venues, isLoading, error, refetch: fetchVenues }
}

