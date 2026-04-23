'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { ChevronLeft, Mail, Check } from 'lucide-react'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import { isValidEmail } from '@/shared/utils/validation'
import { apiClient } from '@/shared/api/client'

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required'); return }
    if (!isValidEmail(email)) { setError('Please enter a valid email address'); return }

    setIsLoading(true)
    try {
      await apiClient.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Failed to send reset email. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success state ──
  if (isSubmitted) {
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
              Check your email
            </h1>
            <p className="text-sm mb-1" style={{ color: 'var(--color-lit-2)' }}>
              We sent a reset link to
            </p>
            <p className="font-semibold mb-5 text-sm" style={{ color: 'var(--color-lit)' }}>
              {email}
            </p>
            <p className="text-xs mb-8" style={{ color: 'var(--color-lit-3)' }}>
              Don't see it? Check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => { setIsSubmitted(false); setEmail('') }}
              >
                Send another link
              </Button>
              <Link href="/login">
                <Button variant="outline" fullWidth>Back to sign in</Button>
              </Link>
            </div>
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
            <Mail size={22} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>
            Forgot Password?
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--color-lit-2)' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email address"
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null) }}
              error={error || undefined}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Send reset link
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
