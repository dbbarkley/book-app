'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'
import Button from './Button'
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
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 px-1">
        <BookOpen className="w-6 h-6 text-primary-600" />
        Currently Reading
      </h2>
      
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {books.map((currentBook) => {
          const { book, completion_percentage = 0, pages_read, total_pages } = currentBook
          if (!book) return null

          return (
            <div 
              key={currentBook.id}
              className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl p-6 md:p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Book Cover */}
                <motion.div 
                  className="w-40 sm:w-48 flex-none shadow-2xl rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={`/books/${book.id}`}>
                    <BookCoverImage
                      src={book.cover_image_url}
                      title={book.title}
                      author={book.author_name}
                      size="large"
                      className="w-full aspect-[2/3] object-cover"
                      layoutId={`book-cover-${book.id}`}
                    />
                  </Link>
                </motion.div>

                {/* Book Info & Progress */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                      {book.title}
                    </h3>
                    <p className="text-lg text-slate-600">by {book.author_name}</p>
                  </div>

                  <div className="max-w-md mx-auto md:mx-0">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-semibold text-primary-700">
                        Progress
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {completion_percentage}%
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        className="h-full bg-primary-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${completion_percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mb-8">
                      <span>Page {pages_read || 0} of {total_pages || book.page_count || '???'}</span>
                      <span>{total_pages || book.page_count ? `${(total_pages || book.page_count || 0) - (pages_read || 0)} pages left` : 'Keep reading!'}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Button 
                        variant="primary" 
                        size="lg" 
                        className="rounded-xl shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleOpenModal(currentBook)}
                      >
                        Update Progress
                      </Button>
                      <Link href={`/books/${book.id}`}>
                        <Button variant="outline" size="lg" className="rounded-xl bg-white">
                          Book Details
                        </Button>
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
