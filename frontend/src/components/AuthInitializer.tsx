'use client'

/**
 * AuthInitializer - Component to initialize authentication on app load
 * 
 * This component:
 * - Waits for Zustand store hydration
 * - Refreshes the authentication token periodically
 * - Handles token refresh on focus/visibility change
 * - Ensures auth state is consistent across page navigations
 */

import { useEffect, useRef } from 'react'
import { useAuth, useAuthStore } from '@book-app/shared'

export default function AuthInitializer() {
  const { token, doTokenRefresh, isAuthenticated } = useAuth()
  const hasHydrated = useAuthStore(s => s._hasHydrated)
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const lastRefreshRef = useRef<number>(Date.now())

  // Sync a non-sensitive session cookie so Next.js middleware can gate
  // protected routes server-side without touching localStorage.
  useEffect(() => {
    if (!hasHydrated) return
    if (isAuthenticated) {
      document.cookie = `session=1; Path=/; SameSite=Strict; Max-Age=${90 * 24 * 60 * 60}`
    } else {
      document.cookie = 'session=; Path=/; SameSite=Strict; Max-Age=0'
    }
  }, [isAuthenticated, hasHydrated])

  // Refresh token periodically (every 7 days) to keep it fresh
  // Token expires after 30 days, so this ensures continuous sessions
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      return
    }

    const REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    const MIN_REFRESH_GAP = 60 * 1000 // Don't refresh more than once per minute

    const performRefresh = async () => {
      const now = Date.now()
      // Prevent too frequent refreshes
      if (now - lastRefreshRef.current < MIN_REFRESH_GAP) {
        return
      }
      
      lastRefreshRef.current = now
      try {
        await doTokenRefresh()
      } catch (error) {
        console.error('Failed to refresh token:', error)
      }
    }

    // Initial refresh on mount if authenticated
    performRefresh()

    // Set up periodic refresh
    refreshIntervalRef.current = setInterval(performRefresh, REFRESH_INTERVAL)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [isAuthenticated, token, doTokenRefresh])

  // Refresh token when app comes back into focus
  useEffect(() => {
    if (!isAuthenticated || !token) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App became visible, refresh token if it's been a while
        const now = Date.now()
        const timeSinceLastRefresh = now - lastRefreshRef.current
        const ONE_HOUR = 60 * 60 * 1000

        if (timeSinceLastRefresh > ONE_HOUR) {
          lastRefreshRef.current = now
          doTokenRefresh().catch((error) => {
            console.error('Failed to refresh token on visibility change:', error)
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, token, doTokenRefresh])

  // This component doesn't render anything
  return null
}

