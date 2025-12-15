// Onboarding Store - Zustand store for onboarding state
// Reusable in Next.js and React Native
// Manages temporary onboarding state (current step, selections)
// Final preferences are persisted via API to backend

import { create } from 'zustand'
import type { Genre } from '../types'

interface OnboardingState {
  currentStep: number
  totalSteps: number
  selectedGenres: string[]
  selectedAuthorIds: number[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  toggleGenre: (genreId: string) => void
  toggleAuthor: (authorId: number) => void
  setSelectedGenres: (genres: string[]) => void
  setSelectedAuthorIds: (authorIds: number[]) => void
  reset: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const initialState = {
  currentStep: 0,
  totalSteps: 4, // Welcome, Genres, Authors, Import
  selectedGenres: [],
  selectedAuthorIds: [],
  isLoading: false,
  error: null,
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setCurrentStep: (step: number) => {
    const { totalSteps } = get()
    if (step >= 0 && step < totalSteps) {
      set({ currentStep: step })
    }
  },

  nextStep: () => {
    const { currentStep, totalSteps } = get()
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 })
    }
  },

  toggleGenre: (genreId: string) => {
    const { selectedGenres } = get()
    set({
      selectedGenres: selectedGenres.includes(genreId)
        ? selectedGenres.filter((id) => id !== genreId)
        : [...selectedGenres, genreId],
    })
  },

  toggleAuthor: (authorId: number) => {
    const { selectedAuthorIds } = get()
    set({
      selectedAuthorIds: selectedAuthorIds.includes(authorId)
        ? selectedAuthorIds.filter((id) => id !== authorId)
        : [...selectedAuthorIds, authorId],
    })
  },

  setSelectedGenres: (genres: string[]) => {
    set({ selectedGenres: genres })
  },

  setSelectedAuthorIds: (authorIds: number[]) => {
    set({ selectedAuthorIds: authorIds })
  },

  reset: () => {
    set(initialState)
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },
}))

