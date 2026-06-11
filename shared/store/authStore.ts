// Auth Store - Zustand store for authentication state
// Reusable in Next.js and React Native

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'
import { apiClient } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null          // short-lived access token (15 min)
  refreshToken: string | null   // long-lived refresh token (90 days)
  loading: boolean
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  doTokenRefresh: () => Promise<void>
  setToken: (token: string | null) => void
  setTokens: (access: string | null, refresh: string | null) => void
  setHasHydrated: (hydrated: boolean) => void
  updateUser: (updates: Partial<User>) => void
}

const getStorage = () => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return createJSONStorage(() => localStorage)
  }
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
      refreshToken: null,
      loading: false,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }))
      },

      // Legacy single-token setter — used by useAppInit on mobile.
      // Sets access token and kicks off a user refresh in the background.
      setToken: (token: string | null) => {
        set({ token })
        apiClient.setToken(token)
        if (token) {
          get().refreshUser().catch(() => {
            set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
            apiClient.setTokens(null, null)
          })
        } else {
          set({ user: null, isAuthenticated: false })
        }
      },

      setTokens: (access: string | null, refresh: string | null) => {
        set({ token: access, refreshToken: refresh })
        apiClient.setTokens(access, refresh)
      },

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const response = await apiClient.login(email, password)
          const access  = (response as any).access_token ?? response.token
          const refresh = (response as any).refresh_token ?? null
          set({
            user: response.user,
            token: access,
            refreshToken: refresh,
            isAuthenticated: true,
            loading: false,
          })
          apiClient.setTokens(access, refresh)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (email: string, username: string, password: string, displayName?: string) => {
        set({ loading: true })
        try {
          const response = await apiClient.register(email, username, password, displayName)
          const access  = (response as any).access_token ?? response.token
          const refresh = (response as any).refresh_token ?? null
          set({
            user: response.user,
            token: access,
            refreshToken: refresh,
            isAuthenticated: true,
            loading: false,
          })
          apiClient.setTokens(access, refresh)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiClient.logout()
        } catch {
          // Continue even if the server call fails
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        apiClient.setTokens(null, null)
      },

      refreshUser: async () => {
        const { token } = get()
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }
        set({ loading: true })
        try {
          // /auth/me now returns favourite_authors and preferences.author_ids
          // directly, so a single request is all we need.
          const user = await apiClient.getCurrentUser()

          if (user.onboarding_completed === undefined) {
            user.onboarding_completed = false
          }

          // Ensure favourite_authors is always an array (guards against older
          // API responses or unexpected nulls).
          if (!Array.isArray(user.favourite_authors)) {
            user.favourite_authors = []
          }

          set({ user, isAuthenticated: true, loading: false })
        } catch (error) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
          })
          apiClient.setTokens(null, null)
          throw error
        }
      },

      // Proactively rotate the token pair (call on app foreground to keep the
      // 90-day refresh window rolling). The silent refresh interceptor handles
      // reactive rotation when a request returns 401.
      doTokenRefresh: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return
        try {
          const response = await apiClient.refreshToken()
          const newAccess  = (response as any).access_token ?? response.token
          const newRefresh = (response as any).refresh_token ?? refreshToken
          set({ token: newAccess, refreshToken: newRefresh })
          apiClient.setTokens(newAccess, newRefresh)
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
          apiClient.setTokens(null, null)
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: getStorage(),
      // Only persist the refresh token. The access token is short-lived (15 min)
      // and will be obtained via silent refresh on the first API call.
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.refreshToken) {
          apiClient.setRefreshToken(state.refreshToken)
          // Optimistic auth — the first API call will silently exchange the
          // refresh token for a new access token via the interceptor.
          state.isAuthenticated = true
        }
        state?.setHasHydrated(true)
      },
    }
  )
)

// When the API client silently rotates tokens, propagate back to the store
// so the subscribe() listener in useAppInit writes to SecureStore.
apiClient.setOnTokenRotation((access, refresh) => {
  useAuthStore.setState({ token: access, refreshToken: refresh })
})

// Web only: force logout after all refresh attempts are exhausted
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('auth:unauthorized', () => {
    const store = useAuthStore.getState()
    if (store.token || store.refreshToken) {
      store.logout()
    }
  })
}
