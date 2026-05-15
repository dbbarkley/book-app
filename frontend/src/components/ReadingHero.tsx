'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'
import QuickUpdateModal from './QuickUpdateModal'

interface ReadingHeroProps {
  books: UserBook[]
  onUpdate?: () => void
}

export default function ReadingHero({ books, onUpdate }: ReadingHeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)

  if (!books || books.length === 0) return null

  const handleOpenModal = (ub: UserBook) => {
    setSelectedBook(ub)
    setIsModalOpen(true)
  }

  return (
    <section id="reading" className="mb-12 scroll-mt-40">
      {/* Section heading */}
      <div className="flex items-center gap-2 px-1 mb-6">
        <BookOpen className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-sans" style={{ color: 'var(--color-lit)', fontSize: 18, fontWeight: 700 }}>
          Currently Reading
        </h2>
        {books.length > 0 && (
          <span
            className="ml-1"
            style={{
              backgroundColor: 'var(--color-grove)',
              border: '1px solid var(--color-rim)',
              borderRadius: 10,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-lit-2)',
            }}
          >
            {books.length}
          </span>
        )}
      </div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {books.map((currentBook) => {
          const { book, completion_percentage = 0, pages_read, total_pages } = currentBook
          if (!book) return null
          const totalPgs = total_pages || book.page_count
          const pagesLeft = totalPgs ? totalPgs - (pages_read || 0) : null

          return (
            <div
              key={currentBook.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-rim)',
                borderRadius: 16,
                padding: 14,
                display: 'flex',
                gap: 14,
              }}
            >
              {/* Book Cover — 72px wide, 2:3 */}
              <Link href={`/books/${book.id}`} className="flex-none">
                <div
                  className="overflow-hidden shadow-lg"
                  style={{ width: 72, aspectRatio: '2 / 3', borderRadius: 10 }}
                >
                  <BookCoverImage
                    src={book.cover_image_url}
                    title={book.title}
                    author={book.author_name}
                    size="medium"
                    className="w-full h-full"
                  />
                </div>
              </Link>

              {/* Info column */}
              <div className="flex-1 min-w-0 flex flex-col">
                <h3
                  className="line-clamp-2"
                  style={{ color: 'var(--color-lit)', fontSize: 15, fontWeight: 700, lineHeight: '20px' }}
                >
                  {book.title}
                </h3>
                {book.author_name && (
                  <p className="truncate mt-0.5" style={{ color: 'var(--color-lit-2)', fontSize: 12 }}>
                    {book.author_name}
                  </p>
                )}

                {/* Progress bar */}
                <div
                  className="w-full overflow-hidden mt-3 mb-1.5"
                  style={{ height: 8, borderRadius: 999, backgroundColor: 'var(--color-grove)' }}
                >
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: 'var(--color-accent)', borderRadius: 999 }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${completion_percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>

                {/* Page count text */}
                <div className="flex justify-between mb-3" style={{ fontSize: 11, color: 'var(--color-lit-3)' }}>
                  <span>Page {pages_read || 0} of {totalPgs || '???'}</span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                    {completion_percentage}%
                    {pagesLeft !== null ? ` · ${pagesLeft} left` : ''}
                  </span>
                </div>

                {/* Update Progress button */}
                <button
                  className="w-full inline-flex items-center justify-center font-semibold text-sm transition-all mt-auto"
                  style={{ height: 44, borderRadius: 10, backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                  onClick={() => handleOpenModal(currentBook)}
                >
                  Update Progress
                </button>
              </div>
            </div>
          )
        })}
      </motion.div>

      <QuickUpdateModal
        userBook={selectedBook || { id: 0, book_id: 0, status: 'to_read' } as any}
        isOpen={isModalOpen && !!selectedBook}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </section>
  )
}
