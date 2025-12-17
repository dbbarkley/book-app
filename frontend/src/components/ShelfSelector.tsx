'use client'

// ShelfSelector Component - Choose shelf for book (to-read, reading, read)
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import { useState, useEffect } from 'react'
import {
  useBookShelf,
  useUpdateBookShelf,
  useUpdateBookVisibility,
} from '@book-app/shared'
import type { ShelfStatus, UserBook, Book, Visibility } from '@book-app/shared'

interface ShelfSelectorProps {
  bookId: number
  currentShelf?: ShelfStatus | null
  bookData?: Book // For Google Books results
  onShelfChange?: (shelf: ShelfStatus) => void
  userBook?: UserBook | null
}

/**
 * Shelf selector allows picking between public shelves, DNF entries, and reading privacy.
 * Used in book detail so readers can mark visibility, record DNF metadata, and keep the backend in sync.
 */
export default function ShelfSelector({
  bookId,
  currentShelf,
  bookData,
  onShelfChange,
  userBook,
}: ShelfSelectorProps) {
  const { addToShelf, loading: addLoading, error: addError } = useBookShelf()
  const { updateShelf, loading: updateLoading, error: updateError } = useUpdateBookShelf()
  const {
    setVisibility,
    loading: visibilityLoading,
    error: visibilityError,
  } = useUpdateBookVisibility()

  const [selectedShelf, setSelectedShelf] = useState<ShelfStatus | null>(
    userBook?.status ?? currentShelf ?? null
  )
  const [dnfPage, setDnfPage] = useState('')
  const [dnfReason, setDnfReason] = useState('')
  const [isPrivate, setIsPrivate] = useState(userBook?.visibility === 'private')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedShelf(userBook?.status ?? currentShelf ?? null)
  }, [currentShelf, userBook?.status])

  useEffect(() => {
    setIsPrivate(userBook?.visibility === 'private')
  }, [userBook?.visibility])

  const shelves: { value: ShelfStatus; label: string; icon: string }[] = [
    { value: 'to_read', label: 'To Read', icon: '📚' },
    { value: 'reading', label: 'Reading', icon: '📖' },
    { value: 'read', label: 'Read', icon: '✓' },
    { value: 'dnf', label: 'Did Not Finish (DNF)', icon: '⚠️' },
  ]

  const isBusy = addLoading || updateLoading || visibilityLoading
  const errorMessage = localError || addError || updateError || visibilityError

  const handleShelfSelect = async (status: ShelfStatus) => {
    setLocalError(null)
    const trimmedReason = dnfReason.trim()
    const payload = {
      bookId,
      status,
      visibility: isPrivate ? 'private' : 'public',
      dnf_page: status === 'dnf' && dnfPage ? parseInt(dnfPage, 10) : undefined,
      dnf_reason: status === 'dnf' && trimmedReason ? trimmedReason : undefined,
    }

    try {
      if (userBook) {
        await updateShelf(payload)
      } else {
        await addToShelf(bookId, status, bookData, {
          visibility: payload.visibility as Visibility,
          dnf_reason: payload.dnf_reason,
          dnf_page: payload.dnf_page,
        })
      }
      setSelectedShelf(status)
      onShelfChange?.(status)
      if (status !== 'dnf') {
        setDnfPage('')
        setDnfReason('')
      }
    } catch (error) {
      console.error('Failed to update shelf:', error)
      setLocalError('Unable to update shelf. Please try again.')
    }
  }

  const handlePrivacyChange = async (visibility: Visibility) => {
    if (visibility === (isPrivate ? 'private' : 'public')) return
    setIsPrivate(visibility === 'private')
    if (!userBook) return
    try {
      await setVisibility(bookId, visibility)
    } catch (error) {
      console.error('Failed to update visibility:', error)
      setLocalError('Unable to update privacy. Try again.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">My Shelf</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shelves.map((shelf) => {
          const isSelected = selectedShelf === shelf.value
          return (
            <button
              key={shelf.value}
              onClick={() => handleShelfSelect(shelf.value)}
              disabled={isBusy}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-2xl mb-1">{shelf.icon}</div>
              <div className="text-sm font-medium">{shelf.label}</div>
              {isSelected && (
                <div className="text-xs text-primary-600 mt-1">Current</div>
              )}
            </button>
          )
        })}
      </div>

      {selectedShelf === 'dnf' && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Last page read (optional)
            </label>
            <input
              type="number"
              min={1}
              value={dnfPage}
              onChange={(event) => setDnfPage(event.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              placeholder="e.g., 142"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Reason for DNF (optional)
            </label>
            <textarea
              value={dnfReason}
              onChange={(event) => setDnfReason(event.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              rows={2}
              placeholder="Why did you stop reading?"
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Visibility</p>
          <p className="text-xs text-slate-500">Public unless you choose private</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handlePrivacyChange('public')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              !isPrivate
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Public
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handlePrivacyChange('private')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isPrivate
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Private
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Private books stay out of the public feed, followers' timelines, and your profile.
        </p>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      )}

      {selectedShelf && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            This book is on your{' '}
            <span className="font-medium">
              {shelves.find((shelf) => shelf.value === selectedShelf)?.label}
            </span>{' '}
            shelf
          </p>
        </div>
      )}
    </div>
  )
}

