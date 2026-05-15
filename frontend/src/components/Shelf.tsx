'use client'

import React, { useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Edit2, ArrowUpDown, Share2 } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import BookCard from './BookCard'
import QuickUpdateModal from './QuickUpdateModal'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

type SortKey = 'default' | 'title' | 'author' | 'date_added'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Date Added' },
  { key: 'title',      label: 'Title A–Z'  },
  { key: 'author',     label: 'Author A–Z' },
]

interface ShelfProps {
  title: string
  icon: React.ReactNode
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
  icon,
  subtitle,
  books,
  viewAllHref,
  shelfId,
  onUpdate,
  searchQuery = '',
  onSuggest,
}: ShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortOpen, setSortOpen] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -420 : 420,
        behavior: 'smooth',
      })
    }
  }

  const handleOpenModal = (ub: UserBook) => {
    setSelectedBook(ub)
    setIsModalOpen(true)
  }

  // Filter by search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books
    const q = searchQuery.toLowerCase()
    return books.filter(ub => {
      const title = ub.book?.title?.toLowerCase() || ''
      const author = ub.book?.author_name?.toLowerCase() || ''
      return title.includes(q) || author.includes(q)
    })
  }, [books, searchQuery])

  // Sort
  const sortedBooks = useMemo(() => {
    const arr = [...filteredBooks]
    if (sortKey === 'title') {
      arr.sort((a, b) => (a.book?.title || '').localeCompare(b.book?.title || ''))
    } else if (sortKey === 'author') {
      arr.sort((a, b) => (a.book?.author_name || '').localeCompare(b.book?.author_name || ''))
    }
    // 'default' = server order (date added)
    return arr
  }, [filteredBooks, sortKey])

  if (books.length === 0) return null
  // If searching and nothing matches, still show header so user knows this shelf exists
  const showEmpty = searchQuery.trim() && filteredBooks.length === 0

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Sort'

  return (
    <section id={shelfId} className="mb-12 relative group scroll-mt-40">
      {/* Shelf Header */}
      <div className="flex items-end justify-between mb-6 px-1">
        <div>
          <h2
            className="font-sans flex items-center gap-2"
            style={{ color: 'var(--color-lit)', fontSize: 18, fontWeight: 700 }}
          >
            <span className="flex items-center justify-center">{icon}</span>
            {title}
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
          </h2>
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.2em] mt-1 font-medium" style={{ color: 'var(--color-lit-3)' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-grove)',
                border: '1px solid var(--color-rim)',
                color: 'var(--color-lit-2)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
            >
              <ArrowUpDown size={12} />
              {currentSortLabel}
            </button>

            {sortOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1 min-w-[130px]"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-rim)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false) }}
                    className="w-full text-left px-4 py-2 text-xs font-medium transition-colors"
                    style={{
                      color: sortKey === opt.key ? 'var(--color-accent)' : 'var(--color-lit-2)',
                      backgroundColor: sortKey === opt.key ? 'var(--color-grove)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (sortKey !== opt.key) e.currentTarget.style.backgroundColor = 'var(--color-grove)' }}
                    onMouseLeave={e => { if (sortKey !== opt.key) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-0.5 transition-colors"
              style={{ color: 'var(--color-lit-2)', fontSize: 13 }}
            >
              See all
              <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Empty search state */}
      {showEmpty && (
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>
            No books in this shelf match "{searchQuery}"
          </p>
        </div>
      )}

      {/* Carousel */}
      {!showEmpty && (
        <div className="relative">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-[-18px] top-[40%] -translate-y-1/2 z-10 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              color: 'var(--color-lit)',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-[-18px] top-[40%] -translate-y-1/2 z-10 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              color: 'var(--color-lit)',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Subtle shelf ledge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px -mb-2 rounded-full"
            style={{ backgroundColor: 'var(--color-rim)' }}
          />

          <motion.div
            ref={scrollContainerRef}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sortedBooks.map((userBook) => (
              <motion.div
                key={userBook.id}
                variants={itemVariants}
                className="flex-none w-[160px] sm:w-[190px] snap-start relative group/item"
              >
                {userBook.book && (
                  <>
                    <BookCard
                      book={userBook.book}
                      showDescription={false}
                      userBook={userBook}
                      coverSize="medium"
                    />
                    {/* Quick Edit overlay */}
                    <button
                      onClick={() => handleOpenModal(userBook)}
                      className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all scale-75 hover:scale-100 shadow-md"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-rim)',
                        color: 'var(--color-lit)',
                      }}
                      title="Quick Update"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Suggest overlay */}
                    {onSuggest && userBook.book?.id != null && (
                      <button
                        onClick={() => onSuggest(userBook.book!.id as number, userBook.book!.title)}
                        className="absolute top-2 left-2 p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all scale-75 hover:scale-100 shadow-md"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-rim)',
                          color: 'var(--color-lit)',
                        }}
                        title="Suggest to a Friend"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
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
