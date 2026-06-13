'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, PenLine, CheckCheck, Lock } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { useUpdateBookShelf } from '@book-app/shared/hooks'
import { BookCoverImage } from './BookCoverImage'
import QuickUpdateModal from './QuickUpdateModal'

interface ReadingHeroProps {
  books: UserBook[]
  onUpdate?: () => void
}

export default function ReadingHero({ books, onUpdate }: ReadingHeroProps) {
  const [activeId,     setActiveId]     = useState<number | null>(null)
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [markingDone,  setMarkingDone]  = useState(false)
  const { updateShelf } = useUpdateBookShelf()

  if (!books || books.length === 0) return null

  const activeBook = books.find(b => b.id === activeId) ?? books[0]
  const otherBooks = books.filter(b => b.id !== activeBook.id)

  const { book, completion_percentage = 0, pages_read, total_pages } = activeBook
  if (!book) return null
  const totalPgs = total_pages || book.page_count

  async function handleMarkDone() {
    if (!activeBook.id) return
    setMarkingDone(true)
    try {
      await updateShelf({ userBookId: activeBook.id, status: 'read' })
      setActiveId(null)
      onUpdate?.()
    } finally {
      setMarkingDone(false)
    }
  }

  return (
    <section id="reading" className="mb-10 scroll-mt-40">
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-accent-teal)',
          border: '2px solid var(--color-ink)',
          borderRadius: 18,
          boxShadow: '6px 6px 0px var(--color-accent)',
        }}
      >
        {/* Faded yellow glow — top right */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -100, right: -80,
            width: 340, height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(241,199,91,0.22) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Main content */}
        <div className="relative flex gap-5 lg:gap-8 p-5 lg:p-8">

          {/* Tilted book cover */}
          <div className="flex-shrink-0 w-[80px] lg:w-[110px]" style={{ transform: 'rotate(-4deg)', marginTop: 8 }}>
            <div
              className="w-full overflow-hidden"
              style={{
                aspectRatio: '2 / 3',
                borderRadius: 6,
                boxShadow: '4px 6px 18px rgba(0,0,0,0.55)',
                border: '1px solid rgba(0,0,0,0.25)',
              }}
            >
              <BookCoverImage
                src={book.cover_image_url}
                title={book.title}
                author={book.author_name}
                size="medium"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text + buttons */}
          <div className="flex-1 min-w-0">

            {/* "READING NOW" badge + optional private pill */}
            <div className="flex items-center gap-2 mb-3">
              <span
                style={{
                  display: 'inline-block',
                  border: '2px solid var(--color-accent-yellow)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent-yellow)',
                  textTransform: 'uppercase',
                }}
              >
                Reading Now
              </span>
              {activeBook.visibility === 'private' && (
                <span
                  className="flex items-center gap-1"
                  style={{
                    display: 'inline-flex',
                    border: '2px solid rgba(250,246,235,0.35)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: 'rgba(250,246,235,0.6)',
                    textTransform: 'uppercase',
                  }}
                >
                  <Lock size={9} strokeWidth={2.5} />
                  Private
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              className="font-serif font-bold leading-[1.05] tracking-tight mb-1 text-[1.5rem] lg:text-[2.2rem]"
              style={{ color: '#FAF6EB' }}
            >
              {book.title}
            </h2>

            {/* Author */}
            {book.author_name && (
              <p className="mb-4 text-[13px]" style={{ color: 'rgba(250,246,235,0.55)' }}>
                {book.author_name}
              </p>
            )}

            {/* % + page count */}
            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="font-serif font-bold leading-none text-[2rem] lg:text-[2.8rem]"
                style={{ color: 'var(--color-accent-yellow)' }}
              >
                {completion_percentage}%
              </span>
              <span className="text-[13px]" style={{ color: 'rgba(250,246,235,0.5)' }}>
                page {pages_read || 0} of {totalPgs || '???'}
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="mb-5"
              style={{
                height: 7,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${completion_percentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent-yellow)',
                  borderRadius: 999,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: 'var(--color-accent-yellow)',
                  color: 'var(--color-ink)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '9px 16px',
                }}
              >
                <Plus size={12} strokeWidth={3} />
                Log Progress
              </button>

              <Link
                href={book.id ? `/books/${book.id}` : '#'}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                style={{
                  color: 'rgba(250,246,235,0.85)',
                  border: '2px solid rgba(250,246,235,0.3)',
                  borderRadius: 999,
                  padding: '9px 16px',
                }}
              >
                <PenLine size={12} />
                New Note
              </Link>

              <button
                onClick={handleMarkDone}
                disabled={markingDone}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{
                  color: 'rgba(250,246,235,0.85)',
                  border: '2px solid rgba(250,246,235,0.3)',
                  borderRadius: 999,
                  padding: '9px 16px',
                }}
              >
                <CheckCheck size={12} />
                {markingDone ? 'Saving…' : 'Mark Done'}
              </button>
            </div>
          </div>
        </div>

        {/* Also Reading */}
        {otherBooks.length > 0 && (
          <div
            className="px-5 lg:px-8 pb-5 pt-4"
            style={{ borderTop: '1.5px dashed rgba(255,255,255,0.15)' }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] flex-shrink-0"
                style={{ color: 'rgba(250,246,235,0.4)' }}
              >
                Also Reading
              </span>

              {otherBooks.map(ob => (
                <button
                  key={ob.id}
                  onClick={() => setActiveId(ob.id ?? null)}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    borderRadius: 8,
                    padding: '6px 12px',
                  }}
                >
                  <div
                    className="flex-shrink-0 overflow-hidden"
                    style={{ width: 20, height: 28, borderRadius: 3 }}
                  >
                    <BookCoverImage
                      src={ob.book?.cover_image_url}
                      title={ob.book?.title || ''}
                      author={ob.book?.author_name}
                      size="small"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'rgba(250,246,235,0.85)' }}>
                    {ob.book?.title}
                    {ob.visibility === 'private' && <Lock size={10} strokeWidth={2.5} style={{ color: 'rgba(250,246,235,0.45)', flexShrink: 0 }} />}
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <QuickUpdateModal
        userBook={activeBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </section>
  )
}
