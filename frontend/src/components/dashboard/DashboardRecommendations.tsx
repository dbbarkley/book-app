'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, ShieldCheck } from 'lucide-react'
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
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
            For You
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            Based on your ratings, genres, and the people you follow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Recommended Books ── */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-2" style={{ color: 'var(--color-lit-3)' }}>
            <BookOpen size={13} />
            <span className="text-xs font-semibold uppercase tracking-widest">Recommended Books</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="h-[120px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ border: '1px dashed var(--color-rim)', backgroundColor: 'var(--color-surface)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                Rate a few books or follow some authors to unlock recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {books.slice(0, 5).map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="min-w-0"
                >
                  <RecommendedBookCard
                    recommendation={rec}
                    onAddToShelf={() => handleAddToShelf(rec.book.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recommended Authors ── */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-2" style={{ color: 'var(--color-lit-3)' }}>
            <Users size={13} />
            <span className="text-xs font-semibold uppercase tracking-widest">Authors to Explore</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
              ))}
            </div>
          ) : authors.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ border: '1px dashed var(--color-rim)', backgroundColor: 'var(--color-surface)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                Follow more authors or import reading history for better matches.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {authors.slice(0, 4).map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 + 0.15 }}
                  className="min-w-0"
                >
                  <RecommendedAuthorCard recommendation={rec} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
