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
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-lit)' }}>Currently Reading</h2>
        <span className="text-sm font-medium ml-1" style={{ color: 'var(--color-lit-3)' }}>
          {books.length > 1 ? `${books.length} books` : ''}
        </span>
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
              className="rounded-[28px] p-6 md:p-8"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-rim)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Book Cover — portrait 2:3 */}
                <motion.div
                  className="w-36 sm:w-44 flex-none rounded-xl overflow-hidden shadow-2xl"
                  style={{ aspectRatio: '2 / 3' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link href={`/books/${book.id}`}>
                    <BookCoverImage
                      src={book.cover_image_url}
                      title={book.title}
                      author={book.author_name}
                      size="large"
                      className="w-full h-full"
                      layoutId={`book-cover-${book.id}`}
                    />
                  </Link>
                </motion.div>

                {/* Book Info & Progress */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-5">
                    <h3 className="font-serif text-2xl md:text-3xl font-bold mb-1 leading-tight" style={{ color: 'var(--color-lit)' }}>
                      {book.title}
                    </h3>
                    <p className="text-base italic" style={{ color: 'var(--color-lit-3)' }}>
                      by {book.author_name}
                    </p>
                  </div>

                  <div className="max-w-md mx-auto md:mx-0">
                    {/* Progress label row */}
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-lit-2)' }}>
                        Progress
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                        {completion_percentage}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden mb-3"
                      style={{ backgroundColor: 'var(--color-grove)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))',
                          boxShadow: '0 0 10px rgba(201,168,76,0.3)',
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${completion_percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      />
                    </div>

                    {/* Page info */}
                    <div className="flex justify-between text-xs mb-7" style={{ color: 'var(--color-lit-3)' }}>
                      <span>Page {pages_read || 0} of {totalPgs || '???'}</span>
                      <span style={{ color: 'rgba(201,168,76,0.6)' }}>
                        {pagesLeft !== null ? `${pagesLeft} pages left` : 'Keep reading!'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <button
                        className="inline-flex items-center justify-center px-7 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                        onClick={() => handleOpenModal(currentBook)}
                      >
                        Update Progress
                      </button>
                      <Link href={`/books/${book.id}`}>
                        <button
                          className="inline-flex items-center justify-center px-7 py-2.5 rounded-xl font-semibold text-sm transition-all"
                          style={{
                            backgroundColor: 'var(--color-grove)',
                            border: '1px solid var(--color-rim)',
                            color: 'var(--color-lit)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                        >
                          Book Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
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
