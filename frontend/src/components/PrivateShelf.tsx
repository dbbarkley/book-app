'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Lock, Edit2 } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'
import QuickUpdateModal from './QuickUpdateModal'

const ROTATIONS = [-1.5, 1.2, -0.8, 2, -1, 0.8, -1.8, 1.5]

interface PrivateShelfProps {
  books: UserBook[]
  loading?: boolean
  onUpdate?: () => void
}

export default function PrivateShelf({ books, loading, onUpdate }: PrivateShelfProps) {
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)

  if (loading) return null

  return (
    <section id="private" className="mt-10 scroll-mt-40">
      <div
        className="relative overflow-hidden p-6 lg:p-8"
        style={{
          backgroundColor: '#141410',
          border: '2px solid var(--color-ink)',
          borderRadius: 20,
          boxShadow: '6px 6px 0px var(--color-accent-yellow)',
        }}
      >
        {/* Yellow shimmer — top right */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -100, right: -80,
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(241,199,91,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            {/* IV + eyebrow + title + subtitle */}
          <div className="flex items-start gap-3">
            {/* Numeral */}
            <span
              className="font-serif font-bold italic leading-none flex-shrink-0"
              style={{ fontSize: 52, color: 'var(--color-accent-yellow)', lineHeight: 0.9 }}
            >
              IV
            </span>

            {/* Right column: eyebrow → title → subtitle */}
            <div style={{ paddingTop: 14 }}>
              <div className="flex items-center gap-2 mb-1">
                <Lock size={13} style={{ color: 'var(--color-accent-yellow)' }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--color-accent-yellow)' }}
                >
                  Private Shelf
                </span>
              </div>

              <h2
                className="font-serif font-bold leading-[1.05] tracking-tight mb-1.5"
                style={{ color: 'var(--color-lit)', fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}
              >
                Just for{' '}
                <em style={{ color: 'var(--color-accent-yellow)', fontStyle: 'italic' }}>you.</em>
              </h2>

              <p className="text-[13px] leading-snug" style={{ color: 'rgba(250,246,235,0.45)' }}>
                Hidden from your feed, your stats, and your friends. Encrypted at rest.
              </p>
            </div>
          </div>
          </div>

          {/* Count pill */}
          <span
            className="flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{
              backgroundColor: 'var(--color-accent-yellow)',
              color: 'var(--color-ink)',
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              padding: '10px 18px',
            }}
          >
            {books.length} Book{books.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Books carousel */}
        {books.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-serif font-bold mb-1" style={{ fontSize: 18, color: 'var(--color-lit)' }}>
              Nothing here yet.
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(250,246,235,0.4)' }}>
              Add a book privately — it won&apos;t appear anywhere else.
            </p>
          </div>
        ) : (
          <div
            className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {books.map((userBook, i) => {
              if (!userBook.book) return null
              const rotation = ROTATIONS[i % ROTATIONS.length]
              const bookHref = `/books/${userBook.book.google_books_id ?? userBook.book.id}`

              return (
                <div
                  key={userBook.id}
                  className="flex-none w-[185px] sm:w-[210px] snap-start group/item"
                >
                  {/* Cover — rotated */}
                  <div
                    className="relative mb-3"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <Link href={bookHref}>
                      <div
                        className="w-full overflow-hidden"
                        style={{
                          aspectRatio: '2 / 3',
                          borderRadius: 8,
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: '3px 5px 14px rgba(0,0,0,0.5)',
                        }}
                      >
                        <BookCoverImage
                          src={userBook.book.cover_image_url}
                          title={userBook.book.title}
                          author={userBook.book.author_name}
                          size="medium"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* PRIVATE badge */}
                    <span
                      className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1"
                      style={{
                        backgroundColor: 'var(--color-accent-yellow)',
                        color: 'var(--color-ink)',
                        borderRadius: 4,
                        border: '1px solid var(--color-ink)',
                      }}
                    >
                      Private
                    </span>

                    {/* Edit button on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedBook(userBook); setIsModalOpen(true) }}
                        className="flex items-center justify-center"
                        title="Quick edit"
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundColor: 'var(--color-canvas)',
                          border: '2px solid var(--color-ink)',
                          boxShadow: '2px 2px 0 var(--color-ink)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Title + author below */}
                  <Link href={bookHref} className="block hover:opacity-70 transition-opacity">
                    <p
                      className="font-bold leading-snug line-clamp-2 text-[14px]"
                      style={{ color: 'var(--color-lit)' }}
                    >
                      {userBook.book.title}
                    </p>
                    {userBook.book.author_name && (
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: 'rgba(250,246,235,0.45)' }}>
                        {userBook.book.author_name}
                      </p>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <QuickUpdateModal
        userBook={selectedBook || { id: 0, book_id: 0, status: 'to_read' } as any}
        isOpen={isModalOpen && !!selectedBook}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </section>
  )
}
