// Login Page - User authentication page
// Mobile-first responsive design with TailwindCSS

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthForm, { type AuthFormData } from '@/components/AuthForm'
import { useAuth } from '@/shared/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data: AuthFormData) => {
    setError(null)
    try {
      await login(data.email, data.password)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Failed to sign in. Please check your credentials and try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-lit mb-2">
            Welcome Back
          </h1>
          <p className="text-lit-2 text-sm sm:text-base">
            Sign in to your account to continue
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-[28px] p-6 sm:p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)' }}>
          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            isLoading={loading}
            error={error}
          />

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-ink-2">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-accent hover:text-accent-hover hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-lit-3">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
