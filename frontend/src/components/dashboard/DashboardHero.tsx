'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from '../BookCoverImage'
import Button from '../Button'
import QuickUpdateModal from '../QuickUpdateModal'

interface DashboardHeroProps {
  readingBooks: UserBook[]
  onUpdate?: () => void
  userName?: string
  loading?: boolean
}

export default function DashboardHero({ readingBooks, onUpdate, userName, loading }: DashboardHeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const hasReadingBooks = readingBooks && readingBooks.length > 0
  const firstBook = hasReadingBooks ? readingBooks[0] : null

  const handleOpenModal = (ub: UserBook) => {
    setSelectedBook(ub)
    setIsModalOpen(true)
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] text-lit p-8 md:p-12 shadow-2xl" style={{ backgroundColor: 'var(--color-cave)' }}>
      {/* Amber lamp glow — top-right and bottom-left */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)', opacity: 0.12, filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent-hover) 0%, transparent 70%)', opacity: 0.08, filter: 'blur(40px)' }} />

      <div className="relative z-10">
        {loading ? (
          /* Skeleton — matches the approximate shape of the reading card */
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start animate-pulse">
            <div className="w-44 sm:w-52 flex-none rounded-xl" style={{ aspectRatio: '2 / 3', backgroundColor: 'var(--color-grove)' }} />
            <div className="flex-1 w-full space-y-4 pt-2">
              <div className="h-5 w-28 rounded-full" style={{ backgroundColor: 'var(--color-grove)' }} />
              <div className="h-8 w-3/4 rounded-lg" style={{ backgroundColor: 'var(--color-grove)' }} />
              <div className="h-4 w-1/3 rounded-lg" style={{ backgroundColor: 'var(--color-grove)' }} />
              <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: 'var(--color-grove)' }}>
                <div className="h-2 w-full rounded-full mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <div className="flex gap-3 mt-6">
                  <div className="h-11 flex-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-11 flex-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            </div>
          </div>
        ) : !hasReadingBooks ? (
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-lit border border-rim-dark text-sm font-medium mb-6 backdrop-blur-md">
              <Sparkles size={16} className="text-accent" />
              <span>Welcome home, {userName || 'Reader'}</span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">
              What are you reading <span className="text-accent">right now?</span>
            </h1>

            <p className="text-lg text-lit-2 mb-8 max-w-lg leading-relaxed">
              Track your progress, share your thoughts, and keep your reading journey organized in one place.
            </p>

            <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2"
                size={22}
                style={{ color: 'var(--color-lit-3)' }}
              />
              <Link href="/search?type=books">
                <div
                  className="w-full pl-14 pr-6 py-5 rounded-2xl text-lg transition-all cursor-pointer flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit-2)',
                  }}
                  onMouseEnter={(e) => {
                    setSearchFocused(true)
                    e.currentTarget.style.borderColor = 'var(--color-rim-accent)'
                  }}
                  onMouseLeave={(e) => {
                    setSearchFocused(false)
                    e.currentTarget.style.borderColor = 'var(--color-rim)'
                  }}
                >
                  <span>Find a book to start…</span>
                  <ArrowRight size={20} style={{ color: 'var(--color-lit-3)' }} />
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            {/* Book Cover */}
            <motion.div
              className="w-44 sm:w-52 flex-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden"
              style={{ aspectRatio: '2 / 3' }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link href={`/books/${firstBook?.book?.id}`}>
                <BookCoverImage
                  src={firstBook?.book?.cover_image_url}
                  title={firstBook?.book?.title || ''}
                  author={firstBook?.book?.author_name || ''}
                  size="large"
                  className="w-full h-full"
                />
              </Link>
            </motion.div>

            {/* Book Info */}
            <div className="flex-1 text-center md:text-left pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent border border-rim-accent text-xs font-semibold uppercase tracking-widest mb-4">
                <BookOpen size={13} />
                <span>Currently Reading</span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-1 leading-tight text-lit">
                {firstBook?.book?.title}
              </h2>
              <p className="text-base text-lit-3 mb-7 italic">by {firstBook?.book?.author_name}</p>

              <div className="max-w-md mx-auto md:mx-0 rounded-2xl p-6 border border-rim-dark backdrop-blur-sm" style={{ backgroundColor: 'rgba(13,26,15,0.55)' }}>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-medium text-lit-2">Your Progress</span>
                  <span className="text-lg font-bold text-accent">{firstBook?.completion_percentage}%</span>
                </div>

                <div className="w-full h-2 overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-grove)', borderRadius: 999 }}>
                  <motion.div
                    className="h-full"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: 999,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${firstBook?.completion_percentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>

                <div className="flex justify-between text-xs text-lit-3 mb-6">
                  <span>Page {firstBook?.pages_read || 0} of {firstBook?.total_pages || firstBook?.book?.page_count || '???'}</span>
                  <span className="font-medium text-accent/60">
                    {firstBook?.total_pages || firstBook?.book?.page_count ?
                      `${(firstBook?.total_pages || firstBook?.book?.page_count || 0) - (firstBook?.pages_read || 0)} pages left` :
                      'Keep it up!'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button
                    className="inline-flex items-center justify-center px-8 py-3 font-semibold text-base transition-all shadow-lg w-full md:w-auto"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)', borderRadius: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                    onClick={() => firstBook && handleOpenModal(firstBook)}
                  >
                    Update Progress
                  </button>
                  <Link href="/library" className="hidden md:block">
                    <button className="inline-flex items-center justify-center px-8 py-3 font-semibold text-base border border-rim-dark text-lit bg-transparent transition-all"
                      style={{ borderColor: 'var(--color-rim-dark)', color: 'var(--color-lit)', borderRadius: 14 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      My Library
                    </button>
                  </Link>
                </div>
              </div>
            </div>
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

