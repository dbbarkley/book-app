'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, Bell, BellRing, ArrowRight } from 'lucide-react'
import { useComingSoon, apiClient } from '@book-app/shared'
import type { UpcomingRelease } from '@book-app/shared'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

const GENRE_FILTERS = [
  { id: null,              label: 'All'       },
  { id: 'fiction',         label: 'Fiction'   },
  { id: 'romance',         label: 'Romance'   },
  { id: 'mystery',         label: 'Mystery'   },
  { id: 'thriller',        label: 'Thriller'  },
  { id: 'fantasy',         label: 'Fantasy'   },
  { id: 'science-fiction', label: 'Sci-Fi'    },
  { id: 'horror',          label: 'Horror'    },
  { id: 'biography',       label: 'Biography' },
  { id: 'self-help',       label: 'Self-Help' },
  { id: 'young-adult',     label: 'YA'        },
] as const

function getDateRange() {
  const today = new Date()
  const in30  = new Date(today); in30.setDate(today.getDate() + 30)
  return {
    dateFrom: today.toISOString().slice(0, 10),
    dateTo:   in30.toISOString().slice(0, 10),
  }
}

function ReleaseRow({ book, index }: { book: UpcomingRelease; index: number }) {
  const [reminderId, setReminderId] = useState<number | null>(book.reminder_id ?? null)
  const [pending, setPending]       = useState(false)
  const days   = book.days_until ?? 0
  const author = book.authors[0] ?? 'Unknown'
  const genre  = book.genres[0] ?? book.subjects[0] ?? null

  const handleBell = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pending) return
    if (reminderId !== null) {
      const prev = reminderId
      setReminderId(null); setPending(true)
      try { await apiClient.deleteReleaseReminder(prev) }
      catch { setReminderId(prev) }
      finally { setPending(false) }
    } else {
      setReminderId(-1); setPending(true)
      try { const { id } = await apiClient.createReleaseReminder(book.id); setReminderId(id) }
      catch { setReminderId(null) }
      finally { setPending(false) }
    }
  }

  const releaseLabel = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`
  const isUrgent     = days <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_STRONG, delay: Math.min(index * 0.03, 0.3) }}
      style={{ borderBottom: '1.5px dashed var(--color-rim)' }}
    >
      <div className="flex items-center gap-5" style={{ padding: '18px 0' }}>

        {/* Countdown */}
        <div style={{ width: 56, flexShrink: 0, textAlign: 'center' }}>
          <span
            className="font-black tabular-nums"
            style={{ fontSize: '1.5rem', lineHeight: 1, display: 'block', color: isUrgent ? 'var(--color-accent)' : 'var(--color-ink)' }}
          >
            {releaseLabel}
          </span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--color-ink-3)', textTransform: 'uppercase' }}>
            {new Date(book.date_published + 'T00:00:00')
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              .toUpperCase()}
          </span>
        </div>

        {/* Cover */}
        <Link href={`/books/${book.isbn13}`} style={{ flexShrink: 0, display: 'block' }}>
          <div style={{
            width: 44, height: 66, borderRadius: 4,
            overflow: 'hidden', backgroundColor: 'var(--color-cave)',
            border: '1.5px solid var(--color-ink)',
            boxShadow: '2px 2px 0px var(--color-ink)',
          }}>
            {book.cover_image_url && (
              <img src={book.cover_image_url} alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>
        </Link>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/books/${book.isbn13}`} style={{ textDecoration: 'none' }}>
            <p className="font-serif font-bold leading-snug" style={{ fontSize: 15, color: 'var(--color-ink)', marginBottom: 2 }}>
              {book.title}
            </p>
          </Link>
          <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: genre ? 6 : 0 }}>
            {author}{book.publisher ? ` · ${book.publisher}` : ''}
          </p>
          {genre && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              borderRadius: 999, padding: '2px 8px', display: 'inline-block',
            }}>
              {genre}
            </span>
          )}
        </div>

        {/* Binding */}
        {book.binding && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {book.binding}
          </span>
        )}

        {/* Bell */}
        <button
          onClick={handleBell}
          disabled={pending}
          aria-label={reminderId !== null ? 'Remove reminder' : 'Set reminder'}
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            backgroundColor: reminderId !== null ? 'var(--color-ink)' : 'var(--color-accent-yellow)',
            border: '2px solid var(--color-ink)',
            boxShadow: '2px 2px 0px var(--color-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background-color 0.15s',
          }}
        >
          {reminderId !== null
            ? <BellRing size={15} style={{ color: '#FAF6EB' }} />
            : <Bell     size={15} style={{ color: 'var(--color-ink)' }} />
          }
        </button>
      </div>
    </motion.div>
  )
}

export default function UpcomingReleasesPage() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [page, setPage]               = useState(1)
  const { dateFrom, dateTo }          = getDateRange()

  const { books, meta, loading } = useComingSoon({
    genre:     activeGenre,
    date_from: dateFrom,
    date_to:   dateTo,
    page,
    per:       40,
  })

  function handleGenre(id: string | null) {
    setActiveGenre(id)
    setPage(1)
  }

  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-16 sm:py-20">

          {/* Breadcrumb */}
          <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
            <Link
              href="/discover"
              className="flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--color-ink)', flexShrink: 0 }}
            >
              <ChevronLeft size={16} style={{ color: 'var(--color-ink)' }} />
            </Link>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--color-ink-3)', textTransform: 'uppercase' }}>
              <Link href="/discover" style={{ color: 'var(--color-ink-3)', textDecoration: 'none' }} className="transition-opacity hover:opacity-70">
                Discover
              </Link>
              {' / '}
              <span style={{ color: 'var(--color-ink)' }}>Upcoming</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
          >
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                Next 30 days
              </span>
            </div>

            <div className="flex items-end justify-between gap-6 flex-wrap">
              <h1
                className="font-serif font-black tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', lineHeight: 1.0, color: 'var(--color-ink)' }}
              >
                Coming{' '}
                <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>soon.</em>
              </h1>
              {!loading && meta && (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-3)', paddingBottom: 8 }}>
                  {meta.total} titles
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Genre filters ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '1.5px solid var(--color-rim)', backgroundColor: 'var(--color-canvas)', position: 'sticky', top: 82, zIndex: 10 }}>
        <div className="container-mobile" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="flex items-center gap-2 flex-wrap">
            {GENRE_FILTERS.map(g => {
              const active = activeGenre === g.id
              return (
                <button
                  key={g.label}
                  onClick={() => handleGenre(g.id)}
                  className="font-bold transition-all"
                  style={{
                    fontSize: 12, letterSpacing: '0.04em',
                    padding: '7px 16px', borderRadius: 999,
                    border: '2px solid var(--color-ink)',
                    cursor: 'pointer',
                    backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                    color: active ? '#FAF6EB' : 'var(--color-ink)',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Book list ─────────────────────────────────────────────── */}
      <div className="container-mobile" style={{ paddingTop: 8, paddingBottom: 80 }}>
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-5" style={{ padding: '18px 0', borderBottom: '1.5px dashed var(--color-rim)' }}>
                <div style={{ width: 56, height: 40, borderRadius: 6, backgroundColor: 'var(--color-surface)', flexShrink: 0 }} />
                <div style={{ width: 44, height: 66, borderRadius: 4, backgroundColor: 'var(--color-surface)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '60%', borderRadius: 4, backgroundColor: 'var(--color-surface)', marginBottom: 8 }} />
                  <div style={{ height: 11, width: '40%', borderRadius: 4, backgroundColor: 'var(--color-surface)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center', border: '1.5px dashed var(--color-rim)', borderRadius: 16, marginTop: 32 }}>
            <p className="font-serif font-bold" style={{ fontSize: 18, color: 'var(--color-ink)', marginBottom: 8 }}>
              Nothing in the next 30 days
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.6 }}>
              {activeGenre ? `No ${activeGenre} releases scheduled right now.` : 'Our catalogue refreshes daily — check back soon.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div key={activeGenre ?? 'all'}>
              {books.map((book, i) => (
                <ReleaseRow key={book.isbn13} book={book} index={i} />
              ))}

              {meta && page < meta.total_pages && (
                <div style={{ paddingTop: 32, textAlign: 'center' }}>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="font-bold uppercase transition-all"
                    style={{
                      fontSize: 11, letterSpacing: '0.14em',
                      padding: '12px 32px', borderRadius: 999,
                      border: '2px solid var(--color-ink)',
                      boxShadow: '3px 3px 0px var(--color-ink)',
                      backgroundColor: 'transparent', color: 'var(--color-ink)', cursor: 'pointer',
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0px var(--color-ink)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
                  >
                    Load more <ArrowRight size={13} style={{ display: 'inline', marginLeft: 6 }} />
                  </button>
                </div>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>

    </div>
  )
}
