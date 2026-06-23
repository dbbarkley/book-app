'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@book-app/shared'
import type { SeriesData, SeriesBook } from '@book-app/shared/types'

interface SeriesRowProps {
  googleBooksId: string
  title?: string
  author?: string
}

const BOOK_BG = [
  '#2C1654', '#4A3510', '#1A3D4F',
  '#1B3520', '#2A2010', '#1A1F58',
  '#200808', '#283018',
]
const TILTS = [-1.8, 1.2, -0.4, 1.6, -1.2, 0.9, -2.1, 1.5]

function positionLabel(pos: number): string {
  const frac = pos % 1
  if (Math.abs(frac - 0.5) < 0.01) return `#${Math.floor(pos)}.5`
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

  if (!loading && (!series || series.books.length < 2)) return null

  return (
    <section
      aria-label={series ? `${series.name} series` : 'Series'}
      style={{ borderTop: '2px dashed var(--color-rim)', paddingTop: 40, marginBottom: 48 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
            <span
              className="font-bold uppercase"
              style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent)' }}
            >
              Series
            </span>
          </div>
          {series && (
            <h2
              className="font-serif font-bold"
              style={{ fontSize: 28, color: 'var(--color-ink)', lineHeight: 1 }}
            >
              <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                {series.name}
              </span>
            </h2>
          )}
          {loading && (
            <div
              className="animate-pulse rounded"
              style={{ width: 180, height: 28, backgroundColor: 'var(--color-surface)' }}
            />
          )}
        </div>
        {!loading && series && (
          <span
            className="font-bold uppercase"
            style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--color-ink-3)', flexShrink: 0 }}
          >
            {series.books.length} Books
          </span>
        )}
      </div>

      {/* Shelf */}
      {loading ? (
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ paddingTop: 20 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-none animate-pulse" style={{ width: 190 }}>
              <div
                className="rounded-lg mb-3"
                style={{ width: 190, height: 285, backgroundColor: 'var(--color-surface)' }}
              />
              <div className="h-3 rounded mb-1.5" style={{ width: '80%', backgroundColor: 'var(--color-surface)' }} />
              <div className="h-2.5 rounded" style={{ width: '50%', backgroundColor: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
          style={{ paddingTop: 20, paddingLeft: 4, paddingRight: 4 }}
        >
          {series!.books.map((book: SeriesBook, i) => {
            const isCurrent = book.google_books_id === googleBooksId
            const bgColor = BOOK_BG[i % BOOK_BG.length]
            const tilt = TILTS[i % TILTS.length]
            const spineType = i % 5

            return (
              <Link
                key={book.google_books_id}
                href={`/books/${book.google_books_id}`}
                className="flex-none text-left transition-opacity hover:opacity-85"
                style={{ width: 190 }}
                aria-label={`${book.title} — ${positionLabel(book.position)} in series`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {/* Tilted book card */}
                <div
                  style={{
                    width: 190,
                    height: 285,
                    position: 'relative',
                    borderRadius: 6,
                    overflow: 'hidden',
                    backgroundColor: bgColor,
                    border: isCurrent
                      ? '2px solid var(--color-accent)'
                      : '2px solid rgba(26,26,26,0.75)',
                    boxShadow: isCurrent
                      ? '5px 5px 0px var(--color-accent)'
                      : '5px 5px 0px rgba(0,0,0,0.55)',
                    transform: `rotate(${tilt}deg)`,
                    transformOrigin: 'bottom center',
                    transition: 'transform 0.25s ease',
                    marginBottom: 16,
                  }}
                >
                  {/* Cover image */}
                  {book.cover_image_url && (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 38%, rgba(0,0,0,0.78) 68%)',
                    }}
                  />

                  {/* Spine decorations */}
                  {spineType === 0 && (
                    <div style={{ position: 'absolute', left: 14, right: 14, top: '57%', height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                  )}
                  {spineType === 1 && (
                    <div style={{ position: 'absolute', top: 32, left: 14, width: 11, height: 11, borderRadius: '50%', backgroundColor: 'rgba(167,139,250,0.72)' }} />
                  )}
                  {spineType === 2 && (
                    <div style={{ position: 'absolute', top: 20, left: 14, right: 14, height: 100, border: '1.5px solid rgba(213,88,46,0.42)', borderRadius: 2 }} />
                  )}
                  {spineType === 3 && (
                    <div style={{ position: 'absolute', right: 14, top: 14, bottom: '34%', width: 1, backgroundColor: 'rgba(241,199,91,0.48)' }} />
                  )}
                  {spineType === 4 && (
                    <div style={{ position: 'absolute', right: 14, top: 14, bottom: '34%', width: 1, backgroundColor: 'rgba(241,199,91,0.48)' }} />
                  )}

                  {/* Position badge */}
                  <p
                    className="absolute font-bold uppercase"
                    style={{
                      top: 12,
                      left: 12,
                      right: 12,
                      fontSize: 8,
                      letterSpacing: '0.16em',
                      color: isCurrent ? 'rgba(213,88,46,0.9)' : 'rgba(255,255,255,0.52)',
                      lineHeight: 1.3,
                    }}
                  >
                    {positionLabel(book.position)}
                  </p>

                  {/* Title */}
                  <p
                    className="absolute font-serif font-bold"
                    style={{
                      bottom: 12,
                      left: 12,
                      right: 12,
                      fontSize: 15,
                      lineHeight: 1.2,
                      color: '#FAF6EB',
                    }}
                  >
                    {book.title}
                  </p>
                </div>

                {/* Below card */}
                <p
                  className="font-bold line-clamp-1"
                  style={{
                    fontSize: 12,
                    color: isCurrent ? 'var(--color-accent)' : 'var(--color-ink)',
                    marginBottom: 3,
                  }}
                >
                  {book.title}
                </p>
                <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                  {positionLabel(book.position)} in series
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
