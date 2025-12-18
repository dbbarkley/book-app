'use client'

// BookProgress Component - Update reading progress (pages or percentage)
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import { useState } from 'react'
import { useBookProgress } from '@book-app/shared'
import Button from './Button'
import type { UserBook } from '@book-app/shared'
import InputField from './InputField'

interface BookProgressProps {
  bookId: number
  userBook?: UserBook | null
  onUpdate?: () => void
}

/**
 * Component for updating reading progress
 * 
 * Usage:
 * ```tsx
 * <BookProgress bookId={book.id} userBook={userBook} />
 * ```
 * 
 * For React Native:
 * - Replace input with TextInput from react-native
 * - Adjust className to StyleSheet
 * - Keep the same prop interface
 */
export default function BookProgress({ bookId, userBook, onUpdate }: BookProgressProps) {
  const { updateProgress, loading } = useBookProgress()
  const [pagesRead, setPagesRead] = useState(userBook?.pages_read?.toString() || '')
  const [totalPages, setTotalPages] = useState(userBook?.total_pages?.toString() || '')
  const [completionPercentage, setCompletionPercentage] = useState(
    userBook?.completion_percentage?.toString() || ''
  )
  const [mode, setMode] = useState<'pages' | 'percentage'>(
    userBook?.total_pages ? 'pages' : 'percentage'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'pages') {
        const updates: {
          pages_read?: number
          total_pages?: number
          completion_percentage?: number
        } = {}
        if (pagesRead) updates.pages_read = parseInt(pagesRead)
        if (totalPages) updates.total_pages = parseInt(totalPages)
        if (updates.pages_read && updates.total_pages) {
          updates.completion_percentage = Math.round(
            (updates.pages_read / updates.total_pages) * 100
          )
        }
        await updateProgress(bookId, updates)
      } else {
        const percentage = parseInt(completionPercentage)
        if (percentage >= 0 && percentage <= 100) {
          await updateProgress(bookId, { completion_percentage: percentage })
        }
      }
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const currentProgress = userBook?.completion_percentage || 0

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Reading Progress</h3>

      {/* Progress Bar */}
      {userBook && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>{currentProgress}% Complete</span>
            {userBook.total_pages && userBook.pages_read && (
              <span>
                {userBook.pages_read} / {userBook.total_pages} pages
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('pages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'pages'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pages
          </button>
          <button
            type="button"
            onClick={() => setMode('percentage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'percentage'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Percentage
          </button>
        </div>

        {/* Pages Mode */}
        {mode === 'pages' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pages-read" className="block text-sm font-medium text-slate-700 mb-1">
                Pages Read
              </label>
              <InputField
                id="pages-read"
                type="number"
                min="0"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="total-pages" className="block text-sm font-medium text-slate-700 mb-1">
                Total Pages
              </label>
              <InputField
                id="total-pages"
                type="number"
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Percentage Mode */}
        {mode === 'percentage' && (
          <div>
            <label htmlFor="completion" className="block text-sm font-medium text-slate-700 mb-1">
              Completion (%)
            </label>
            <InputField
              id="completion"
              type="number"
              min="0"
              max="100"
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
        )}

        <Button type="submit" isLoading={loading} fullWidth>
          Update Progress
        </Button>
      </form>
    </div>
  )
}

