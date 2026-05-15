import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@book-app/shared'
import { useAppInit } from '@/hooks/useAppInit'
import { Colors } from '@/constants/colors'

// Keep the native splash visible while we hydrate auth state
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useAppInit()

  const hasHydrated     = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user            = useAuthStore((s) => s.user)
  const router          = useRouter()
  const segments        = useSegments()

  // BookSplash plays once per cold launch, after native splash hides
  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync()
    }
  }, [hasHydrated])

  // Route guard: redirect based on auth + onboarding state.
  // user===null means we're still waiting for refreshUser() — don't redirect
  // to onboarding yet, or we'll land there on every cold launch before the
  // network call returns.
  useEffect(() => {
    if (!hasHydrated) return
    const inAuthGroup  = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuthGroup && user !== null) {
      // After login / register — user object is already populated
      if (!user.onboarding_completed) {
        router.replace('/onboarding')
      } else {
        router.replace('/(tabs)')
      }
    } else if (isAuthenticated && inOnboarding && user?.onboarding_completed) {
      // refreshUser finished and onboarding is done — move past the screen
      router.replace('/(tabs)')
    } else if (isAuthenticated && !inOnboarding && user !== null && !user.onboarding_completed) {
      router.replace('/onboarding')
    }
  }, [hasHydrated, isAuthenticated, user?.onboarding_completed, segments, router])

  // Don't render anything until hydration is complete — native splash is still showing
  if (!hasHydrated) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.canvas }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.canvas} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.canvas },
            // Native swipe-back gesture stays enabled globally
            gestureEnabled: true,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
