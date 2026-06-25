'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Book, UserBook } from '@book-app/shared'
import { truncateText } from '../utils/format'
import { BookCoverImage } from './BookCoverImage'

interface BookCardProps {
  book: Book
  showDescription?: boolean
  coverSize?: 'small' | 'medium' | 'large'
  userBook?: UserBook
  priority?: boolean
}

export default function BookCard({
  book,
  showDescription = true,
  coverSize = 'medium',
  userBook,
  priority = false,
}: BookCardProps) {
  const isPrivate = userBook?.visibility === 'private'
  const isDnf     = userBook?.status === 'dnf'
  const hasNotes  = !!userBook?.notes?.trim()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Link
        href={`/books/${book.google_books_id ?? book.id}`}
        className="block rounded-[28px] overflow-hidden transition-all"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)' }}
      >
        {/* Book cover */}
        <div
          className="w-full overflow-hidden relative"
          style={{ aspectRatio: '2 / 3', backgroundColor: 'var(--color-grove)' }}
        >
          <BookCoverImage
            src={book.cover_image_url}
            title={book.title}
            author={book.author_name}
            isbn={book.isbn}
            size={coverSize}
            className="w-full h-full"
            layoutId={`book-cover-${book.google_books_id ?? book.id}`}
            priority={priority}
          />
          {/* Notes badge — subtle indicator on the cover */}
          {hasNotes && (
            <span
              className="absolute bottom-2 right-2 text-base leading-none"
              title="You have personal notes on this book"
            >
              📝
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-serif text-base font-bold text-lit mb-1 line-clamp-2">
            {book.title}
          </h3>
          {isPrivate && (
            <p className="text-xs text-lit-3 flex items-center gap-1 mb-2">
              <span aria-label="Private book" role="img">🔒</span>
              Only you can see this
            </p>
          )}
          {book.author_name && (
            <p className="text-sm text-lit-2 mb-2">by {book.author_name}</p>
          )}
          {showDescription && book.description && (
            <p className="text-sm text-lit-2 mb-2 line-clamp-3">
              {truncateText(book.description, 150)}
            </p>
          )}
          {isDnf && (
            <p
              className="text-xs italic text-lit-3 mb-2"
              title={userBook?.dnf_reason ? `Reason: ${userBook?.dnf_reason}` : undefined}
            >
              DNF at page {userBook?.dnf_page ?? '—'}
              {userBook?.dnf_reason && (
                <span className="text-lit-3"> • {userBook.dnf_reason}</span>
              )}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
