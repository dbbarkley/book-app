'use client'

import React, { useEffect, useRef } from 'react'
import {
  useAuth,
  useUserLibrary,
  useFollows,
  useRecommendedBooks,
  useRecommendedAuthors,
} from '@book-app/shared'
import DashboardHero from '@/components/dashboard/DashboardHero'
import DashboardRecommendations from '@/components/dashboard/DashboardRecommendations'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()

  const {
    groupedLibrary,
    loading: libraryLoading,
    refresh: refreshLibrary
  } = useUserLibrary(user?.id)

  const readingBooks = groupedLibrary?.reading || []

  const { follows, fetchFollows } = useFollows()
  const followedAuthors = follows.filter(f => f.followable_type === 'Author')

  const { books: recommendedBooks, loading: recsLoading, refresh: refreshRecs } = useRecommendedBooks()
  const { authors: recommendedAuthors, loading: authorRecsLoading } = useRecommendedAuthors()

  // Guard so we only auto-generate once per mount, not on every re-render
  const hasAutoTriggered = useRef(false)

  useEffect(() => {
    if (isAuthenticated) fetchFollows()
  }, [isAuthenticated, fetchFollows])

  // Auto-generate recommendations the first time the dashboard loads if none exist.
  // SmartRecommendationService is fast (pure DB queries) so this is safe in-request.
  useEffect(() => {
    if (
      !recsLoading &&
      recommendedBooks.length === 0 &&
      !hasAutoTriggered.current
    ) {
      hasAutoTriggered.current = true
      refreshRecs()
    }
  }, [recsLoading, recommendedBooks.length, refreshRecs])

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="container-mobile py-8 space-y-12">

        <DashboardHero
          readingBooks={readingBooks}
          loading={libraryLoading}
          onUpdate={refreshLibrary}
          userName={user?.display_name || user?.username}
        />

        <DashboardRecommendations
          books={recommendedBooks}
          authors={recommendedAuthors}
          loading={recsLoading || authorRecsLoading}
        />

      </div>
    </div>
  )
}
