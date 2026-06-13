'use client'

import React, { useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { Edit2, Share2 } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'
import QuickUpdateModal from './QuickUpdateModal'

const ROTATIONS = [-1.5, 1.2, -0.8, 2, -1, 0.8, -1.8, 1.5]

interface ShelfProps {
  title: string
  color?: string
  icon?: React.ReactNode
  subtitle?: string
  books: UserBook[]
  viewAllHref?: string
  shelfId: string
  onUpdate?: () => void
  searchQuery?: string
  onSuggest?: (bookId: number, bookTitle: string) => void
}

export default function Shelf({
  title,
  color,
  subtitle,
  books,
  shelfId,
  onUpdate,
  searchQuery = '',
  onSuggest,
}: ShelfProps) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books
    const q = searchQuery.toLowerCase()
    return books.filter(ub => {
      const t = ub.book?.title?.toLowerCase()       || ''
      const a = ub.book?.author_name?.toLowerCase() || ''
      return t.includes(q) || a.includes(q)
    })
  }, [books, searchQuery])

  if (books.length === 0) return null
  const showEmpty = !!searchQuery.trim() && filteredBooks.length === 0

  return (
    <section id={shelfId} className="mb-14 scroll-mt-40">

      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div className="flex items-start gap-3">
          {/* Numeral */}
          <span
            className="font-serif font-bold italic leading-none flex-shrink-0"
            style={{ fontSize: 52, color: color ?? 'var(--color-accent)', lineHeight: 0.9 }}
          >
            {title === 'To Read' ? 'I' : title === 'Completed' ? 'II' : 'III'}
          </span>

          {/* Eyebrow + title + subtitle stacked under the line */}
          <div style={{ paddingTop: 16 }}>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 20, height: 2, backgroundColor: color ?? 'var(--color-ink-3)' }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: color ?? 'var(--color-ink-3)' }}
              >
                Shelf
              </span>
            </div>

            <h2
              className="font-serif font-bold leading-tight tracking-tight"
              style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
            >
              {title}
            </h2>

            {subtitle && (
              <p className="text-[14px] mt-1" style={{ color: 'var(--color-ink-3)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Count pill — links to full shelf view */}
        <Link
          href={`/library/${shelfId === 'to-read' ? 'to_read' : shelfId}`}
          className="text-[11px] font-bold uppercase tracking-[0.15em] flex-shrink-0 transition-opacity hover:opacity-75"
          style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)',
            borderRadius: 999,
            padding: '10px 18px',
          }}
        >
          {books.length} Book{books.length !== 1 ? 's' : ''} →
        </Link>
      </div>

      {/* Empty search result */}
      {showEmpty && (
        <div
          className="py-8 text-center"
          style={{
            border: '2px dashed var(--color-rim)',
            borderRadius: 14,
          }}
        >
          <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
            No books in this shelf match &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}

      {/* Horizontal scroll carousel */}
      {!showEmpty && (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredBooks.map((userBook, i) => {
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
                        border: '1px solid rgba(0,0,0,0.15)',
                        boxShadow: '3px 5px 14px rgba(0,0,0,0.18)',
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

                  {/* Hover action overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
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
                    {onSuggest && userBook.book?.id != null && (
                      <button
                        onClick={() => onSuggest(userBook.book!.id as number, userBook.book!.title)}
                        className="flex items-center justify-center"
                        title="Suggest to a friend"
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundColor: 'var(--color-canvas)',
                          border: '2px solid var(--color-ink)',
                          boxShadow: '2px 2px 0 var(--color-ink)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <Share2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title + author below cover */}
                <Link href={bookHref} className="block hover:opacity-70 transition-opacity">
                  <p
                    className="font-bold leading-snug line-clamp-2 text-[14px]"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {userBook.book.title}
                  </p>
                  {userBook.book.author_name && (
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--color-ink-3)' }}>
                      {userBook.book.author_name}
                    </p>
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <QuickUpdateModal
        userBook={selectedBook || { id: 0, book_id: 0, status: 'to_read' } as any}
        isOpen={isModalOpen && !!selectedBook}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </section>
  )
}
