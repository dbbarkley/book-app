// Signup Page - User registration page
// Mobile-first responsive design with TailwindCSS

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthForm, { type AuthFormData } from '@/components/AuthForm'
import { useAuth } from '@/shared/hooks/useAuth'

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
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const data = err?.response?.data
      const errorMessage =
        // Rails validation errors come back as { errors: ["Email has already been taken", ...] }
        (Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors.join('. ')
          : null) ||
        // Single-string error field
        (typeof data?.error === 'string' ? data.error : null) ||
        err?.message ||
        'Failed to create account. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-lit mb-2">
            Create Account
          </h1>
          <p className="text-lit-2 text-sm sm:text-base">
            Join our community of book lovers
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-[28px] p-6 sm:p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)' }}>
          <AuthForm
            mode="signup"
            onSubmit={handleSignup}
            isLoading={loading}
            error={error}
          />

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-ink-2">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent-hover hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-lit-3">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
