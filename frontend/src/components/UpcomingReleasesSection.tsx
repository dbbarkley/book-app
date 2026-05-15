'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, BookOpen, ChevronDown } from 'lucide-react'
import { useComingSoon } from '@book-app/shared'
import UpcomingReleaseCard from './UpcomingReleaseCard'

// Genre filter options — slugs must match IsbndbService::GENRES
const GENRE_FILTERS = [
  { id: null,                 label: 'All'       },
  { id: 'fiction',            label: 'Fiction'   },
  { id: 'romance',            label: 'Romance'   },
  { id: 'mystery',            label: 'Mystery'   },
  { id: 'thriller',           label: 'Thriller'  },
  { id: 'fantasy',            label: 'Fantasy'   },
  { id: 'science-fiction',    label: 'Sci-Fi'    },
  { id: 'horror',             label: 'Horror'    },
  { id: 'biography',          label: 'Biography' },
  { id: 'self-help',          label: 'Self-Help' },
  { id: 'history',            label: 'History'   },
  { id: 'young-adult',        label: 'YA'        },
] as const

const INITIAL_VISIBLE = 8

interface UpcomingReleasesSectionProps {
  showHeader?: boolean
}

export default function UpcomingReleasesSection({ showHeader = false }: UpcomingReleasesSectionProps) {
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [page, setPage]               = useState(1)
  const [showAll, setShowAll]         = useState(false)

  const { books, meta, loading, error } = useComingSoon({
    genre: activeGenre,
    page,
    per: 20,
  })

  const handleGenreChange = (genreId: string | null) => {
    setActiveGenre(genreId)
    setPage(1)
    setShowAll(false)
  }

  const visibleBooks = showAll ? books : books.slice(0, INITIAL_VISIBLE)
  const hasMore      = !showAll && books.length > INITIAL_VISIBLE

  return (
    <section className="space-y-5">

      {/* Optional header — hidden when used inside feature card flow */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
            <CalendarDays size={20} style={{ color: 'var(--color-accent)' }} />
            Upcoming Releases
          </h2>
          {meta && !loading && (
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
              {meta.total} titles
            </span>
          )}
        </div>
      )}

      {/* ── Genre filter pills ─────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {GENRE_FILTERS.map(g => {
          const active = activeGenre === g.id
          return (
            <button
              key={g.label}
              onClick={() => handleGenreChange(g.id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={active
                ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
                : { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }
              }
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        // Skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-[104px] rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="py-12 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-lit-2)' }}>
            Couldn't load upcoming releases
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-lit-3)' }}>
            Check back soon — our catalogue refreshes daily.
          </p>
        </div>
      ) : books.length === 0 ? (
        <div
          className="py-16 rounded-2xl text-center"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
        >
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
          <p className="font-semibold" style={{ color: 'var(--color-lit-2)' }}>
            {activeGenre ? `No upcoming ${activeGenre} releases found` : 'No upcoming releases yet'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>
            Our catalogue refreshes daily — check back soon.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {visibleBooks.map((book, idx) => (
                <motion.div
                  key={book.isbn13}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <UpcomingReleaseCard book={book} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show more / Load next page */}
          {(hasMore || (meta && meta.page < meta.total_pages)) && (
            <div className="mt-5 flex justify-center gap-3">
              {hasMore && (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border:          '1px solid var(--color-rim)',
                    color:           'var(--color-lit-2)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                >
                  <ChevronDown size={16} />
                  Show more
                </button>
              )}
              {showAll && meta && page < meta.total_pages && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border:          '1px solid var(--color-rim)',
                    color:           'var(--color-lit-2)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
