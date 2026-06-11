'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import type { BookSuggestion, Book } from '@book-app/shared'
import { useBooksStore } from '@book-app/shared/store/booksStore'
import { BookCoverImage } from './BookCoverImage'

interface SuggestionsSectionProps {
  suggestions: BookSuggestion[]
  loading: boolean
  dismissSuggestion: (id: number) => Promise<void>
  onUpdate?: () => void
}

function SuggesterAvatar({ name, src }: { name: string; src?: string }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
        style={{ border: '1.5px solid var(--color-ink)' }}
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 text-[11px] font-bold"
      style={{
        backgroundColor: 'var(--color-accent)',
        border: '1.5px solid var(--color-ink)',
        color: '#fff',
      }}
    >
      {initial}
    </span>
  )
}

export default function SuggestionsSection({
  suggestions,
  loading,
  dismissSuggestion,
  onUpdate,
}: SuggestionsSectionProps) {
  const [addingId, setAddingId] = useState<number | null>(null)
  const { addToShelf } = useBooksStore()

  if (loading) return null

  const oneWeekAgo   = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek  = suggestions.filter(s => new Date(s.created_at).getTime() > oneWeekAgo).length

  async function handleAddToRead(s: BookSuggestion) {
    setAddingId(s.id)
    try {
      await addToShelf(s.book.id, 'to_read', s.book as unknown as Book)
      await dismissSuggestion(s.id)
      onUpdate?.()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
              From Friends
            </span>
          </div>
          <h2
            className="font-serif font-bold leading-none tracking-tight"
            style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
          >
            Suggestions{' '}
            <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>just for you</em>
          </h2>
        </div>

        {newThisWeek > 0 && (
          <span className="text-[13px] font-bold flex-shrink-0" style={{ color: 'var(--color-ink-2)' }}>
            {newThisWeek} new this week
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center py-10 text-center"
          style={{
            backgroundColor: 'var(--color-canvas)',
            border: '2px dashed var(--color-rim)',
            borderRadius: 16,
          }}
        >
          <p className="font-serif font-bold mb-1" style={{ fontSize: 20, color: 'var(--color-ink)' }}>
            No suggestions yet.
          </p>
          <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
            When friends recommend books, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        /* Horizontal scroll row */
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          {suggestions.map(s => {
            const suggesterName = s.suggester.display_name || s.suggester.username
            const bookHref = `/books/${s.book.google_books_id ?? s.book.id}`

            return (
              <div
                key={s.id}
                className="flex-none snap-start flex flex-col gap-4 p-5"
                style={{
                  width: 'min(420px, 85vw)',
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 16,
                  boxShadow: '4px 4px 0px var(--color-accent)',
                }}
              >
                {/* Book row: cover + title/author */}
                <div className="flex gap-4">
                  <Link href={bookHref} className="flex-shrink-0">
                    <div
                      className="overflow-hidden"
                      style={{ width: 56, aspectRatio: '2/3', borderRadius: 6, boxShadow: '2px 2px 8px rgba(0,0,0,0.2)' }}
                    >
                      <BookCoverImage
                        src={s.book.cover_image_url}
                        title={s.book.title}
                        author={s.book.author_name}
                        size="small"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  <div className="min-w-0">
                    <Link href={bookHref}>
                      <p
                        className="font-serif font-bold leading-snug line-clamp-2 hover:underline"
                        style={{ fontSize: 17, color: 'var(--color-ink)' }}
                      >
                        {s.book.title}
                      </p>
                    </Link>
                    {s.book.author_name && (
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--color-ink-3)' }}>
                        {s.book.author_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Suggester + message */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <SuggesterAvatar name={suggesterName} src={s.suggester.avatar_url} />
                    <span className="text-[13px]" style={{ color: 'var(--color-ink-2)' }}>
                      <span className="font-bold" style={{ color: 'var(--color-ink)' }}>{suggesterName}</span>
                      {' '}thinks you&apos;d like this:
                    </span>
                  </div>

                  {s.message && (
                    <div
                      className="px-3 py-2.5 italic text-[13px] leading-snug"
                      style={{
                        border: '1.5px solid var(--color-rim)',
                        borderRadius: 8,
                        color: 'var(--color-ink-2)',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      &ldquo;{s.message}&rdquo;
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => handleAddToRead(s)}
                    disabled={addingId === s.id}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '9px 16px',
                    }}
                  >
                    <Plus size={12} strokeWidth={3} />
                    {addingId === s.id ? 'Adding…' : 'Add to To-Read'}
                  </button>

                  <Link
                    href={bookHref}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
                    style={{
                      color: 'var(--color-ink)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '9px 14px',
                    }}
                  >
                    View book
                    <ArrowRight size={11} />
                  </Link>

                  <button
                    onClick={() => dismissSuggestion(s.id)}
                    className="text-[11px] font-medium transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-ink-3)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
