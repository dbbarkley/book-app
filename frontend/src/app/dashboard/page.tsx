'use client'

import React, { useEffect, useRef } from 'react'
import {
  useAuth,
  useUserLibrary,
  useFollows,
  useRecommendedBooks,
  useRecommendedAuthors,
} from '@book-app/shared'
import DashboardHero         from '@/components/dashboard/DashboardHero'
import DashboardActivityFeed from '@/components/dashboard/DashboardActivityFeed'
import DashboardDiscovery    from '@/components/dashboard/DashboardDiscovery'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()

  const {
    groupedLibrary,
    loading: libraryLoading,
    refresh: refreshLibrary,
  } = useUserLibrary(user?.id)

  const readingBooks = groupedLibrary?.reading || []

  const { follows, fetchFollows } = useFollows()

  const { books: recommendedBooks, loading: recsLoading,       refresh: refreshRecs } = useRecommendedBooks()
  const { authors: recommendedAuthors, loading: authorRecsLoading }                   = useRecommendedAuthors()

  // Auto-trigger recommendation generation once per mount if none exist
  const hasAutoTriggered = useRef(false)

  useEffect(() => {
    if (isAuthenticated) fetchFollows()
  }, [isAuthenticated, fetchFollows])

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
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Currently Reading — full-width hero ───────────── */}
        <DashboardHero
          readingBooks={readingBooks}
          loading={libraryLoading}
          onUpdate={refreshLibrary}
          userName={user?.display_name || user?.username}
        />

        {/* ── 70 / 30 grid — feed left, discovery right ─────── */}
        {/*
          Single column on mobile (<lg), splits into 70/30 on lg+.
          items-start keeps the right column from stretching to
          match the feed height — it stays flush to the top.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 items-start">

          {/* Left — Activity feed */}
          <DashboardActivityFeed />

          {/* Right — Discovery (recommendations + authors) */}
          <DashboardDiscovery
            books={recommendedBooks}
            authors={recommendedAuthors}
            loading={recsLoading || authorRecsLoading}
          />

        </div>

      </div>
    </div>
  )
}
