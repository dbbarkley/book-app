'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@book-app/shared'

const RAILS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * AuthCallback Page
 * Completes the OAuth flow by exchanging the one-time code issued by the
 * Rails callback for a full token pair. The code arrives via ?code= (never
 * ?token=) so that JWTs are never exposed in browser history or server logs.
 */
export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setTokens = useAuthStore((state) => state.setTokens)

  useEffect(() => {
    const code  = searchParams.get('code')
    const error = searchParams.get('error')

    if (code) {
      fetch(`${RAILS_API}/auth/exchange`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Exchange failed: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          const access  = data.access_token ?? data.token ?? null
          const refresh = data.refresh_token ?? null
          setTokens(access, refresh)
          // Populate the rest of the auth state (user, isAuthenticated)
          useAuthStore.setState({ user: data.user, isAuthenticated: true })
          router.push('/feed')
        })
        .catch(() => {
          router.push('/login?error=auth_failed')
        })
    } else if (error) {
      router.push(`/login?error=${encodeURIComponent(error)}`)
    } else {
      router.push('/login')
    }
  }, [searchParams, setTokens, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p className="mt-4 text-slate-600 font-medium">Completing login...</p>
      </div>
    </div>
  )
}
