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
    <div className="min-h-screen bg-background-app">
      {/* Hero Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="text-6xl sm:text-8xl">📚</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary">
            Welcome to Book Social
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Follow your favorite authors, track your reading, and connect with fellow book lovers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-brand-indigo px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-indigo-dark"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border-default bg-background-card px-8 py-3 text-lg font-semibold text-text-primary transition hover:border-brand-indigo hover:text-brand-indigo"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-3xl font-bold text-center text-text-primary">
            Everything you need to track your reading
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-background-card p-6 shadow-sm">
              <div className="text-4xl">📖</div>
              <h3 className="text-xl font-semibold text-text-primary">
                Track Your Reading
              </h3>
              <p className="text-text-secondary">
                Organize your books into shelves, track reading progress, and never forget what you've read.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-background-card p-6 shadow-sm">
              <div className="text-4xl">✍️</div>
              <h3 className="text-xl font-semibold text-text-primary">
                Follow Authors
              </h3>
              <p className="text-text-secondary">
                Stay updated with new releases, events, and announcements from your favorite authors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-background-card p-6 shadow-sm">
              <div className="text-4xl">👥</div>
              <h3 className="text-xl font-semibold text-text-primary">
                Connect with Readers
              </h3>
              <p className="text-text-secondary">
                Share reviews, follow friends, and discover what other readers are enjoying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container-mobile py-12 sm:py-20">
        <div className="max-w-4xl mx-auto rounded-2xl bg-brand-indigo px-8 py-10 text-center text-white shadow-lg sm:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to start your reading journey?
          </h2>
          <p className="text-lg text-white/85 mb-8">
            Join thousands of readers tracking their books and following their favorite authors.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-brand-indigo shadow-sm transition hover:bg-background-muted hover:text-text-primary"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  )
}
