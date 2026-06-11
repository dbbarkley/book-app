'use client'

import React, { useState } from 'react'
import {
  useAuth,
  useUserLibrary,
  useMilestones,
} from '@book-app/shared'
import DashboardHero         from '@/components/dashboard/DashboardHero'
import DashboardActivityFeed from '@/components/dashboard/DashboardActivityFeed'
import DashboardYearSoFar    from '@/components/dashboard/DashboardYearSoFar'
import DashboardUpNext       from '@/components/dashboard/DashboardUpNext'
import DashboardLetters      from '@/components/dashboard/DashboardLetters'
import GoalSettingModal      from '@/components/library/GoalSettingModal'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()

  const {
    groupedLibrary,
    loading: libraryLoading,
    refresh: refreshLibrary,
  } = useUserLibrary(user?.id)

  const readingBooks = groupedLibrary?.reading || []
  const toReadBooks  = groupedLibrary?.to_read || []
  const readBooks    = groupedLibrary?.read    || []

  const { readingGoal, setGoal, removeGoal, isLoading: isGoalLoading } = useMilestones()
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  const currentYear = new Date().getFullYear()
  const completedThisYear = readBooks.filter((ub: { finished_at?: string | null }) => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === currentYear
  }).length
  const lastYearCount = readBooks.filter((ub: { finished_at?: string | null }) => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === currentYear - 1
  }).length

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="container-mobile py-8 sm:py-12 space-y-8">

        {/* ── Currently Reading — full-width hero ───────────── */}
        <DashboardHero
          readingBooks={readingBooks}
          loading={libraryLoading}
          onUpdate={() => { refreshLibrary(); refreshUser() }}
          userName={user?.display_name || user?.username}
          readingGoal={readingGoal}
          completedThisYear={completedThisYear}
          toReadCount={toReadBooks.length}
          readingStreak={user?.reading_streak ?? 0}
        />

        {/* ── Up Next — next 3 books from the to-read shelf ─── */}
        <DashboardUpNext books={toReadBooks} onUpdate={refreshLibrary} />

        {/* ── 70 / 30 grid — feed left, discovery right ─────── */}
        {/*
          Single column on mobile (<lg), splits into 70/30 on lg+.
          items-start keeps the right column from stretching to
          match the feed height — it stays flush to the top.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 items-start">

          {/* Left — Activity feed */}
          <DashboardActivityFeed />

          {/* Right — Stats + Letters */}
          <aside className="space-y-6">
            <DashboardYearSoFar readBooks={readBooks} readingStreak={user?.reading_streak ?? 0} />
            <DashboardLetters />
          </aside>

        </div>

      </div>

      <GoalSettingModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={setGoal}
        onRemove={removeGoal}
        isLoading={isGoalLoading}
        currentGoal={readingGoal}
        completedThisYear={completedThisYear}
        lastYearCount={lastYearCount > 0 ? lastYearCount : undefined}
      />
    </div>
  )
}
