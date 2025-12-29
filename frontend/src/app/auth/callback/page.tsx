'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@book-app/shared'

/**
 * AuthCallback Page
 * Handles the redirect from social authentication (Facebook)
 * Extracts the JWT token from the URL and saves it to the store
 */
export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setToken = useAuthStore((state) => state.setToken)

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) {
      // Save token to store and local storage
      setToken(token)
      
      // Redirect to feed or onboarding
      router.push('/feed')
    } else if (error) {
      // Redirect to login with error
      router.push(`/login?error=${encodeURIComponent(error)}`)
    } else {
      // No token found, redirect back to login
      router.push('/login')
    }
  }, [searchParams, setToken, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p className="mt-4 text-slate-600 font-medium">Completing login...</p>
      </div>
    </div>
  )
}

