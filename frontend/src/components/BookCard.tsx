'use client'

// BookCard Component - Reusable card for displaying book information
// Now with smart cover loading, shimmer effects, and modern placeholders

import Link from 'next/link'
import type { Book } from '@book-app/shared'
import { formatDate, truncateText } from '../utils/format'
import { BookCoverImage } from './BookCoverImage'

interface BookCardProps {
  book: Book
  showDescription?: boolean
  coverSize?: 'small' | 'medium' | 'large'
}

export default function BookCard({ 
  book, 
  showDescription = true,
  coverSize = 'medium' 
}: BookCardProps) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Book cover with smart loading and fallback */}
      <div className="aspect-[2/3] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        <BookCoverImage
          src={book.cover_image_url}
          title={book.title}
          author={book.author_name}
          size={coverSize}
          className="w-full h-full"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-2">
          {book.title}
        </h3>
        {book.author_name && (
          <p className="text-sm text-slate-600 mb-2">by {book.author_name}</p>
        )}
        {showDescription && book.description && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-3">
            {truncateText(book.description, 150)}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Released {formatDate(book.release_date)}</span>
          {book.followers_count !== undefined && (
            <span>{book.followers_count} followers</span>
          )}
        </div>
      </div>
    </Link>
  )
}

