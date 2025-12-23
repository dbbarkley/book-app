// Onboarding Hook - Wrapper around onboarding store and API calls
// Reusable in Next.js and React Native
// Manages onboarding flow state and API interactions

import { useCallback } from 'react'
import { useOnboardingStore } from '../store/onboardingStore'
import { apiClient } from '../api/client'

/**
 * Hook for onboarding state and actions
 * Combines Zustand store state with API calls
 * 
 * Usage:
 * ```tsx
 * const {
 *   currentStep,
 *   selectedGenres,
 *   selectedAuthorIds,
 *   nextStep,
 *   prevStep,
 *   toggleGenre,
 *   toggleAuthor,
 *   submitPreferences,
 *   skipOnboarding
 * } = useOnboarding()
 * ```
 * 
 * In React Native:
 * - Replace router.push with React Navigation
 * - Keep the same hook interface for consistency
 */
export function useOnboarding() {
  const {
    currentStep,
    totalSteps,
    selectedGenres,
    selectedAuthorIds,
    zipcode,
    isLoading,
    error,
    nextStep,
    prevStep,
    setCurrentStep,
    toggleGenre,
    toggleAuthor,
    setZipcode,
    setSelectedGenres,
    setSelectedAuthorIds,
    setLoading,
    setError,
    reset,
  } = useOnboardingStore()

  /**
   * Submit preferences to backend
   * Marks onboarding as completed
   * Returns success/error state
   */
  const submitPreferences = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await apiClient.savePreferences({
        genres: selectedGenres,
        author_ids: selectedAuthorIds,
        zipcode: zipcode,
        onboarding_completed: true,
      })

      setLoading(false)
      return { success: true }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.errors?.join(', ') ||
        error.message ||
        'Failed to save preferences'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [selectedGenres, selectedAuthorIds, zipcode, setLoading, setError])

  /**
   * Skip onboarding - mark as completed without preferences
   * Useful for users who want to explore first
   */
  const skipOnboarding = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await apiClient.savePreferences({
        onboarding_completed: true,
      })

      setLoading(false)
      return { success: true }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.errors?.join(', ') ||
        error.message ||
        'Failed to skip onboarding'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [setLoading, setError])

  /**
   * Import data from external service (placeholder)
   * Currently returns mock success
   * TODO: Implement actual import logic when backend is ready
   */
  const importData = useCallback(
    async (service: 'goodreads' | 'storygraph', file: File) => {
      setLoading(true)
      setError(null)

      try {
        const result =
          service === 'goodreads'
            ? await apiClient.importFromGoodreads(file)
            : await apiClient.importFromStoryGraph(file)

        setLoading(false)
        return { success: true, data: result }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.errors?.join(', ') ||
          error.message ||
          `Failed to import from ${service}`
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [setLoading, setError]
  )

  return {
    // State
    currentStep,
    totalSteps,
    selectedGenres,
    selectedAuthorIds,
    zipcode,
    isLoading,
    error,

    // Actions
    nextStep,
    prevStep,
    setCurrentStep,
    toggleGenre,
    toggleAuthor,
    setZipcode,
    setSelectedGenres,
    setSelectedAuthorIds,
    submitPreferences,
    skipOnboarding,
    importData,
    reset,
  }
}

