'use client'

/**
 * AuthDebug - Debug component to help diagnose auth issues
 * 
 * This component shows the current auth state and localStorage contents
 * Remove or comment out in production
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@book-app/shared'

export default function AuthDebug() {
  const auth = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>(null)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    const data = localStorage.getItem('auth-storage')
    if (data) {
      try {
        setLocalStorageData(JSON.parse(data))
      } catch (e) {
        setLocalStorageData({ error: 'Failed to parse' })
      }
    }
  }, [auth.token, auth.user])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-900 text-white text-xs rounded shadow-lg max-w-md overflow-auto max-h-96 z-50">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      
      <div className="mb-2">
        <div className="text-yellow-400">Store State:</div>
        <div>Loading: {auth.loading ? '✅' : '❌'}</div>
        <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
        <div>Has Token: {auth.token ? '✅' : '❌'}</div>
        <div>Has User: {auth.user ? '✅' : '❌'}</div>
        {auth.user && <div>User: {auth.user.username}</div>}
      </div>

      <div className="mb-2">
        <div className="text-yellow-400">localStorage:</div>
        {localStorageData ? (
          <pre className="text-xs overflow-auto">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        ) : (
          <div>No data</div>
        )}
      </div>

      <div className="text-gray-400 text-[10px] mt-2">
        Refresh page to see updated state
      </div>
    </div>
  )
}

