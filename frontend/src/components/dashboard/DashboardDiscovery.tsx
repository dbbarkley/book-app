'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Users } from 'lucide-react'
import type { RecommendedBook, RecommendedAuthor } from '@book-app/shared'
import { useBookShelf } from '@book-app/shared'
import RecommendedBookCard from '@/components/RecommendedBookCard'
import RecommendedAuthorCard from '@/components/RecommendedAuthorCard'

interface DashboardDiscoveryProps {
  books:   RecommendedBook[]
  authors: RecommendedAuthor[]
  loading?: boolean
}

const subLabelStyle: React.CSSProperties = {
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         'var(--color-lit-3)',
}

export default function DashboardDiscovery({ books, authors, loading }: DashboardDiscoveryProps) {
  const { addToShelf } = useBookShelf()

  const handleAddToShelf = async (bookId: number) => {
    try {
      await addToShelf(bookId, 'to_read')
    } catch (error) {
      console.error('Failed to add book to shelf:', error)
    }
  }

  return (
    <aside className="space-y-8">

      {/* ── Section title ───────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-lg font-bold leading-none mb-1" style={{ color: 'var(--color-lit)' }}>
          Discover
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-lit-2)' }}>
          Based on your tastes &amp; follows
        </p>
      </div>

      {/* ── Recommended Books ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5" style={subLabelStyle}>
          <BookOpen size={11} />
          <span>Books for You</span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--color-grove)' }}
              />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              border:           '1px dashed var(--color-rim)',
              backgroundColor:  'var(--color-surface)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
              Rate a few books to unlock recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {books.slice(0, 4).map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
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

      {/* ── Authors to Follow ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5" style={subLabelStyle}>
          <Users size={11} />
          <span>Authors to Follow</span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--color-grove)' }}
              />
            ))}
          </div>
        ) : authors.length === 0 ? (
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              border:           '1px dashed var(--color-rim)',
              backgroundColor:  'var(--color-surface)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
              Follow more authors for better suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {authors.slice(0, 3).map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 + 0.1 }}
              >
                <RecommendedAuthorCard recommendation={rec} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </aside>
  )
}
