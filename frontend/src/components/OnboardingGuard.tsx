// OnboardingGuard Component - Forces users to complete onboarding
// Redirects to onboarding if user hasn't completed it
// Reusable in Next.js and React Native (with navigation adjustments)

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@book-app/shared'
import { apiClient } from '@book-app/shared'

export interface OnboardingGuardProps {
  children: React.ReactNode
  /**
   * Routes that are allowed without completing onboarding
   * Default: ['/onboarding', '/login', '/signup', '/forgot-password']
   */
  allowedRoutes?: string[]
}

/**
 * OnboardingGuard component - Forces users to complete onboarding
 * 
 * Usage:
 * ```tsx
 * <OnboardingGuard>
 *   <YourAppContent />
 * </OnboardingGuard>
 * ```
 * 
 * This component:
 * 1. Checks if user has completed onboarding
 * 2. Redirects to /onboarding if not completed
 * 3. Allows access to onboarding page and auth pages
 * 4. Only enforces for authenticated users
 * 
 * For React Native:
 * - Replace useRouter with React Navigation's useNavigation
 * - Replace usePathname with navigation state
 * - Use navigation.navigate() instead of router.push()
 * - Keep the same logic for checking onboarding status
 */
export default function OnboardingGuard({
  children,
  allowedRoutes = ['/onboarding', '/login', '/signup', '/forgot-password'],
}: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)

  // Check onboarding status when user is authenticated
  useEffect(() => {
    const checkOnboarding = async () => {
      // Don't check if not authenticated or already on allowed route
      if (!isAuthenticated || allowedRoutes.includes(pathname)) {
        setOnboardingStatus(null)
        return
      }

      // Don't check if user object already has onboarding_completed
      if (user?.onboarding_completed !== undefined) {
        setOnboardingStatus(user.onboarding_completed)
        if (!user.onboarding_completed) {
          router.push('/onboarding')
        }
        return
      }

      // Check onboarding status from API
      setCheckingOnboarding(true)
      try {
        const completed = await apiClient.checkOnboardingStatus()
        setOnboardingStatus(completed)
        
        if (!completed) {
          router.push('/onboarding')
        }
      } catch (error) {
        // If check fails, assume not completed to be safe
        console.warn('Failed to check onboarding status:', error)
        setOnboardingStatus(false)
        router.push('/onboarding')
      } finally {
        setCheckingOnboarding(false)
      }
    }

    // Only check if auth is done loading
    if (!authLoading) {
      checkOnboarding()
    }
  }, [isAuthenticated, user, pathname, router, authLoading, allowedRoutes])

  // Show loading while checking auth or onboarding
  if (authLoading || (isAuthenticated && checkingOnboarding && !allowedRoutes.includes(pathname))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, allow access (ProtectedRoute will handle auth)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // If on allowed route, allow access
  if (allowedRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // If onboarding not completed, don't render children (redirecting)
  if (onboardingStatus === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  // If onboarding completed or status is null (not checked yet), allow access
  return <>{children}</>
}

