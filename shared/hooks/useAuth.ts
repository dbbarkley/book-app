// Auth Hook - Wrapper around auth store for easier React usage
// Reusable in Next.js and React Native

import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'

/**
 * Hook for authentication state and actions
 * Uses Zustand store for state management
 * 
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, signup, logout } = useAuth()
 * ```
 * 
 * In React Native, the store automatically uses AsyncStorage
 * (after configuring the storage adapter in authStore.ts)
 */
export function useAuth() {
  const store = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand to hydrate from storage before considering auth state
  useEffect(() => {
    // Check if hydration is complete
    if (store._hasHydrated) {
      setIsHydrated(true)
    }
  }, [store._hasHydrated])

  useEffect(() => {
    if (!isHydrated) return

    if (store.isAuthenticated && !store.token && !store.user && !store.loading) {
      // Page reload: isAuthenticated persisted in localStorage but the access token
      // was not (by design). Attempt a silent rotation using the httpOnly refresh
      // cookie (web) or the in-memory refresh token (mobile).
      apiClient.refreshToken()
        .then((data: any) => {
          const newAccess  = data.access_token ?? data.token
          const newRefresh = data.refresh_token ?? null
          store.setTokens(newAccess, newRefresh)
          return store.refreshUser()
        })
        .catch((err: any) => {
          const status = err?.response?.status
          console.warn('[auth] Silent refresh failed on page load', { status, message: err?.message })
          store.logout()
        })
    } else if (store.token && store.isAuthenticated && !store.user && !store.loading) {
      store.refreshUser().catch(() => {
        console.error('Failed to restore user session')
      })
    }
  }, [isHydrated, store.token, store.isAuthenticated, store.user, store.loading])

  /**
   * Signup wrapper that maps name to username
   * This provides a consistent API across web and React Native
   */
  const signup = async (name: string, email: string, password: string, displayName?: string) => {
    return store.register(email, name, password, displayName)
  }

  return {
    user: store.user,
    token: store.token,
    // Consider loading until hydration is complete
    loading: !isHydrated || store.loading,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    signup, // New signup method with name parameter
    register: store.register, // Keep register for backward compatibility
    logout: store.logout,
    refreshUser: store.refreshUser,
    refreshToken: store.refreshToken,
    doTokenRefresh: store.doTokenRefresh,
  }
}
