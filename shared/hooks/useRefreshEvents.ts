/**
 * useRefreshEvents Hook
 * 
 * Manually triggers a refresh of events from external sources.
 * This calls the backend API which enqueues a Sidekiq job to scrape
 * Eventbrite, Ticketmaster, etc.
 * 
 * Rate Limiting:
 * - Backend rate-limits refreshes (e.g., max once per hour per author)
 * - Handle 429 (Too Many Requests) gracefully
 * 
 * Use Cases:
 * - "Check for new events" button on author profile
 * - Manual refresh on events index page
 * 
 * Features:
 * - Loading state during refresh
 * - Success/error messages
 * - Updates last refreshed timestamp
 * 
 * Usage:
 * ```tsx
 * const { refreshEvents, isRefreshing, error, lastRefreshed } = useRefreshEvents(authorId)
 * 
 * <button onClick={refreshEvents} disabled={isRefreshing}>
 *   {isRefreshing ? 'Checking...' : 'Check for new events'}
 * </button>
 * ```
 */

import { useCallback, useState } from 'react'
import { useEventsStore, getTimeSinceRefresh } from '../store/eventsStore'
import { refreshEvents as refreshEventsAPI } from '../services/eventService'

export const useRefreshEvents = (authorId?: number) => {
  const {
    setRefreshing,
    setLastRefreshed,
    getLastRefreshed,
  } = useEventsStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Get last refreshed time
  const lastRefreshedTimestamp = getLastRefreshed(authorId)
  const lastRefreshed = lastRefreshedTimestamp 
    ? getTimeSinceRefresh(authorId) 
    : null

  // Refresh events
  const refreshEvents = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setRefreshing(true)
      setError(null)
      setSuccessMessage(null)

      const response = await refreshEventsAPI(authorId)

      // Update last refreshed timestamp
      const timestamp = response.last_refreshed_at || new Date().toISOString()
      if (authorId) {
        setLastRefreshed(authorId, timestamp)
      } else {
        setLastRefreshed('global', timestamp)
      }

      // Set success message
      const count = response.events_count
      if (count === 0) {
        setSuccessMessage('No new events found')
      } else {
        setSuccessMessage(`Found ${count} new event${count !== 1 ? 's' : ''}!`)
      }
    } catch (err) {
      // Handle rate limiting
      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit')) {
          setError('Please wait before checking again')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to refresh events')
      }
      console.error('useRefreshEvents error:', err)
    } finally {
      setIsRefreshing(false)
      setRefreshing(false)
    }
  }, [authorId, setRefreshing, setLastRefreshed])

  return {
    refreshEvents,
    isRefreshing,
    error,
    successMessage,
    lastRefreshed,
  }
}

