'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, ChevronRight } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from '../BookCoverImage'

interface DashboardUpNextProps {
  /** Books from the user's `to_read` shelf. */
  books: UserBook[]
}

/**
 * "Up Next" — shows the first 3 books from the to-read shelf as covers.
 * Mirrors the mobile home-screen Up Next strip.
 */
export default function DashboardUpNext({ books }: DashboardUpNextProps) {
  const router = useRouter()
  const next = books.slice(0, 3)

  if (next.length === 0) return null

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-lit)' }}>Up Next</h2>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1"
          style={{ fontSize: 13, color: 'var(--color-lit-2)' }}
        >
          See all <ChevronRight size={13} />
        </Link>
      </div>

      {/* Covers row */}
      <div className="flex" style={{ gap: 12 }}>
        {next.map((ub) => {
          const book = ub.book
          if (!book) return null
          const href = `/books/${book.google_books_id ?? book.id}`
          return (
            <button
              key={ub.id}
              onClick={() => router.push(href)}
              className="flex flex-col text-left"
              style={{ width: 'calc((100% - 24px) / 3)', gap: 6 }}
            >
              <div
                className="w-full rounded-xl overflow-hidden shadow-md"
                style={{ aspectRatio: '2/3' }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="medium"
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="line-clamp-2"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-lit)', lineHeight: '16px' }}
              >
                {book.title}
              </p>
              {book.author_name && (
                <p className="truncate" style={{ fontSize: 11, color: 'var(--color-lit-3)' }}>
                  {book.author_name}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
