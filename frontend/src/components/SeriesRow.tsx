'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@book-app/shared'
import type { SeriesData, SeriesBook } from '@book-app/shared/types'

interface SeriesRowProps {
  googleBooksId: string
  title?: string
  author?: string
}

function positionLabel(pos: number): string {
  return `#${pos}`
}

export function SeriesRow({ googleBooksId, title, author }: SeriesRowProps) {
  const [series, setSeries] = useState<SeriesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getBookSeries(googleBooksId, title, author)
      .then(setSeries)
      .catch(() => setSeries(null))
      .finally(() => setLoading(false))
  }, [googleBooksId, title, author])

  // Don't render if loading, no series, or only one book (no row to show)
  if (loading || !series || series.books.length < 2) return null

  return (
    <section
      aria-label={`${series.name} series`}
      style={{ borderTop: '2px solid var(--color-ink)', paddingTop: 32, marginTop: 40 }}
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: 'var(--color-accent)' }}
        >
          Series
        </span>
      </div>

      <h2
        className="font-serif font-bold text-xl mb-5"
        style={{ color: 'var(--color-ink)' }}
      >
        {series.name}
      </h2>

      {/* Horizontal scroll row — hide scrollbar cross-browser */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {series.books.map((book: SeriesBook) => {
          const isCurrent = book.google_books_id === googleBooksId
          return (
            <Link
              key={book.google_books_id}
              href={`/books/${book.google_books_id}`}
              className="flex-none"
              style={{ width: 88 }}
              aria-label={`${book.title} — ${positionLabel(book.position)} in series`}
              aria-current={isCurrent ? 'page' : undefined}
            >
              <div
                style={{
                  border: '2px solid var(--color-ink)',
                  boxShadow: isCurrent
                    ? '4px 4px 0px var(--color-accent)'
                    : '3px 3px 0px var(--color-ink)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                {/* Position badge */}
                <div
                  className="text-[10px] font-bold text-center py-0.5 tracking-wide"
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--color-accent)'
                      : 'var(--color-surface)',
                    color: isCurrent ? '#fff' : 'var(--color-ink-3)',
                    borderBottom: '1px solid var(--color-rim)',
                  }}
                >
                  {positionLabel(book.position)}
                </div>

                {/* Cover */}
                <div
                  style={{
                    width: 84,
                    height: 120,
                    backgroundColor: 'var(--color-cave)',
                    position: 'relative',
                  }}
                >
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="84px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <span
                        className="text-[9px] font-serif text-center leading-tight"
                        style={{ color: 'var(--color-ink-3)' }}
                      >
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p
                className="text-[11px] mt-1.5 leading-tight line-clamp-2"
                style={{
                  color: isCurrent ? 'var(--color-accent)' : 'var(--color-ink-2)',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {book.title}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
