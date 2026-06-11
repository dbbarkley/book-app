'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { useUpdateBookShelf } from '@book-app/shared/hooks'
import { BookCoverImage } from '../BookCoverImage'

interface DashboardUpNextProps {
  books: UserBook[]
  onUpdate?: () => void
}

const CARD_ROTATIONS  = [-1.5, 0.8, -1]
const COVER_ROTATIONS = [-4, 3, -3]
const SHADOW_COLORS   = [
  'var(--color-accent)',
  'var(--color-accent-teal)',
  'var(--color-accent-yellow)',
]

export default function DashboardUpNext({ books, onUpdate }: DashboardUpNextProps) {
  const next = books.slice(0, 3)
  const { updateShelf } = useUpdateBookShelf()
  const [startingId, setStartingId] = useState<number | null>(null)

  if (next.length === 0) return null

  async function handleStartReading(userBookId: number) {
    setStartingId(userBookId)
    try {
      await updateShelf({ userBookId, status: 'reading' })
      onUpdate?.()
    } finally {
      setStartingId(null)
    }
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)' }} />
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--color-accent)' }}
            >
              Up Next
            </span>
          </div>
          <h2
            className="font-serif font-bold leading-none tracking-tight"
            style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
          >
            From your{' '}
            <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>to-read</em>
          </h2>
        </div>

        <Link
          href="/library#to-read"
          className="text-[12px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: 'var(--color-ink)' }}
        >
          See all ({books.length}) →
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {next.map((ub, i) => {
          const book = ub.book
          if (!book) return null
          const href = `/books/${book.google_books_id ?? book.id}`

          return (
            <div
              key={ub.id}
              className="relative overflow-hidden"
              style={{
                backgroundColor: 'var(--color-canvas)',
                border: '2px solid var(--color-ink)',
                borderRadius: 16,
                boxShadow: `5px 5px 0px ${SHADOW_COLORS[i % SHADOW_COLORS.length]}`,
                transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)`,
                padding: '20px 20px 20px 16px',
              }}
            >
              <div className="flex gap-4 items-start">
                {/* Cover — rotated */}
                <Link
                  href={href}
                  className="flex-shrink-0"
                  style={{ transform: `rotate(${COVER_ROTATIONS[i % COVER_ROTATIONS.length]}deg)`, marginTop: 4 }}
                >
                  <div
                    style={{
                      width: 72,
                      aspectRatio: '2/3',
                      borderRadius: 6,
                      overflow: 'hidden',
                      boxShadow: '3px 6px 14px rgba(0,0,0,0.35)',
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}
                  >
                    <BookCoverImage
                      src={book.cover_image_url}
                      title={book.title}
                      author={book.author_name}
                      size="small"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={href}>
                    <p
                      className="font-serif font-bold leading-snug line-clamp-2 hover:opacity-70 transition-opacity mb-0.5"
                      style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--color-ink)' }}
                    >
                      {book.title}
                    </p>
                  </Link>
                  {book.author_name && (
                    <p className="text-[12px] truncate mb-3" style={{ color: 'var(--color-ink-3)' }}>
                      {book.author_name}
                    </p>
                  )}

                  <button
                    onClick={() => handleStartReading(ub.id)}
                    disabled={startingId === ub.id}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '7px 14px',
                    }}
                  >
                    <BookOpen size={11} strokeWidth={2.5} />
                    {startingId === ub.id ? 'Starting…' : 'Start Reading'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
