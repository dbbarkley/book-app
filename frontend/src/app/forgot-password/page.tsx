// Forgot Password Page - Password reset request page
// Mobile-first responsive design with TailwindCSS
// Basic form implementation (backend endpoint not yet implemented)

'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import { isValidEmail } from '@/shared/utils/validation'
import { apiClient } from '@/shared/api/client'

/**
 * Forgot Password page component
 * 
 * Features:
 * - Email input for password reset
 * - Client-side validation
 * - Basic form (backend endpoint needs to be implemented)
 * 
 * TODO: Implement backend endpoint for password reset
 * - POST /api/v1/auth/forgot-password
 * - Should send reset email to user
 * 
 * For React Native:
 * - Replace Next.js Link with React Navigation
 * - Keep the same form structure
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement backend endpoint for password reset
      // For now, this will fail gracefully if the endpoint doesn't exist
      await apiClient.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Failed to send reset email. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check your email
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
              >
                Send another email
              </Button>
              <Link href="/login">
                <Button variant="ghost" fullWidth>
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email"
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error || undefined}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            {error && (
              <div
                className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4"
                role="alert"
              >
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
            >
              Send reset link
            </Button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

