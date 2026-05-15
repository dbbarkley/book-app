/**
 * SecureStorage adapter — wraps expo-secure-store so we can swap
 * implementations in tests or if we ever go web-only.
 *
 * The shared authStore accepts a zustand PersistStorage<S> compatible
 * object. We expose a simple key/value API here; the adapter in
 * hooks/useAppInit connects it to the store.
 */

import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (err) {
      console.warn('[SecureStorage] setItem failed:', err)
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (err) {
      console.warn('[SecureStorage] removeItem failed:', err)
    }
  },
}

/** Zustand-compatible PersistStorage shape */
export const zustandSecureStorage = {
  getItem: async (name: string) => {
    const value = await secureStorage.getItem(name)
    return value ? JSON.parse(value) : null
  },
  setItem: async (name: string, value: unknown) => {
    await secureStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: async (name: string) => {
    await secureStorage.removeItem(name)
  },
}
