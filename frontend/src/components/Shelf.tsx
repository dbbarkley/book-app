'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import BookCard from './BookCard'
import Button from './Button'
import QuickUpdateModal from './QuickUpdateModal'

interface ShelfProps {
  title: string
  icon: React.ReactNode
  subtitle?: string
  books: UserBook[]
  viewAllHref?: string
  shelfId: string
  onUpdate?: () => void
}

export default function Shelf({
  title,
  icon,
  subtitle,
  books,
  viewAllHref,
  shelfId,
  onUpdate,
}: ShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleOpenModal = (ub: UserBook) => {
    setSelectedBook(ub)
    setIsModalOpen(true)
  }

  if (books.length === 0) return null

  return (
    <section id={shelfId} className="mb-12 relative group scroll-mt-40">
      {/* Shelf Header ... */}
      <div className="flex items-end justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center">
              {icon}
            </span>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View All ({books.length})
          </Link>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll Buttons - Desktop Only */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-20px] top-[40%] -translate-y-1/2 z-10 bg-white/90 shadow-lg rounded-full p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-white"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-20px] top-[40%] -translate-y-1/2 z-10 bg-white/90 shadow-lg rounded-full p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-white"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* The "Shelf" visual effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 rounded-full -mb-2" />

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((userBook) => (
            <div
              key={userBook.id}
              className="flex-none w-[160px] sm:w-[200px] snap-start relative group/item"
            >
              {userBook.book && (
                <>
                  <BookCard
                    book={userBook.book}
                    showDescription={false}
                    userBook={userBook}
                    coverSize="medium"
                  />
                  {/* Quick Edit Overlay */}
                  <button
                    onClick={() => handleOpenModal(userBook)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white shadow-md rounded-full text-slate-700 opacity-0 group-hover/item:opacity-100 transition-all scale-75 hover:scale-100"
                    title="Quick Update"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedBook && (
        <QuickUpdateModal
          userBook={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={onUpdate}
        />
      )}
    </section>
  )
}

