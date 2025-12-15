// Auth Store - Zustand store for authentication state
// Reusable in Next.js and React Native
// In React Native, use AsyncStorage instead of localStorage

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'
import { apiClient } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshToken: () => Promise<void>
  setToken: (token: string | null) => void
  setHasHydrated: (hydrated: boolean) => void
}

// Storage adapter for web (localStorage) and React Native (AsyncStorage)
// In React Native, replace with AsyncStorage from @react-native-async-storage/async-storage
const getStorage = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return createJSONStorage(() => localStorage)
  }
  // For React Native, you would return:
  // return createJSONStorage(() => AsyncStorage)
  // For SSR, return a no-op storage that will be replaced on client
  return createJSONStorage(() => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated })
      },

      setToken: (token: string | null) => {
        set({ token })
        apiClient.setToken(token)
        if (token) {
          get().refreshUser().catch(() => {
            // If refresh fails, clear token
            set({ token: null, user: null, isAuthenticated: false })
            apiClient.setToken(null)
          })
        } else {
          set({ user: null, isAuthenticated: false })
        }
      },

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const response = await apiClient.login(email, password)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          })
          apiClient.setToken(response.token)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ loading: true })
        try {
          const response = await apiClient.register(email, username, password)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          })
          apiClient.setToken(response.token)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiClient.logout()
        } catch (error) {
          // Continue with logout even if API call fails
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        apiClient.setToken(null)
      },

      refreshUser: async () => {
        const { token } = get()
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }

        set({ loading: true })
        try {
          const user = await apiClient.getCurrentUser()
          
          // Also fetch onboarding status if not in user object
          if (user.onboarding_completed === undefined) {
            try {
              const preferences = await apiClient.getPreferences()
              user.onboarding_completed = preferences.onboarding_completed ?? false
            } catch (error) {
              // If preferences endpoint fails, assume not completed
              user.onboarding_completed = false
            }
          }
          
          set({ user, isAuthenticated: true, loading: false })
        } catch (error) {
          // Token invalid, clear everything
          console.error('Failed to refresh user:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          })
          apiClient.setToken(null)
          throw error
        }
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await apiClient.refreshToken()
          set({ token: response.token })
          apiClient.setToken(response.token)
        } catch (error) {
          // If refresh fails, clear everything
          console.error('Token refresh failed:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          apiClient.setToken(null)
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: getStorage(),
      partialize: (state) => ({
        token: state.token,
        // Don't persist user - fetch fresh on load
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set token in API client
        if (state?.token) {
          apiClient.setToken(state.token)
          // Set a temporary authenticated state so the app knows we're logged in
          // The actual user data will be fetched by the useAuth hook
          state.isAuthenticated = true
        }
        // Mark hydration as complete
        state?.setHasHydrated(true)
      },
    }
  )
)

// Listen for unauthorized events from API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    const store = useAuthStore.getState()
    // Only logout if we actually have a token (avoid loops)
    if (store.token) {
      console.warn('Unauthorized request detected, clearing auth state')
      store.logout()
    }
  })
}

