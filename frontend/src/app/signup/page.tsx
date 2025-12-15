// Signup Page - User registration page
// Mobile-first responsive design with TailwindCSS

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthForm, { type AuthFormData } from '@/components/AuthForm'
import { useAuth } from '@/shared/hooks/useAuth'

/**
 * Signup page component
 * 
 * Features:
 * - Username, email, and password registration
 * - Client-side validation
 * - Error handling
 * - Redirects to home page on success
 * 
 * For React Native:
 * - Replace Next.js Link with React Navigation
 * - Replace useRouter with navigation.navigate()
 * - Keep the same AuthForm component (with React Native adaptations)
 */
export default function SignupPage() {
  const router = useRouter()
  const { signup, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (data: AuthFormData) => {
    setError(null)
    
    if (!data.name) {
      setError('Username is required')
      return
    }

    try {
      await signup(data.name, data.email, data.password)
      // Redirect to home page on successful signup
      router.push('/')
      router.refresh() // Refresh to update navigation/auth state
    } catch (err: any) {
      // Handle API errors
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Failed to create account. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Join our community of book lovers
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <AuthForm
            mode="signup"
            onSubmit={handleSignup}
            isLoading={loading}
            error={error}
          />

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
