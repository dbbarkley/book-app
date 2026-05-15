'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding, useAuth } from '@book-app/shared'
import { apiClient } from '@book-app/shared'
import type { Author } from '@book-app/shared'
import ProgressIndicator from '@/components/ProgressIndicator'
import GenreSelector from '@/components/GenreSelector'
import AuthorSelector from '@/components/AuthorSelector'
import { mockGenres } from '@/utils/onboardingData'
import {
  BookOpen,
  Upload,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react'

// ─── Step definitions ────────────────────────────────────────────────────────
// 4 steps: Welcome → Import → Genres → Authors
// Zipcode / events removed (events disabled, zipcode removed from settings).
const STEPS = [
  { title: 'Welcome', description: "Let's get your library set up" },
  { title: 'Import Your Books', description: 'Bring your reading history over in seconds' },
  { title: 'Your Favorite Genres', description: "We'll use these to personalise your recommendations" },
  { title: 'Favourite Authors', description: 'Add authors you love to personalise your recommendations' },
]
const TOTAL_STEPS = STEPS.length

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const {
    currentStep,
    selectedGenres,
    selectedAuthorIds,
    isLoading,
    error,
    nextStep,
    prevStep,
    toggleGenre,
    toggleAuthor,
    submitPreferences,
    skipOnboarding,
  } = useOnboarding()

  const [authors, setAuthors] = useState<Author[]>([])
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false)
  const authorSearchId = useRef(0)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  // ── Skip if already onboarded ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) { setCheckingOnboarding(false); return }
    const check = async () => {
      try {
        if (user?.onboarding_completed) { router.push('/dashboard'); return }
        const completed = await apiClient.checkOnboardingStatus()
        if (completed) router.push('/dashboard')
      } catch { /* allow access */ } finally { setCheckingOnboarding(false) }
    }
    check()
  }, [isAuthenticated, user, router])

  // ── Fetch authors ───────────────────────────────────────────────────────────
  useEffect(() => {
    apiClient.getAuthors({ per_page: 100 }).then(res => {
      const list = Array.isArray(res) ? res : (res as any).authors
      setAuthors(list || [])
    }).catch(() => {})
  }, [])

  const handleAuthorSearch = useCallback(async (query: string) => {
    const id = ++authorSearchId.current
    setAuthorSearchLoading(true)
    try {
      const result = query
        ? await apiClient.searchAuthors(query, 1, 50)
        : await apiClient.getAuthors({ per_page: 100 })
      if (id !== authorSearchId.current) return
      setAuthors(Array.isArray(result) ? result : (result as any).authors || [])
    } catch {}
    finally { if (id === authorSearchId.current) setAuthorSearchLoading(false) }
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (currentStep === TOTAL_STEPS - 1) {
      const result = await submitPreferences()
      if (result.success) {
        await refreshUser().catch(() => {})
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      nextStep()
    }
  }

  const handleSkipAll = async () => {
    const result = await skipOnboarding()
    if (result.success) {
      await refreshUser().catch(() => {})
      router.push('/dashboard')
      router.refresh()
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!isAuthenticated || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--color-lit-3)' }}>Loading…</p>
        </div>
      </div>
    )
  }

  // ── Step content ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      // ── Step 0: Welcome ────────────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-8">
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
                <BookOpen className="w-10 h-10" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3" style={{ color: 'var(--color-lit)' }}>
                Welcome to Libraio
              </h3>
              <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>
                Your personal library — private by default, always yours.
                This quick setup takes about 2 minutes.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Upload, label: 'Import your Goodreads library', sub: 'Bring over your books, ratings & shelves instantly' },
                { icon: BookOpen, label: 'Pick genres you love', sub: "We'll personalise your recommendations" },
                { icon: CheckCircle, label: 'Add your favourite authors', sub: 'Get updates when they release new books' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-4 rounded-2xl p-4" style={cardStyle}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-grove)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--color-lit)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      // ── Step 1: Goodreads Import ───────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-5">
            {/* Primary CTA — Goodreads */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-accent)', backgroundColor: 'var(--color-surface)' }}>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xl"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    G
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--color-lit)' }}>Goodreads</h4>
                    <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>Import your entire library, ratings, and shelves</p>
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-xl p-4 mb-5 space-y-2"
                  style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
                    How it works
                  </p>
                  {[
                    'Go to Goodreads → My Books → Export your library',
                    'Download the CSV file they send to your email',
                    'Upload it here — we handle the rest',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}>
                        {i + 1}
                      </span>
                      <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>{step}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/import/goodreads')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                >
                  <Upload className="w-4 h-4" />
                  Import from Goodreads
                </button>
              </div>
            </div>

            {/* StoryGraph coming soon */}
            <div className="rounded-2xl p-5 opacity-50" style={cardStyle}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold"
                  style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
                  SG
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--color-lit)' }}>StoryGraph</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
                    Coming soon
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-center" style={{ color: 'var(--color-lit-3)' }}>
              Don't have Goodreads? Hit "Skip for now" below to set up your preferences instead.
            </p>
          </div>
        )

      // ── Step 2: Genres ────────────────────────────────────────────────────
      case 2:
        return (
          <GenreSelector
            genres={mockGenres}
            selectedGenres={selectedGenres}
            onToggleGenre={toggleGenre}
          />
        )

      // ── Step 3: Authors ───────────────────────────────────────────────────
      case 3:
        return (
          <AuthorSelector
            authors={authors}
            selectedAuthorIds={selectedAuthorIds}
            onToggleAuthor={toggleAuthor}
            onSearch={handleAuthorSearch}
            searchLoading={authorSearchLoading}
          />
        )

      default:
        return null
    }
  }

  const isLastStep = currentStep === TOTAL_STEPS - 1
  const isImportStep = currentStep === 1
  const nextLabel = isLastStep ? 'Finish Setup' : isImportStep ? 'Skip for now' : 'Next'
  const nextDisabled =
    (currentStep === 2 && selectedGenres.length === 0) ||
    (currentStep === 3 && selectedAuthorIds.length === 0)

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="max-w-lg mx-auto">

        {/* Progress */}
        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl p-4" style={{ backgroundColor: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
          </div>
        )}

        {/* Step card */}
        <div className="rounded-[28px] p-6 sm:p-8 mb-6" style={cardStyle}>
          {/* Step header */}
          <div className="mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
              {STEPS[currentStep].title}
            </h2>
            <p className="text-base" style={{ color: 'var(--color-lit-2)' }}>
              {STEPS[currentStep].description}
            </p>
          </div>

          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {/* Back */}
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              disabled={isLoading}
              className="px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
            >
              Back
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Skip all (step 0 only) */}
          {currentStep === 0 && (
            <button
              onClick={handleSkipAll}
              disabled={isLoading}
              className="text-sm transition-all hover:opacity-70"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Skip setup
            </button>
          )}

          {/* Next / Finish */}
          <button
            onClick={handleNext}
            disabled={isLoading || nextDisabled}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--color-accent-on)', borderTopColor: 'transparent' }} />
            ) : (
              <>
                {nextLabel}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
                {isLastStep && <Check className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
