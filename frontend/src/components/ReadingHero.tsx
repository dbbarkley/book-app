'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'
import Button from './Button'

interface ReadingHeroProps {
  books: UserBook[]
}

export default function ReadingHero({ books }: ReadingHeroProps) {
  if (!books || books.length === 0) return null

  // If multiple books are being read, we can show them in a slightly different layout,
  // but let's focus on the first one as the "Hero" and list others if needed.
  const currentBook = books[0]
  const { book, completion_percentage = 0, pages_read, total_pages } = currentBook

  if (!book) return null

  return (
    <section id="reading" className="mb-12 scroll-mt-40">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 px-1">
        <BookOpen className="w-6 h-6 text-primary-600" />
        Currently Reading
      </h2>
      
      <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Book Cover */}
          <div className="w-40 sm:w-48 flex-none shadow-2xl rounded-lg overflow-hidden transition-transform hover:scale-105 duration-300">
            <Link href={`/books/${book.id}`}>
              <BookCoverImage
                src={book.cover_image_url}
                title={book.title}
                author={book.author_name}
                size="large"
                className="w-full aspect-[2/3] object-cover"
              />
            </Link>
          </div>

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
                <div 
                  className="h-full bg-primary-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completion_percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 mb-8">
                <span>Page {pages_read || 0} of {total_pages || '???'}</span>
                <span>{total_pages ? `${total_pages - (pages_read || 0)} pages left` : 'Keep reading!'}</span>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href={`/books/${book.id}`}>
                  <Button variant="primary" size="lg" className="rounded-xl shadow-md hover:shadow-lg transition-all">
                    Update Progress
                  </Button>
                </Link>
                <Link href={`/books/${book.id}`}>
                  <Button variant="outline" size="lg" className="rounded-xl bg-white">
                    Book Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* If there are more books being read */}
        {books.length > 1 && (
          <div className="mt-8 pt-8 border-t border-primary-100">
            <p className="text-sm font-semibold text-slate-500 mb-4 px-1">ALSO READING</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {books.slice(1).map((ub) => ub.book && (
                <Link 
                  key={ub.id} 
                  href={`/books/${ub.book.id}`}
                  className="flex-none w-12 hover:scale-110 transition-transform duration-200"
                >
                  <BookCoverImage
                    src={ub.book.cover_image_url}
                    title={ub.book.title}
                    author={ub.book.author_name}
                    size="small"
                    className="w-full aspect-[2/3] rounded shadow-sm"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

