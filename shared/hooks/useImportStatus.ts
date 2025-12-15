import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'

interface ImportStatus {
  id: number
  source: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filename: string
  total_books: number
  processed_books: number
  successful_imports: number
  failed_imports: number
  progress_percentage: number
  metadata: Record<string, any>
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

/**
 * Hook for polling import status
 * 
 * Automatically polls the backend until import is completed or failed
 * Poll interval increases as import progresses to reduce server load
 * 
 * @param importId - The ID of the import to track
 * @param enabled - Whether to start polling (default: true)
 */
export function useImportStatus(importId: number | null, enabled: boolean = true) {
  const [status, setStatus] = useState<ImportStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!importId) return

    setIsLoading(true)
    setError(null)

    try {
      const importStatus = await apiClient.getImportStatus(importId)
      setStatus(importStatus)
      return importStatus
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch import status'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [importId])

  useEffect(() => {
    if (!importId || !enabled) return

    // Initial fetch
    fetchStatus()

    // Set up polling
    // Poll more frequently at the start, then slow down
    let pollInterval = 2000 // Start with 2 seconds
    let intervalId: NodeJS.Timeout

    const setupPolling = () => {
      intervalId = setInterval(async () => {
        const currentStatus = await fetchStatus()
        
        // Stop polling if completed or failed
        if (currentStatus?.status === 'completed' || currentStatus?.status === 'failed') {
          clearInterval(intervalId)
          return
        }

        // Increase poll interval as we go (max 10 seconds)
        pollInterval = Math.min(pollInterval + 1000, 10000)
      }, pollInterval)
    }

    setupPolling()

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [importId, enabled, fetchStatus])

  const refetch = useCallback(() => {
    return fetchStatus()
  }, [fetchStatus])

  return {
    status,
    isLoading,
    error,
    refetch,
    isCompleted: status?.status === 'completed',
    isFailed: status?.status === 'failed',
    isProcessing: status?.status === 'processing',
    isPending: status?.status === 'pending',
  }
}

