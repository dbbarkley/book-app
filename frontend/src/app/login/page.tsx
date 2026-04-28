'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthForm, { type AuthFormData } from '@/components/AuthForm'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCurtain } from '@/context/CurtainContext'

/** Minimum time the curtain stays visible so it never flashes.
 *  Covers the full entrance animation: lines (550ms) + panels (500–1000ms). */
const MIN_CURTAIN_MS = 1400

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export default function LoginPage() {
  const router   = useRouter()
  const { login, loading } = useAuth()
  const curtain  = useCurtain()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data: AuthFormData) => {
    setError(null)

    // Cover the screen immediately — user sees the book + pulse
    // rather than a dead wait or the double-redirect flash.
    curtain.show()

    try {
      // Run auth and the minimum display delay in parallel.
      // If auth is fast the curtain still shows for at least MIN_CURTAIN_MS.
      // If auth is slow the curtain simply keeps waiting.
      await Promise.all([
        login(data.email, data.password),
        sleep(MIN_CURTAIN_MS),
      ])

      // Panels split open — navigate to dashboard directly, skipping
      // the old /  → /dashboard double-redirect.
      curtain.open()
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      // Auth failed — quickly dismiss the curtain and show the error.
      curtain.dismiss()
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
