'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { isValidEmail, isValidPassword, isValidUsername } from '@/shared/utils/validation'

const GOOGLE_URL   = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/google_oauth2`
const FACEBOOK_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/facebook`

export default function SignupPage() {
  const router = useRouter()
  const { signup, loading } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShow]       = useState(false)
  const [agreed, setAgreed]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; name?: string; email?: string; password?: string }>({})

  function validate() {
    const errs: { displayName?: string; name?: string; email?: string; password?: string } = {}
    if (!displayName.trim()) errs.displayName = 'Display name is required'
    else if (displayName.trim().length > 50) errs.displayName = 'Display name must be 50 characters or fewer'
    if (!name.trim()) errs.name = 'Username is required'
    else if (!isValidUsername(name)) errs.name = '3–30 characters, letters/numbers/underscores only'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    else if (!isValidPassword(password)) errs.password = 'Must be at least 8 characters'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError(null)
    try {
      await signup(name, email, password, displayName.trim())
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const d = err?.response?.data
      setError(
        (Array.isArray(d?.errors) && d.errors.length > 0 ? d.errors.join('. ') : null) ||
        (typeof d?.error === 'string' ? d.error : null) ||
        err?.message ||
        'Failed to create account. Please try again.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[620px]">

        {/* Badge */}
        <span className="zine-eyebrow mb-6">Claim your shelf</span>

        {/* Headline */}
        <h1
          className="font-serif font-bold leading-[1.03] tracking-tight mb-4"
          style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.8rem, 8vw, 4rem)' }}
        >
          Start a{' '}
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
            reading
            <br />
            life.
          </em>
        </h1>

        <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'var(--color-ink-2)' }}>
          One account. A private shelf. Nothing trained on your reading
          habits — we wouldn't even know how.
        </p>

        {/* Social buttons */}
        <div className="flex flex-col gap-3 mb-7">
          <button
            type="button"
            onClick={() => { window.location.href = GOOGLE_URL }}
            className="zine-btn zine-btn-social w-full gap-3"
          >
            <span
              className="flex items-center justify-center text-[13px] font-black flex-shrink-0"
              style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: 'var(--color-accent-yellow)',
                border: '1.5px solid var(--color-ink)',
                color: 'var(--color-ink)',
              }}
            >
              G
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => { window.location.href = FACEBOOK_URL }}
            className="zine-btn zine-btn-social w-full gap-3"
          >
            <span
              className="flex items-center justify-center text-[13px] font-black flex-shrink-0"
              style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: '#1B2A4A',
                border: '1.5px solid var(--color-ink)',
                color: '#fff',
              }}
            >
              F
            </span>
            Continue with Facebook
          </button>
        </div>

        {/* "or with email" divider */}
        <div className="flex items-center gap-4 mb-7">
          <div style={{ flex: 1, height: 2, backgroundColor: 'var(--color-ink)' }} />
          <em className="font-serif text-[14px] flex-shrink-0" style={{ color: 'var(--color-ink-2)', fontStyle: 'italic', fontWeight: 600 }}>
            or with email
          </em>
          <div style={{ flex: 1, height: 2, backgroundColor: 'var(--color-ink)' }} />
        </div>

        {/* Error banner */}
        {error && <div className="zine-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* Display name */}
          <div className="mb-5">
            <label htmlFor="displayName" className="block text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-ink)' }}>
              Your name
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setFieldErrors((p) => ({ ...p, displayName: undefined })) }}
              placeholder="What should we call you?"
              className={`zine-input ${fieldErrors.displayName ? 'zine-input-error' : ''}`}
            />
            {fieldErrors.displayName && <p className="zine-field-error">{fieldErrors.displayName}</p>}
          </div>

          {/* Username */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-ink)' }}>
              Username
            </label>
            <input
              id="name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })) }}
              placeholder="letters, numbers, underscores"
              className={`zine-input ${fieldErrors.name ? 'zine-input-error' : ''}`}
            />
            {fieldErrors.name && <p className="zine-field-error">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-ink)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
              placeholder="you@somewhere.real"
              className={`zine-input ${fieldErrors.email ? 'zine-input-error' : ''}`}
            />
            {fieldErrors.email && <p className="zine-field-error">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-ink)' }}>
              Choose a password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-3)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                placeholder="at least 8 characters"
                className={`zine-input pl-10 pr-12 ${fieldErrors.password ? 'zine-input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff size={16} style={{ color: 'var(--color-ink-3)' }} />
                  : <Eye    size={16} style={{ color: 'var(--color-ink-3)' }} />
                }
              </button>
            </div>
            {fieldErrors.password && <p className="zine-field-error">{fieldErrors.password}</p>}
          </div>

          {/* Agree checkbox */}
          <label className="flex items-start gap-3 mb-7 cursor-pointer">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className="flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{
                width: 22, height: 22,
                border: '2px solid var(--color-ink)',
                borderRadius: 5,
                backgroundColor: agreed ? 'var(--color-accent)' : '#fff',
              }}
              aria-checked={agreed}
              role="checkbox"
            >
              {agreed && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
              I've read the{' '}
              <Link href="/#manifesto" className="font-bold" style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}>
                manifesto
              </Link>
              {' '}and agree to the{' '}
              <Link href="/privacy" className="font-bold" style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}>
                terms
              </Link>
              . No data sold, no models trained.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="zine-btn zine-btn-primary w-full"
          >
            {loading ? 'Creating account…' : <><span>Start reading</span><ArrowRight size={15} /></>}
          </button>
        </form>

        {/* Bottom divider + login link */}
        <div className="mt-8 pt-5" style={{ borderTop: '2px dashed var(--color-rim)' }}>
          <p className="text-center text-[14px]" style={{ color: 'var(--color-ink-2)' }}>
            Already reading with us?{' '}
            <Link
              href="/login"
              className="font-bold transition-opacity hover:opacity-60"
              style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}
            >
              Log in →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
