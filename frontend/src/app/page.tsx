'use client'

/**
 * Home Page - Landing page for the book social app
 * 
 * For authenticated users: Redirects to /feed
 * For guests: Shows a landing page with signup/login CTAs
 * 
 * This provides a clean separation between public landing and authenticated feed
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@book-app/shared'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Redirect authenticated users to feed
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/feed')
    }
  }, [isAuthenticated, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl sm:text-8xl mb-6">📚</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Welcome to Book Social
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Follow your favorite authors, track your reading, and connect with fellow book lovers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="btn btn-secondary text-lg px-8 py-3"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything you need to track your reading
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Track Your Reading
              </h3>
              <p className="text-slate-600">
                Organize your books into shelves, track reading progress, and never forget what you've read.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Follow Authors
              </h3>
              <p className="text-slate-600">
                Stay updated with new releases, events, and announcements from your favorite authors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Connect with Readers
              </h3>
              <p className="text-slate-600">
                Share reviews, follow friends, and discover what other readers are enjoying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-4xl mx-auto bg-primary-600 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start your reading journey?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join thousands of readers tracking their books and following their favorite authors.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  )
}
