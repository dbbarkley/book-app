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
  
  if (!recommendation || !recommendation.book) {
    return null
  }

  const { book, reason } = recommendation
  const authorName = book.author?.name ?? book.author_name ?? 'Unknown author'

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking the button
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
    <Link href={`/books/${book.id}`} className="block h-full group">
      <article className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3 w-full h-full transition-all hover:shadow-md hover:border-brand-indigo/30">
        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
          <BookCoverImage
            src={book.cover_image_url}
            title={book.title}
            author={authorName}
            size="medium"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-brand-indigo transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate">{authorName}</p>
        </div>

        <p className="text-xs text-slate-600 line-clamp-3 italic flex-1">
          &ldquo;{reason}&rdquo;
        </p>

        <Button
          onClick={handleAdd}
          variant="primary"
          size="sm"
          isLoading={isAdding}
          className="mt-2 w-full font-bold shadow-sm"
        >
          Add to shelf
        </Button>
      </article>
    </Link>
  )
}

