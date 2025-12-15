'use client'

// ShelfSelector Component - Choose shelf for book (to-read, reading, read)
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import { useState } from 'react'
import { useBookShelf } from '@book-app/shared'
import Button from './Button'
import type { BookShelf, UserBook, Book } from '@book-app/shared'

interface ShelfSelectorProps {
  bookId: number
  currentShelf?: BookShelf | null
  bookData?: Book // For Google Books results
  onShelfChange?: (shelf: BookShelf) => void
}

/**
 * Component for selecting book shelf
 * 
 * Usage:
 * ```tsx
 * <ShelfSelector bookId={book.id} currentShelf={userBook?.shelf} />
 * ```
 * 
 * For React Native:
 * - Replace buttons with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Keep the same prop interface
 */
export default function ShelfSelector({ bookId, currentShelf, bookData, onShelfChange }: ShelfSelectorProps) {
  const { addToShelf, loading } = useBookShelf()
  const [selectedShelf, setSelectedShelf] = useState<BookShelf | null>(currentShelf || null)

  const shelves: { value: BookShelf; label: string; icon: string }[] = [
    { value: 'to_read', label: 'To Read', icon: '📚' },
    { value: 'reading', label: 'Reading', icon: '📖' },
    { value: 'read', label: 'Read', icon: '✓' },
  ]

  const handleShelfSelect = async (shelf: BookShelf) => {
    try {
      await addToShelf(bookId, shelf, bookData)
      setSelectedShelf(shelf)
      onShelfChange?.(shelf)
    } catch (error) {
      console.error('Failed to update shelf:', error)
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
              disabled={loading}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
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

      {selectedShelf && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            This book is on your <span className="font-medium">{shelves.find(s => s.value === selectedShelf)?.label}</span> shelf
          </p>
        </div>
      )}
    </div>
  )
}

