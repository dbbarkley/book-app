import Constants from 'expo-constants'

/**
 * Runtime config — values come from app.json "extra" in production,
 * and can be overridden by .env via EXPO_PUBLIC_* vars during development.
 */

function resolveApiBaseUrl(): string {
  // 1. Explicit env var always wins (set in .env.local for CI / staging / prod)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL

  // 2. In dev, derive the Rails host from the Expo Metro bundler host.
  //    Metro and the Rails dev server run on the same machine, so the host
  //    the device uses to reach Metro (e.g. "192.168.1.42:8081") is the same
  //    host that can reach Rails on port 3000.
  //    This makes physical-device + Expo Go work with zero config.
  if (__DEV__) {
    // SDK 52: Constants.expoConfig.hostUri  →  "192.168.1.42:8081"
    // Older:  Constants.manifest2.debuggerHost  or  Constants.manifest.debuggerHost
    const hostUri: string | undefined =
      (Constants.expoConfig as any)?.hostUri ??
      (Constants as any).manifest2?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost

    if (hostUri) {
      const host = hostUri.split(':')[0]   // strip the Metro port
      return `http://${host}:3000/api/v1`
    }
  }

  // 3. app.json "extra.apiUrl" (explicit override for a specific build)
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined
  if (fromExtra) return fromExtra

  // 4. Last resort — localhost works for iOS Simulator only
  return 'http://localhost:3000/api/v1'
}

export const API_BASE_URL: string = resolveApiBaseUrl()

export const APP_NAME = 'Libraio'

export const STORAGE_KEYS = {
  AUTH_TOKEN:     'libraio_auth_token',
  REFRESH_TOKEN:  'libraio_refresh_token',
  USER:           'libraio_user',
} as const
