'use client'

import { useState } from 'react'
import type { RecommendedBook } from '@book-app/shared'
import Button from './Button'

interface RecommendedBookCardProps {
  recommendation: RecommendedBook
  onAddToShelf: () => Promise<void>
}

export default function RecommendedBookCard({ recommendation, onAddToShelf }: RecommendedBookCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { book, reason } = recommendation
  const authorName = book.author?.name ?? book.author_name ?? 'Unknown author'

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await onAddToShelf()
    } catch (error) {
      console.warn('Failed to add recommended book to shelf:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3 min-w-[240px] max-w-xs">
      <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-slate-400 text-sm">Cover unavailable</div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900 leading-tight">{book.title}</h3>
        <p className="text-sm text-slate-500">{authorName}</p>
      </div>

      <p className="text-sm text-slate-600 flex-1">{reason}</p>

      <Button
        onClick={handleAdd}
        variant="primary"
        size="md"
        isLoading={isAdding}
        className="mt-2"
      >
        Add to shelf
      </Button>
    </article>
  )
}

