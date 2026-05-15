'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { apiClient } from '@book-app/shared'
import BookCard from './BookCard'

// Only genres backed by NYT — these return real bestseller data
const TRENDING_GENRES = [
  { id: 'fiction',       label: 'Fiction'     },
  { id: 'non-fiction',   label: 'Non-Fiction' },
  { id: 'mystery',       label: 'Mystery'     },
  { id: 'thriller',      label: 'Thriller'    },
  { id: 'self-help',     label: 'Self-Help'   },
  { id: 'business',      label: 'Business'    },
  { id: 'young-adult',   label: 'Young Adult' },
  { id: 'graphic-novel', label: 'Graphic'     },
]

export default function TrendingNowSection() {
  const [activeGenre, setActiveGenre] = useState(TRENDING_GENRES[0])
  const [books,       setBooks]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(false)

  const fetchGenre = async (genreId: string) => {
    setLoading(true)
    setBooks([])
    try {
      const token = apiClient.getToken()
      const res   = await fetch(`/api/books/genre?id=${genreId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setBooks(data.books ?? [])
    } catch {
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGenre(activeGenre.id) }, [activeGenre.id])

  return (
    <div className="space-y-5">
      {/* Genre filter pills */}
      <div className="flex gap-2 flex-wrap">
        {TRENDING_GENRES.map(g => {
          const active = activeGenre.id === g.id
          return (
            <button
              key={g.id}
              onClick={() => { setActiveGenre(g) }}
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

      {/* Book grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-[28px] overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
              <div className="w-full" style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)' }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-grove)' }} />
                <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-grove)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGenre.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {books.map((book, i) => (
              <BookCard key={book.google_books_id ?? book.isbn ?? i} book={book} showDescription={false} coverSize="medium" />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="py-12 rounded-2xl text-center" style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}>
          <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'var(--color-lit-3)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-lit-2)' }}>No trending books found</p>
        </div>
      )}
    </div>
  )
}
