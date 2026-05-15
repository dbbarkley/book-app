'use client'

import { useState, useEffect, Suspense, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Lock, Check, AlertCircle } from 'lucide-react'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import { apiClient } from '@/shared/api/client'

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword]           = useState('')
  const [confirmation, setConfirmation]   = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [isLoading, setIsLoading]         = useState(false)
  const [isSuccess, setIsSuccess]         = useState(false)

  // If there's no token at all, show an error right away
  const missingToken = !token

  const validate = (): string | null => {
    if (!password)                      return 'Password is required'
    if (password.length < 8)            return 'Password must be at least 8 characters'
    if (password !== confirmation)      return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setIsLoading(true)
    try {
      await apiClient.resetPassword(token!, password)
      setIsSuccess(true)
      // Auto-redirect to login after 3 seconds
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Failed to reset password. The link may have expired.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ── Invalid/missing token state ──
  if (missingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] p-8 text-center" style={cardStyle}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.35)' }}
            >
              <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-3" style={{ color: 'var(--color-lit)' }}>
              Invalid reset link
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--color-lit-2)' }}>
              This password reset link is missing or invalid. Please request a new one.
            </p>
            <Link href="/forgot-password">
              <Button variant="primary" fullWidth>Request new link</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success state ──
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] p-8 text-center" style={cardStyle}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)' }}
            >
              <Check size={24} style={{ color: 'var(--color-success)' }} />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>
              Password updated!
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--color-lit-2)' }}>
              Your password has been reset. Redirecting you to sign in…
            </p>
            <Link href="/login">
              <Button variant="primary" fullWidth>Sign in now</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form state ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-rim-accent)' }}
          >
            <Lock size={22} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>
            New Password
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--color-lit-2)' }}>
            Choose a strong password for your account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="New password"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              autoFocus
            />
            <InputField
              label="Confirm password"
              type="password"
              name="confirmation"
              id="confirmation"
              value={confirmation}
              onChange={e => { setConfirmation(e.target.value); setError(null) }}
              error={error || undefined}
              placeholder="Same password again"
              required
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Reset password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--color-lit-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
            >
              <ChevronLeft size={15} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
