'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RecommendedBook } from '@book-app/shared'
import Button from './Button'
import { BookCoverImage } from './BookCoverImage'

interface RecommendedBookCardProps {
  recommendation: RecommendedBook
  onAddToShelf: () => Promise<void>
}

export default function RecommendedBookCard({ recommendation, onAddToShelf }: RecommendedBookCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  if (!recommendation || !recommendation.book) return null

  const { book, reason } = recommendation
  const authorName = book.author?.name ?? book.author_name ?? 'Unknown author'

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
    <Link href={`/books/${book.id}`} className="block group">
      <article
        className="rounded-2xl p-4 flex flex-row gap-4 w-full h-full transition-all"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-rim)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        {/* Portrait cover — correct 2:3 ratio, no cropping */}
        <div
          className="flex-shrink-0 w-20 rounded-xl overflow-hidden"
          style={{
            aspectRatio: '2 / 3',
            backgroundColor: 'var(--color-grove)',
          }}
        >
          <BookCoverImage
            src={book.cover_image_url}
            title={book.title}
            author={authorName}
            size="small"
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Info column */}
        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
          <div className="space-y-1 mb-3">
            <h3 className="font-serif text-base font-bold text-ink leading-tight line-clamp-2 group-hover:text-accent transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-ink-2 font-medium truncate">{authorName}</p>
          </div>

          <p className="text-xs text-ink-2 line-clamp-3 italic mb-3 flex-1">
            &ldquo;{reason}&rdquo;
          </p>

          <Button
            onClick={handleAdd}
            variant="primary"
            size="sm"
            isLoading={isAdding}
            className="w-full font-bold shadow-sm"
          >
            Add to shelf
          </Button>
        </div>
      </article>
    </Link>
  )
}
