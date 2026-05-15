/**
 * useAppInit
 *
 * Bootstraps the app on first render:
 *  1. Reads both the access token and refresh token from SecureStore
 *  2. Sets both tokens + isAuthenticated optimistically so the route guard never
 *     sees a false-unauthenticated window while refreshUser runs in background
 *  3. Kicks off refreshUser to fetch fresh user data (non-blocking).
 *     If the access token has expired, the silent refresh interceptor will
 *     automatically exchange the refresh token for a new pair.
 *  4. Subscribes to future token changes so the store and SecureStore stay in sync
 *  5. Sets `_hasHydrated` so the root layout can unhide content
 *
 * Call once, at the root layout level.
 *
 * Why optimistic auth?
 * refreshUser() is async — if we waited for it to complete before setting
 * isAuthenticated=true, every Expo Fast Refresh would briefly show the login
 * screen. Setting isAuthenticated=true as soon as we find a stored token
 * prevents that flash. If both tokens are expired, refreshUser clears state.
 *
 * Why persist the refresh token?
 * The access token is short-lived (15 min). On a typical app resume the
 * access token will be expired, but the 90-day refresh token is still valid.
 * The silent refresh interceptor in apiClient handles the exchange
 * transparently — the user never sees a login screen.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore, apiClient } from '@book-app/shared'
import { secureStorage } from '@/storage/secureStorage'
import { STORAGE_KEYS } from '@/constants/config'

export function useAppInit() {
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated)
  const initialised    = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    ;(async () => {
      try {
        // Read both tokens in parallel — access token may be expired but
        // refresh token allows silent re-auth without a login screen.
        const [accessToken, refreshToken] = await Promise.all([
          secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        ])

        if (accessToken || refreshToken) {
          // 1. Set tokens + optimistic auth state before hydration so the
          //    route guard never redirects to login during the network call.
          useAuthStore.setState({
            token:           accessToken,
            refreshToken:    refreshToken,
            isAuthenticated: true,
          })
          apiClient.setTokens(accessToken, refreshToken)

          // 2. Fetch fresh user data in the background.
          //    If the access token is expired, the interceptor will silently
          //    exchange the refresh token first. If both are expired, this
          //    rejects and we clear auth state.
          useAuthStore.getState().refreshUser().catch(() => {
            useAuthStore.setState({
              token:           null,
              refreshToken:    null,
              user:            null,
              isAuthenticated: false,
            })
            apiClient.setTokens(null, null)
            Promise.all([
              secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
              secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
            ]).catch(() => {})
          })
        }
      } catch (err) {
        console.warn('[useAppInit] Failed to read tokens from SecureStore:', err)
      } finally {
        // 3. Signal that the auth bootstrap is done — layout can now render.
        setHasHydrated(true)
      }
    })()

    // Mirror token changes back to SecureStore (covers login, logout, silent refresh).
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      // Access token changed
      if (state.token !== prev.token) {
        if (state.token) {
          secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, state.token).catch(() => {})
        } else {
          secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN).catch(() => {})
        }
      }

      // Refresh token changed
      if (state.refreshToken !== prev.refreshToken) {
        if (state.refreshToken) {
          secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, state.refreshToken).catch(() => {})
        } else {
          secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {})
        }
      }
    })

    return () => unsubscribe()
  }, [setHasHydrated])
}
