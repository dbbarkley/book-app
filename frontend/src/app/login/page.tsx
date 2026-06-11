'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCurtain } from '@/context/CurtainContext'
import { isValidEmail } from '@/shared/utils/validation'

const MIN_CURTAIN_MS = 1400
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const GOOGLE_URL   = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/google_oauth2`
const FACEBOOK_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/facebook`

export default function LoginPage() {
  const router  = useRouter()
  const { login, loading } = useAuth()
  const curtain = useCurtain()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) errs.email = 'Email is required'
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setError(null)
    curtain.show()
    try {
      await Promise.all([login(email, password), sleep(MIN_CURTAIN_MS)])
      curtain.open()
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      curtain.dismiss()
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        'Incorrect email or password.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[620px]">

        {/* Badge */}
        <span className="zine-eyebrow mb-6">Welcome back, reader</span>

        {/* Headline */}
        <h1
          className="font-serif font-bold leading-[1.03] tracking-tight mb-4"
          style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.8rem, 8vw, 4rem)' }}
        >
          Pick up{' '}
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
            where you
            <br />
            left off.
          </em>
        </h1>

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
          <div className="mb-5">
            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-ink)' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-3)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                placeholder="••••••••••"
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

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mb-7">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setRemember((v) => !v)}
                className="flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  width: 22, height: 22,
                  border: '2px solid var(--color-ink)',
                  borderRadius: 5,
                  backgroundColor: remember ? 'var(--color-accent)' : '#fff',
                }}
                aria-checked={remember}
                role="checkbox"
              >
                {remember && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink-2)' }}>
                Remember this browser
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-[13px] font-bold transition-opacity hover:opacity-60"
              style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}
            >
              Forgot?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="zine-btn zine-btn-primary w-full"
          >
            {loading ? 'Signing in…' : <><span>Log in</span><ArrowRight size={15} /></>}
          </button>
        </form>

        {/* Bottom divider + signup link */}
        <div className="mt-8 pt-5" style={{ borderTop: '2px dashed var(--color-rim)' }}>
          <p className="text-center text-[14px]" style={{ color: 'var(--color-ink-2)' }}>
            New to WellRead?{' '}
            <Link
              href="/signup"
              className="font-bold transition-opacity hover:opacity-60"
              style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}
            >
              Claim your shelf →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
