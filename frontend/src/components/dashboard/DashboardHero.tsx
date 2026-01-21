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
}

export default function DashboardHero({ readingBooks, onUpdate, userName }: DashboardHeroProps) {
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
    <section className="relative overflow-hidden rounded-[32px] bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        {!hasReadingBooks ? (
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-bold mb-6 backdrop-blur-md">
              <Sparkles size={16} className="text-brand-indigo" />
              <span>Welcome home, {userName || 'Reader'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              What are you reading <span className="text-brand-indigo">right now?</span>
            </h1>
            
            <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
              Track your progress, share your thoughts, and keep your reading journey organized in one place.
            </p>

            <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <Link href="/search?type=books">
                <div 
                  className="w-full pl-14 pr-6 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/20 rounded-2xl text-slate-300 text-lg transition-all cursor-pointer flex items-center justify-between"
                  onMouseEnter={() => setSearchFocused(true)}
                  onMouseLeave={() => setSearchFocused(false)}
                >
                  <span>Search for a book to add...</span>
                  <ArrowRight size={20} className="text-slate-500" />
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            {/* Book Cover */}
            <motion.div 
              className="w-44 sm:w-52 flex-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link href={`/books/${firstBook?.book?.id}`}>
                <BookCoverImage
                  src={firstBook?.book?.cover_image_url}
                  title={firstBook?.book?.title || ''}
                  author={firstBook?.book?.author_name || ''}
                  size="large"
                  className="w-full aspect-[2/3] object-cover"
                />
              </Link>
            </motion.div>

            {/* Book Info */}
            <div className="flex-1 text-center md:text-left pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-indigo/20 text-brand-indigo text-xs font-black uppercase tracking-wider mb-4 border border-brand-indigo/30">
                <BookOpen size={14} />
                <span>Currently Reading</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
                {firstBook?.book?.title}
              </h2>
              <p className="text-xl text-slate-400 mb-8">by {firstBook?.book?.author_name}</p>

              <div className="max-w-md mx-auto md:mx-0 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-bold text-slate-300">Your Progress</span>
                  <span className="text-lg font-black text-white">{firstBook?.completion_percentage}%</span>
                </div>
                
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    className="h-full bg-brand-indigo rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${firstBook?.completion_percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400 mb-6">
                  <span>Page {firstBook?.pages_read || 0} of {firstBook?.total_pages || firstBook?.book?.page_count || '???'}</span>
                  <span className="font-medium text-brand-indigo">
                    {firstBook?.total_pages || firstBook?.book?.page_count ? 
                      `${(firstBook?.total_pages || firstBook?.book?.page_count || 0) - (firstBook?.pages_read || 0)} pages left` : 
                      'Keep it up!'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="rounded-xl px-8 shadow-lg shadow-brand-indigo/20 font-bold"
                    onClick={() => firstBook && handleOpenModal(firstBook)}
                  >
                    Update Progress
                  </Button>
                  <Link href="/library">
                    <Button variant="outline" size="lg" className="rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10">
                      My Library
                    </Button>
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

