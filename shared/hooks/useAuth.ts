// Auth Hook - Wrapper around auth store for easier React usage
// Reusable in Next.js and React Native

import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

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

  // Initialize auth on mount - fetch user data if we have a token but no user
  useEffect(() => {
    // Only initialize after hydration is complete
    if (!isHydrated) {
      return
    }

    // If we have a token and are marked as authenticated but no user data, fetch it
    if (store.token && store.isAuthenticated && !store.user && !store.loading) {
      store.refreshUser().catch(() => {
        // Token invalid, will be cleared by store
        console.error('Failed to restore user session')
      })
    }
  }, [isHydrated, store.token, store.isAuthenticated, store.user, store.loading])

  /**
   * Signup wrapper that maps name to username
   * This provides a consistent API across web and React Native
   */
  const signup = async (name: string, email: string, password: string) => {
    // Map name to username (backend expects username)
    return store.register(email, name, password)
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
  }
}
