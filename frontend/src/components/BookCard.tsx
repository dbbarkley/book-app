'use client'

// BookCard Component - Reusable card for displaying book information
// Now with smart cover loading, shimmer effects, and modern placeholders
// Added Framer Motion for springy interactions and shared layout transitions

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
}

export default function BookCard({
  book,
  showDescription = true,
  coverSize = 'medium',
  userBook,
}: BookCardProps) {
  const isPrivate = userBook?.visibility === 'private'
  const isDnf = userBook?.status === 'dnf'
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Link
        href={`/books/${book.id}`}
        className="block bg-background-card rounded-lg border border-border-default overflow-hidden hover:shadow-lg transition-shadow duration-300"
      >
        {/* Book cover with smart loading and fallback */}
        <div className="aspect-[2/3] w-full overflow-hidden bg-background-muted flex items-center justify-center">
          <BookCoverImage
            src={book.cover_image_url}
            title={book.title}
            author={book.author_name}
            size={coverSize}
            className="w-full h-full"
            layoutId={`book-cover-${book.id}`}
          />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-2">
            {book.title}
          </h3>
            {isPrivate && (
              <p className="text-xs text-text-secondary flex items-center gap-1 mb-2">
                <span aria-label="Private book" role="img">
                  🔒
                </span>
                Only you can see this
              </p>
            )}
          {book.author_name && (
            <p className="text-sm text-text-secondary mb-2">by {book.author_name}</p>
          )}
          {showDescription && book.description && (
            <p className="text-sm text-text-secondary mb-2 line-clamp-3">
              {truncateText(book.description, 150)}
            </p>
          )}
            {isDnf && (
              <>
                {/* DNF metadata keeps these entries visible without counting them as “read.” */}
                <p
                  className="text-xs italic text-text-secondary mb-2"
                  title={userBook?.dnf_reason ? `Reason: ${userBook?.dnf_reason}` : undefined}
                >
                  DNF at page {userBook?.dnf_page ?? '—'}
                  {userBook?.dnf_reason && (
                    <span className="text-text-muted"> • {userBook.dnf_reason}</span>
                  )}
                </p>
              </>
            )}
          <div className="flex items-center justify-between text-xs text-text-muted">
            {/* <span>Released {formatDate(book.release_date)}</span> */}
            {book.followers_count !== undefined && (
              <span>{book.followers_count} followers</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

