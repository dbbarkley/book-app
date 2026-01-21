'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, UserCheck, BookCopy } from 'lucide-react'
import Link from 'next/link'
import type { RecommendedBook, RecommendedAuthor } from '@book-app/shared'
import { useBookShelf } from '@book-app/shared'
import RecommendedBookCard from '../RecommendedBookCard'
import RecommendedAuthorCard from '../RecommendedAuthorCard'

interface DashboardRecommendationsProps {
  books: RecommendedBook[]
  authors: RecommendedAuthor[]
  loading?: boolean
}

export default function DashboardRecommendations({ books, authors, loading }: DashboardRecommendationsProps) {
  const { addToShelf } = useBookShelf()

  const handleAddToShelf = async (bookId: number) => {
    try {
      await addToShelf(bookId, 'to_read')
    } catch (error) {
      console.error('Failed to add book to shelf:', error)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-brand-indigo" size={24} />
            For You
          </h2>
          <p className="text-slate-500 text-sm mt-1">Based on your favorite genres and authors.</p>
        </div>
        <Link href="/recommendations" className="text-brand-indigo font-bold text-sm flex items-center gap-1 hover:underline">
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
        {/* Recommended Books */}
        <div className="space-y-6 min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            <BookCopy size={14} />
            <span>Recommended Books</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />)
            ) : books.length > 0 ? (
              books.slice(0, 4).map((rec, idx) => (
                <motion.div 
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="min-w-0"
                >
                  <RecommendedBookCard 
                    recommendation={rec} 
                    onAddToShelf={() => handleAddToShelf(rec.book.id)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full p-8 bg-slate-50 rounded-2xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">Add more to your library for better recommendations!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Authors */}
        <div className="space-y-6 min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            <UserCheck size={14} />
            <span>Authors You Might Like</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />)
            ) : authors.length > 0 ? (
              authors.slice(0, 4).map((rec, idx) => (
                <motion.div 
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                  className="min-w-0"
                >
                  <RecommendedAuthorCard recommendation={rec} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full p-8 bg-slate-50 rounded-2xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">Follow some authors to see more like them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

