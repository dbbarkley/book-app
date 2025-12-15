// ProtectedRoute Component - HOC/Component to protect routes requiring authentication
// Redirects to login if user is not authenticated
// Reusable in Next.js and React Native (with navigation adjustments)

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'

export interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * ProtectedRoute component - Wraps pages that require authentication
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <YourProtectedPage />
 * </ProtectedRoute>
 * ```
 * 
 * Or in page.tsx:
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>Protected content</div>
 *     </ProtectedRoute>
 *   )
 * }
 * ```
 * 
 * For React Native:
 * - Replace useRouter with React Navigation's useNavigation
 * - Use navigation.navigate() instead of router.push()
 * - Keep the same authentication check logic
 */
export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Only redirect if we're done loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading, router, redirectTo])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}

