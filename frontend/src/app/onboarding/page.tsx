// Onboarding Page - Multi-step wizard for new user preferences
// Mobile-first design with TailwindCSS
// Handles welcome, genre selection, author selection, and data import

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOnboarding, useAuth } from '@book-app/shared'
import { apiClient } from '@book-app/shared'
import type { Author } from '@book-app/shared'
import OnboardingStep from '@/components/OnboardingStep'
import ProgressIndicator from '@/components/ProgressIndicator'
import GenreSelector from '@/components/GenreSelector'
import AuthorSelector from '@/components/AuthorSelector'
import OnboardingButtons from '@/components/OnboardingButtons'
import { mockGenres, mockAuthors } from '@/utils/onboardingData'

/**
 * Onboarding page component
 * Multi-step wizard for collecting user preferences
 * 
 * Steps:
 * 1. Welcome message
 * 2. Genre selection
 * 3. Author selection
 * 4. Import data (optional)
 * 
 * After completion, redirects to home/feed page
 * 
 * For React Native:
 * - Replace useRouter with React Navigation
 * - Replace Next.js navigation with navigation.navigate()
 * - Keep the same component structure for consistency
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const {
    currentStep,
    totalSteps,
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
    reset,
  } = useOnboarding()

  const [authors, setAuthors] = useState<Author[]>(mockAuthors)
  const [genres] = useState(mockGenres)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated) {
        setCheckingOnboarding(false)
        return
      }

      try {
        // Check if user object has onboarding_completed
        if (user?.onboarding_completed === true) {
          // Already completed, redirect to home
          router.push('/')
          return
        }

        // Check from API
        const completed = await apiClient.checkOnboardingStatus()
        if (completed) {
          router.push('/')
        }
      } catch (error) {
        // If check fails, allow access to onboarding page
        console.warn('Failed to check onboarding status:', error)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    if (isAuthenticated) {
      checkOnboardingStatus()
    } else {
      setCheckingOnboarding(false)
    }
  }, [isAuthenticated, user, router])

  // Fetch authors from API (fallback to mock data)
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const fetchedAuthors = await apiClient.getAuthors()
        if (fetchedAuthors && fetchedAuthors.length > 0) {
          setAuthors(fetchedAuthors)
        }
      } catch (error) {
        // Use mock data if API fails
        console.warn('Failed to fetch authors, using mock data:', error)
      }
    }

    fetchAuthors()
  }, [])

  // Handle step navigation
  const handleNext = async () => {
    // If on last step, submit preferences
    if (currentStep === totalSteps - 1) {
      const result = await submitPreferences()
      if (result.success) {
        await refreshUser().catch(() => {
          // If refresh fails, allow navigation anyway
        })
        router.push('/')
        router.refresh()
      }
    } else {
      nextStep()
    }
  }

  const handleBack = () => {
    prevStep()
  }

  const handleSkip = async () => {
    const result = await skipOnboarding()
    if (result.success) {
      await refreshUser().catch(() => {
        // Continue even if refresh fails
      })
      router.push('/')
      router.refresh()
    }
  }

  // Don't render if not authenticated or still checking onboarding
  if (!isAuthenticated || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Welcome to Book Social!
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Let's personalize your experience. We'll help you discover new books,
                follow your favorite authors, and connect with other readers.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-slate-900">What we'll set up:</h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Your favorite genres</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Authors you follow</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Option to import your existing reading data</span>
                </li>
              </ul>
            </div>
          </div>
        )

      case 1: // Genres
        return (
          <GenreSelector
            genres={genres}
            selectedGenres={selectedGenres}
            onToggleGenre={toggleGenre}
          />
        )

      case 2: // Authors
        return (
          <AuthorSelector
            authors={authors}
            selectedAuthorIds={selectedAuthorIds}
            onToggleAuthor={toggleAuthor}
          />
        )

      case 3: // Import
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Import Your Reading History
              </h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                Already have a Goodreads account? Import your books, ratings, and shelves in about a minute!
              </p>
            </div>

            {/* Goodreads Import Option */}
            <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 font-bold text-xl">G</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">Goodreads</h4>
                    <p className="text-sm text-slate-600">
                      Import your entire library, ratings, and reading status from Goodreads
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Export your library as CSV from Goodreads</li>
                        <li>Upload the CSV file here</li>
                        <li>We'll import all your books automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/import/goodreads')}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import from Goodreads
                </button>
              </div>
            </div>

            {/* Coming Soon - StoryGraph */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 opacity-60">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-lg">SG</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">StoryGraph</h4>
                  <p className="text-sm text-slate-600">
                    Import from StoryGraph
                  </p>
                  <span className="inline-block mt-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Skip option */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-500">
                Don't have Goodreads? No problem! You can add books manually later.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Step titles and descriptions
  const stepConfig = [
    {
      title: 'Welcome!',
      description: "Let's get you started",
    },
    {
      title: 'Choose Your Genres',
      description: 'Select the genres you love to read',
    },
    {
      title: 'Follow Authors',
      description: 'Search and select your favorite authors',
    },
    {
      title: 'Import Your Data',
      description: 'Bring your reading history from other platforms (optional)',
    },
  ]

  const currentStepConfig = stepConfig[currentStep]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-mobile py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step content */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 mb-6 min-h-[400px]">
            <OnboardingStep
              title={currentStepConfig.title}
              description={currentStepConfig.description}
            >
              {renderStepContent()}
            </OnboardingStep>
          </div>

          {/* Navigation buttons */}
          <OnboardingButtons
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            nextLabel={currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
            showBack={currentStep > 0}
            showSkip={currentStep < totalSteps - 1}
            isLoading={isLoading}
            nextDisabled={
              (currentStep === 1 && selectedGenres.length === 0) ||
              (currentStep === 2 && selectedAuthorIds.length === 0)
            }
          />

          <div className="text-center text-sm text-slate-500 mt-6">
            <p>
              Looking for curated picks? After completing onboarding, visit{' '}
              <Link href="/recommendations" className="text-primary-600 font-semibold hover:underline">
                Recommendations
              </Link>{' '}
              for books and authors tuned to your interests.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

