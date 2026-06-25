'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Flame, BookOpen, Target, Plus, PenLine } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from '../BookCoverImage'
import QuickUpdateModal from '../QuickUpdateModal'
import QuickNoteModal from '../QuickNoteModal'

interface DashboardHeroProps {
  readingBooks: UserBook[]
  onUpdate?: () => void
  userName?: string
  loading?: boolean
  readingGoal?: number | null
  completedThisYear?: number
  toReadCount?: number
  readingStreak?: number
}

function timeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Quiet Afternoon'
  if (h < 21) return 'Good Evening'
  return 'Late Night'
}

function formatDate(): string {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function daysDeepLabel(startedAt?: string | null): number | null {
  if (!startedAt) return null
  return Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)))
}

export default function DashboardHero({
  readingBooks,
  onUpdate,
  userName,
  loading,
  readingGoal,
  completedThisYear = 0,
  toReadCount = 0,
  readingStreak = 0,
}: DashboardHeroProps) {
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [selectedBook,   setSelectedBook]   = useState<UserBook | null>(null)

  const firstName   = userName?.split(' ')[0] ?? 'Reader'
  const activeBook  = readingBooks?.[0] ?? null
  const book        = activeBook?.book ?? null
  const pct         = activeBook?.completion_percentage ?? 0
  const pagesRead   = activeBook?.pages_read ?? 0
  const totalPages  = activeBook?.total_pages ?? book?.page_count
  const lastRead    = activeBook?.updated_at ? timeAgo(activeBook.updated_at) : null
  const daysDeep    = daysDeepLabel(activeBook?.started_at)
  const bookHref    = book?.id ? `/books/${book.google_books_id ?? book.id}` : '#'

  // Dynamic blurb
  let blurb: React.ReactNode = null
  if (book) {
    if (daysDeep !== null) {
      blurb = (
        <>
          You&apos;re <strong>{daysDeep} day{daysDeep !== 1 ? 's' : ''} deep</strong> into{' '}
          <em>{book.title}</em>. {pct}% of the way through — keep the momentum.
        </>
      )
    } else {
      blurb = (
        <>
          You&apos;re reading <em>{book.title}</em> and you&apos;re {pct}% of the way through. Keep going.
        </>
      )
    }
  } else {
    blurb = (
      <>
        Your shelf is ready. Pick something from your to-read list and{' '}
        <em>make today count.</em>
      </>
    )
  }

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-8 items-center animate-pulse">
        <div className="space-y-4">
          <div className="h-3 w-40 rounded" style={{ backgroundColor: 'var(--color-cave)' }} />
          <div className="h-14 w-3/4 rounded" style={{ backgroundColor: 'var(--color-cave)' }} />
          <div className="h-4 w-full rounded" style={{ backgroundColor: 'var(--color-cave)' }} />
        </div>
        <div className="h-56 rounded-2xl" style={{ backgroundColor: 'var(--color-cave)' }} />
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

      {/* ── Left: Welcome ──────────────────────────────── */}
      <div>
        {/* Date + time of day */}
        <p
          className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
          style={{ color: 'var(--color-ink-3)' }}
        >
          {formatDate()} · {timeOfDay()}
        </p>

        {/* Headline */}
        <h1
          className="font-serif font-bold leading-[1.03] tracking-tight mb-5"
          style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}
        >
          Hello again,
          <br />
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>{firstName}.</em>
        </h1>

        {/* Dynamic blurb */}
        <p className="text-[16px] leading-relaxed mb-7" style={{ color: 'var(--color-ink-2)' }}>
          {blurb}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Flame size={15} style={{ color: 'var(--color-accent)' }} />
            <span className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>
              {readingStreak} day streak
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-rim)' }} />

          <div className="flex items-center gap-1.5">
            <BookOpen size={15} style={{ color: 'var(--color-ink-3)' }} />
            <span className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>
              {toReadCount} to read
            </span>
          </div>

          {readingGoal && (
            <>
              <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-rim)' }} />
              <div className="flex items-center gap-1.5">
                <Target size={15} style={{ color: 'var(--color-ink-3)' }} />
                <span className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>
                  {completedThisYear} of {readingGoal} books
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right: Mini currently-reading card ─────────── */}
      {book ? (
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: 'var(--color-accent-teal)',
            border: '2px solid var(--color-ink)',
            borderRadius: 16,
            boxShadow: '6px 6px 0px var(--color-accent)',
            padding: '20px 24px',
          }}
        >
          {/* Yellow glow — top right */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -80, right: -60,
              width: 240, height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(241,199,91,0.2) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative flex gap-5">
            {/* Book cover — slightly tilted */}
            <div className="flex-shrink-0" style={{ transform: 'rotate(-3deg)', marginTop: 4 }}>
              <Link href={bookHref}>
                <div
                  style={{
                    width: 80,
                    aspectRatio: '2/3',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '3px 6px 16px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                >
                  <BookCoverImage
                    src={book.cover_image_url}
                    title={book.title}
                    author={book.author_name}
                    isbn={book.isbn}
                    size="medium"
                    className="w-full h-full object-cover"
                    priority={true}
                  />
                </div>
              </Link>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <div className="mb-2">
                <span
                  style={{
                    display: 'inline-block',
                    border: '2px solid var(--color-accent-yellow)',
                    borderRadius: 5,
                    padding: '3px 8px',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: 'var(--color-accent-yellow)',
                    textTransform: 'uppercase',
                  }}
                >
                  Pick up where you left off
                </span>
              </div>

              {/* Title */}
              <h2
                className="font-serif font-bold leading-[1.1] tracking-tight mb-0.5"
                style={{ color: '#FAF6EB', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
              >
                {book.title}
              </h2>

              {/* Author */}
              {book.author_name && (
                <p className="text-[12px] mb-3" style={{ color: 'rgba(250,246,235,0.5)' }}>
                  {book.author_name}
                </p>
              )}

              {/* % + page count + last read */}
              <div className="flex items-baseline gap-2 mb-1.5">
                <span
                  className="font-serif font-bold"
                  style={{ fontSize: 28, color: 'var(--color-accent-yellow)', lineHeight: 1 }}
                >
                  {pct}%
                </span>
                <span className="text-[12px]" style={{ color: 'rgba(250,246,235,0.45)' }}>
                  p. {pagesRead} / {totalPages ?? '???'}
                  {lastRead ? ` · ${lastRead}` : ''}
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="mb-4"
                style={{
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-accent-yellow)',
                    borderRadius: 999,
                  }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setSelectedBook(activeBook); setIsModalOpen(true) }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--color-accent-yellow)',
                    color: 'var(--color-ink)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 999,
                    padding: '8px 14px',
                  }}
                >
                  <Plus size={11} strokeWidth={3} />
                  Log Session
                </button>

                <button
                  onClick={() => { setSelectedBook(activeBook); setIsNoteModalOpen(true) }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                  style={{
                    color: 'rgba(250,246,235,0.85)',
                    border: '2px solid rgba(250,246,235,0.3)',
                    borderRadius: 999,
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                  }}
                >
                  <PenLine size={11} />
                  New Note
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No book in progress — prompt */
        <Link href="/search?type=books">
          <div
            className="flex flex-col items-center justify-center text-center py-10 transition-opacity hover:opacity-80"
            style={{
              border: '2px dashed var(--color-rim)',
              borderRadius: 16,
              minHeight: 200,
            }}
          >
            <p className="font-serif font-bold mb-1" style={{ fontSize: 20, color: 'var(--color-ink)' }}>
              Nothing in progress.
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-ink-3)' }}>
              Find your next read →
            </p>
          </div>
        </Link>
      )}

      <QuickUpdateModal
        userBook={selectedBook || { id: 0, book_id: 0, status: 'to_read' } as any}
        isOpen={isModalOpen && !!selectedBook}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />

      {selectedBook && (
        <QuickNoteModal
          userBook={selectedBook}
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          onSaved={onUpdate}
        />
      )}
    </div>
  )
}
