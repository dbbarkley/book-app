'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Plus, Users, BookOpen, Bell, BellRing, ArrowRight, X, ChevronRight, ScanLine } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { apiClient, useAuth, useBookSearch, useUserSearch, useBooksStore, useComingSoon } from '@book-app/shared'
import type { UserList, User, CircleTrendingBook, UpcomingRelease } from '@book-app/shared'
import Avatar from '@/components/Avatar'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import { GENRES as GENRE_CONFIG } from './genreConfig'
// import { PeerRecommendationsSection } from '../../components/discover/PeerRecommendationsSection'

// ── Newspaper date / issue helpers ────────────────────────────────────────────

const EPOCH = new Date('2025-06-23') // launch Monday → issue 1

function getIssueNumber(): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.max(1, Math.floor((Date.now() - EPOCH.getTime()) / msPerWeek) + 1)
}

function getWeekMonday(): Date {
  const d   = new Date()
  const day = d.getDay() // 0=Sun, 1=Mon…
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatNewsDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
}

// ── Featured book (hardcoded — updated manually each week) ───────────────────

const FEATURED_BOOK = {
  title:       'Tomorrow, and Tomorrow, and Tomorrow',
  author:      'Gabrielle Zevin',
  coverUrl:    'https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg',
  quote:       'Two college friends design videogames together for thirty years. It\'s about videogames the way a knife is about an apple.',
  googleBooksId: 'tBvEDwAAQBAJ',
  friendCount: 3,
  reviews: [
    { initial: 'A', name: 'Alex',  color: 'var(--color-accent)',        text: 'Best book I\'ve read this year. The cabin chapter alone.' },
    { initial: 'P', name: 'Priya', color: 'var(--color-accent-teal)',   text: 'It\'s about how friendship is the only love story that matters.' },
    { initial: 'J', name: 'James', color: 'var(--color-accent-yellow)', textColor: 'var(--color-ink)', text: 'Cried, laughed, then cried again. 5 stars.' },
  ],
}

function FeaturedBook() {
  const book = FEATURED_BOOK

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      <div style={{
        border: '2px solid var(--color-ink)',
        borderRadius: 20,
        boxShadow: '6px 6px 0px var(--color-accent)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-canvas)',
      }}>

        {/* ── Top strip ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '3px double var(--color-ink)',
        }}>
          {/* Badge */}
          <div style={{
            border: '2px solid var(--color-accent)',
            borderRadius: 6, padding: '5px 14px',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
              color: 'var(--color-accent)', textTransform: 'uppercase',
            }}>
              This week, your circle
            </span>
          </div>

          {/* Meta — hidden on small screens to prevent overflow */}
          <span className="hidden sm:inline" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            color: 'var(--color-ink-3)', textTransform: 'uppercase',
          }}>
            Picked by {book.friendCount} friends · No algorithm involved
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col sm:flex-row items-stretch gap-0">

          {/* Book cover */}
          <div style={{
            flexShrink: 0,
            padding: '24px 24px 0 24px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          }} className="sm:py-8 sm:pl-8 sm:pr-0 sm:justify-start">
            <div style={{
              width: 140,
              aspectRatio: '2/3',
              borderRadius: '4px 2px 2px 4px',
              overflow: 'hidden',
              boxShadow: '6px 8px 24px rgba(0,0,0,0.35), inset -3px 0 6px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }} className="sm:w-[180px]">
              <img
                src={book.coverUrl}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }} className="p-6 sm:p-8 sm:pl-9">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
                color: 'var(--color-accent)', textTransform: 'uppercase',
              }}>
                Featured
              </span>
            </div>

            {/* Title */}
            <h2
              className="font-serif font-black leading-tight"
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                color: 'var(--color-ink)',
                marginBottom: 10,
              }}
            >
              {book.title}
            </h2>

            {/* Author */}
            <p style={{ fontSize: 15, color: 'var(--color-ink-2)', marginBottom: 18 }}>
              by {book.author}
            </p>

            {/* Quote */}
            <p
              className="font-serif"
              style={{
                fontSize: 15, fontStyle: 'italic', lineHeight: 1.65,
                color: 'var(--color-ink-2)', marginBottom: 22,
                maxWidth: '55ch',
              }}
            >
              &ldquo;{book.quote}&rdquo;
            </p>

            {/* Friend reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {book.reviews.map(r => (
                <div
                  key={r.name}
                  className="flex items-center gap-3"
                  style={{
                    border: '1.5px solid var(--color-rim)',
                    borderRadius: 10,
                    padding: '10px 16px',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: r.color,
                    border: '2px solid var(--color-ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: (r as any).textColor ?? '#FAF6EB',
                    }}>
                      {r.initial}
                    </span>
                  </div>
                  {/* Text */}
                  <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                    <span className="font-bold">{r.name}</span>
                    {' '}
                    <em className="font-serif" style={{ color: 'var(--color-ink-2)' }}>
                      &ldquo;{r.text}&rdquo;
                    </em>
                  </p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Primary */}
              <button
                className="flex items-center gap-2 font-bold uppercase transition-all"
                style={{
                  fontSize: 11, letterSpacing: '0.13em',
                  padding: '12px 22px', borderRadius: 999,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-accent)',
                  backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
                  cursor: 'pointer',
                }}
                onMouseDown={e => { const el = e.currentTarget; el.style.transform = 'translate(2px,2px)'; el.style.boxShadow = '1px 1px 0px var(--color-accent)' }}
                onMouseUp={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '3px 3px 0px var(--color-accent)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '3px 3px 0px var(--color-accent)' }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                Add to To-Read
              </button>

              {/* Find a buddy */}
              <Link
                href="/reading-buddy"
                className="flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-75"
                style={{
                  fontSize: 11, letterSpacing: '0.13em',
                  padding: '12px 22px', borderRadius: 999,
                  border: '2px solid var(--color-ink)',
                  backgroundColor: 'transparent', color: 'var(--color-ink)',
                  cursor: 'pointer',
                }}
              >
                <Users style={{ width: 13, height: 13 }} />
                Find a Buddy
              </Link>

              {/* Read sample */}
              {book.googleBooksId && (
                <a
                  href={`https://books.google.com/books?id=${book.googleBooksId}&printsec=frontcover`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-75"
                  style={{
                    fontSize: 11, letterSpacing: '0.13em',
                    padding: '12px 22px', borderRadius: 999,
                    border: '2px solid var(--color-ink)',
                    backgroundColor: 'transparent', color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen style={{ width: 13, height: 13 }} />
                  Read Sample
                </a>
              )}
            </div>

          </div>
        </div>
      </div>
    </motion.section>
  )
}

// ── Coming Up section ────────────────────────────────────────────────────────

const CARD_ACCENTS = [
  { shadow: 'var(--color-accent)', daysColor: 'var(--color-accent)' },
  { shadow: '#2D5BA5',             daysColor: '#2D5BA5'             },
  { shadow: '#6B3A7D',             daysColor: '#6B3A7D'             },
  { shadow: '#B8970A',             daysColor: '#927800'             },
]

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()
}

function UpcomingCard({ book, accent, index }: {
  book:   UpcomingRelease
  accent: typeof CARD_ACCENTS[0]
  index:  number
}) {
  const [reminded, setReminded] = useState(false)
  const days   = book.days_until ?? 0
  const author = book.authors[0] ?? ''
  const genre  = book.genres[0] ?? book.subjects[0] ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        border: '2px solid var(--color-ink)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: `4px 4px 0px ${accent.shadow}`,
        backgroundColor: 'var(--color-canvas)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {/* Cover */}
        <Link href={`/books/${book.isbn13}`} style={{ display: 'block', flexShrink: 0 }}>
          <div style={{ width: '100%', aspectRatio: '2/3', overflow: 'hidden' }}>
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-cave)', display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                <p className="font-serif font-black" style={{ fontSize: 18, color: '#FAF6EB', lineHeight: 1.2 }}>{book.title}</p>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {genre && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              borderRadius: 999, padding: '3px 9px',
              display: 'inline-block', alignSelf: 'flex-start', marginBottom: 8,
            }}>
              {genre}
            </span>
          )}
          <Link href={`/books/${book.isbn13}`} style={{ textDecoration: 'none' }}>
            <p className="font-bold leading-snug" style={{ fontSize: 14, color: 'var(--color-ink)', marginBottom: 2 }}>
              {book.title}
            </p>
          </Link>
          {author && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 12 }}>
              {author}
            </p>
          )}

          <div style={{ borderBottom: '1.5px dashed var(--color-rim)', marginBottom: 12 }} />

          <div className="flex items-center justify-between" style={{ marginTop: 'auto' }}>
            <div>
              <span className="font-black tabular-nums" style={{ fontSize: '1.75rem', color: accent.daysColor, lineHeight: 1, display: 'block' }}>
                {days === 0 ? 'Today' : `${days}d`}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-ink-3)' }}>
                {shortDate(book.date_published)}
              </span>
            </div>
            <button
              onClick={() => setReminded(r => !r)}
              aria-label={reminded ? 'Remove reminder' : 'Set reminder'}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                backgroundColor: reminded ? 'var(--color-ink)' : 'var(--color-accent-yellow)',
                border: '2px solid var(--color-ink)',
                boxShadow: '2px 2px 0px var(--color-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background-color 0.15s',
              }}
            >
              {reminded
                ? <BellRing style={{ width: 15, height: 15, color: '#FAF6EB' }} />
                : <Bell    style={{ width: 15, height: 15, color: 'var(--color-ink)' }} />
              }
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ComingUpSection() {
  const today    = new Date()
  const in30     = new Date(today); in30.setDate(today.getDate() + 30)
  const dateFrom = today.toISOString().slice(0, 10)
  const dateTo   = in30.toISOString().slice(0, 10)

  const { books, loading } = useComingSoon({ date_from: dateFrom, date_to: dateTo, per: 4 })

  return (
    <section style={{ marginBottom: 60 }}>
      <div className="flex items-baseline justify-between gap-4 flex-wrap" style={{ marginBottom: 24 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Coming Up
            </span>
          </div>
          <h2 className="font-serif font-black" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: 'var(--color-ink)', lineHeight: 1.05 }}>
            Books worth{' '}
            <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>waiting for</em>
          </h2>
        </div>
        <Link
          href="/upcoming-releases"
          className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-70"
          style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}
        >
          See All <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="animate-pulse" style={{
              borderRadius: 16, border: '2px solid var(--color-rim)',
              backgroundColor: 'var(--color-surface)', aspectRatio: '2/3',
            }} />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {books.slice(0, 4).map((book, i) => (
            <UpcomingCard key={book.isbn13} book={book} accent={CARD_ACCENTS[i % CARD_ACCENTS.length]} index={i} />
          ))}
        </div>
      ) : (
        <div style={{ border: '1.5px dashed var(--color-rim)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
          <p className="font-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--color-ink-3)' }}>
            No releases in the next 30 days — check back soon.
          </p>
        </div>
      )}
    </section>
  )
}

const CIRCLE_BAR_COLORS = [
  'var(--color-accent)',  // orange — rank 1
  '#2D5BA5',              // blue   — rank 2
  '#6B3A7D',              // purple — rank 3
  '#B8970A',              // gold   — rank 4
]


// ── Friend lists section ──────────────────────────────────────────────────────

interface FriendList {
  list:   UserList
  friend: User
}

const LIST_CARD_ACCENTS = [
  { shadow: 'var(--color-accent)',        avatarBg: 'var(--color-accent)',        avatarText: '#FAF6EB' },
  { shadow: '#2D5BA5',                    avatarBg: '#2D5BA5',                    avatarText: '#FAF6EB' },
  { shadow: 'var(--color-accent-yellow)', avatarBg: 'var(--color-accent-yellow)', avatarText: 'var(--color-ink)' },
  { shadow: 'var(--color-accent-teal)',   avatarBg: 'var(--color-accent-teal)',   avatarText: '#FAF6EB' },
]

function ListCard({ friendList, accentIdx, index }: {
  friendList: FriendList
  accentIdx:  number
  index:      number
}) {
  const { list, friend } = friendList
  const accent  = LIST_CARD_ACCENTS[accentIdx % LIST_CARD_ACCENTS.length]
  const initial = (friend.display_name || friend.username).charAt(0).toUpperCase()
  const covers  = (list.items ?? []).slice(0, 4).map(item => item.book?.cover_image_url ?? null)
  // Pad to 4 slots
  const slots   = [...covers, ...Array(Math.max(0, 4 - covers.length)).fill(null)]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      style={{
        flexShrink: 0,
        width: 'calc((100% - 28px) / 3)',  // exactly 3 per viewport
        minWidth: 260,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        border: '2px solid var(--color-ink)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: `4px 4px 0px ${accent.shadow}`,
        backgroundColor: 'var(--color-canvas)',
        display: 'flex', flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{ padding: '14px 14px 0', flex: 1 }}>

          {/* Top row */}
          <div className="flex items-center justify-between gap-2" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2">
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                backgroundColor: accent.avatarBg,
                border: '2px solid var(--color-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: accent.avatarText, lineHeight: 1 }}>
                  {initial}
                </span>
              </div>
              <div>
                <p style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.16em',
                  color: 'var(--color-ink-3)', textTransform: 'uppercase', marginBottom: 1,
                }}>
                  A list by
                </p>
                <p className="font-bold" style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1 }}>
                  {friend.display_name || friend.username}
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {list.items_count ?? list.items?.length ?? 0} books
            </div>
          </div>

          {/* List name */}
          <h3 className="font-serif font-black leading-tight" style={{
            fontSize: '1.15rem', color: 'var(--color-ink)', marginBottom: 8,
          }}>
            {list.name}
          </h3>

          {/* Description */}
          {list.description && (
            <p className="font-serif line-clamp-2" style={{
              fontSize: 12, fontStyle: 'italic', lineHeight: 1.55,
              color: 'var(--color-ink-2)', marginBottom: 12,
            }}>
              &ldquo;{list.description}&rdquo;
            </p>
          )}

          {/* Book covers */}
          <div style={{
            border: '1.5px dashed var(--color-rim)',
            borderRadius: 8, padding: 8,
            display: 'flex', gap: 5, marginBottom: 14,
          }}>
            {slots.map((url, i) => (
              <div
                key={i}
                style={{
                  flex: 1, aspectRatio: '2/3',
                  borderRadius: 3, overflow: 'hidden',
                  backgroundColor: 'var(--color-cave)',
                  boxShadow: url ? '1px 2px 5px rgba(0,0,0,0.2)' : 'none',
                  opacity: url ? 1 : 0.4,
                }}
              >
                {url && (
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open list button */}
        <Link
          href={`/users/${friend.id}?list=${list.id}`}
          className="flex items-center justify-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-80"
          style={{
            margin: '0 14px 14px',
            padding: '11px 0',
            borderRadius: 999,
            backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
            fontSize: 10, letterSpacing: '0.16em',
            border: '2px solid var(--color-ink)',
          }}
        >
          Open List
          <ArrowRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>
    </motion.div>
  )
}

function FriendListsSection() {
  const [friendLists, setFriendLists] = useState<FriendList[]>([])
  const [loading, setLoading]         = useState(true)
  const [hasFriends, setHasFriends]   = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const friends = await apiClient.getFriends()
        if (cancelled) return
        if (friends.length === 0) { setHasFriends(false); setLoading(false); return }

        // Fetch lists for up to 8 friends concurrently
        const results = await Promise.allSettled(
          friends.slice(0, 8).map(f => apiClient.getUserLists(f.id).then(lists => ({ f, lists })))
        )
        if (cancelled) return

        const collected: FriendList[] = []
        for (const r of results) {
          if (r.status !== 'fulfilled') continue
          const { f, lists } = r.value
          for (const list of lists) {
            collected.push({ list, friend: f })
          }
        }
        setFriendLists(collected)
      } catch {
        // silently fall through to empty state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <section style={{ marginBottom: 60 }}>
      {/* Header row */}
      <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 20 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              Friend Lists
            </span>
          </div>
          <h2 className="font-serif font-black" style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            color: 'var(--color-ink)', lineHeight: 1.05,
          }}>
            Reading lists{' '}
            <em style={{ color: 'var(--color-accent-teal)', fontStyle: 'italic' }}>your friends made</em>
          </h2>
        </div>

        <Link
          href="/lists"
          className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-70"
          style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}
        >
          All Lists <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>

      {loading ? (
        /* Skeleton — 3 cards visible */
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: 'calc((100% - 28px) / 3)', minWidth: 260,
                height: 320, borderRadius: 14,
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-rim)',
              }}
            />
          ))}
        </div>
      ) : !hasFriends || friendLists.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            border: '2px dashed var(--color-rim)', borderRadius: 16,
            padding: '44px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px dashed var(--color-rim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <Users style={{ width: 18, height: 18, color: 'var(--color-ink-3)' }} />
            </div>
            <p className="font-serif font-bold" style={{ fontSize: 17, color: 'var(--color-ink)', marginBottom: 8 }}>
              No friend lists yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.6, maxWidth: '36ch', margin: '0 auto 22px' }}>
              Lists made by your friends and people you follow will appear here.
            </p>
            <Link
              href="/search?type=people"
              className="inline-flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-75"
              style={{
                fontSize: 11, letterSpacing: '0.14em',
                padding: '10px 22px', borderRadius: 999,
                border: '2px solid var(--color-ink)',
                backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              }}
            >
              Find people to follow
            </Link>
          </div>
        </motion.div>
      ) : (
        /* Horizontal scroll row */
        <div style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 6,
          alignItems: 'stretch',
        }}>
          {friendLists.map((fl, i) => (
            <ListCard key={fl.list.id} friendList={fl} accentIdx={i} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── In Your Circle section ────────────────────────────────────────────────────

function InYourCircleSection() {
  const [books, setBooks]           = useState<CircleTrendingBook[]>([])
  const [friendCount, setFriendCount] = useState(0)
  const [loading, setLoading]       = useState(true)
  const [hasFriends, setHasFriends] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await apiClient.getCircleTrending(30)
        if (cancelled) return
        setFriendCount(data.friend_count)
        if (data.friend_count === 0) setHasFriends(false)
        setBooks(data.books)
      } catch {
        // silently fall through
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const maxCount = useMemo(
    () => (books.length === 0 ? 1 : Math.max(...books.map(b => b.total_count), 1)),
    [books],
  )

  return (
    <section style={{ marginBottom: 80 }}>
      {/* Header row */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap" style={{ marginBottom: 24 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              In Your Circle
            </span>
          </div>
          <h2 className="font-serif font-black" style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            color: 'var(--color-ink)', lineHeight: 1.05,
          }}>
            What&rsquo;s{' '}
            <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>actually</em>
            {' '}being read
          </h2>
        </div>
        {!loading && hasFriends && books.length > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--color-ink-3)', whiteSpace: 'nowrap',
          }}>
            Last 30 days · {friendCount} friend{friendCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        /* Skeleton */
        <div style={{
          border: '2px solid var(--color-ink)', borderRadius: 20,
          boxShadow: '5px 5px 0px var(--color-accent-teal)',
          overflow: 'hidden', backgroundColor: 'var(--color-canvas)',
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div className="animate-pulse flex items-center gap-4" style={{ padding: '20px 24px' }}>
                <div style={{ width: 32, height: 36, borderRadius: 4, backgroundColor: 'var(--color-surface)', flexShrink: 0 }} />
                <div style={{ width: 48, height: 72, borderRadius: 4, backgroundColor: 'var(--color-surface)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, backgroundColor: 'var(--color-surface)', borderRadius: 4, marginBottom: 8, width: '60%' }} />
                  <div style={{ height: 10, backgroundColor: 'var(--color-surface)', borderRadius: 4, marginBottom: 10, width: '40%' }} />
                  <div style={{ height: 5, backgroundColor: 'var(--color-surface)', borderRadius: 999, width: '80%' }} />
                </div>
                <div style={{ width: 28, height: 28, backgroundColor: 'var(--color-surface)', borderRadius: 4, flexShrink: 0 }} />
              </div>
              {i < 3 && <div style={{ borderBottom: '1.5px dashed var(--color-rim)', margin: '0 24px' }} />}
            </div>
          ))}
        </div>
      ) : !hasFriends || books.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            border: '2px dashed var(--color-rim)', borderRadius: 16,
            padding: '44px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px dashed var(--color-rim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <BookOpen style={{ width: 18, height: 18, color: 'var(--color-ink-3)' }} />
            </div>
            <p className="font-serif font-bold" style={{ fontSize: 17, color: 'var(--color-ink)', marginBottom: 8 }}>
              No activity yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.6, maxWidth: '36ch', margin: '0 auto' }}>
              Books your friends add, read, or finish over the next 30 days will appear here.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Ranked list card */
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <div style={{
            border: '2px solid var(--color-ink)', borderRadius: 20,
            boxShadow: '5px 5px 0px var(--color-accent-teal)',
            overflow: 'hidden', backgroundColor: 'var(--color-canvas)',
          }}>
            {books.map((item, i) => (
              <div key={item.book.google_books_id ?? item.book.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
                  {/* Rank */}
                  <span
                    className="font-serif font-black"
                    style={{
                      fontSize: '2rem', lineHeight: 1, fontStyle: 'italic',
                      color: 'var(--color-rim)',
                      width: 32, flexShrink: 0, textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Cover */}
                  <div style={{
                    width: 48, height: 72, borderRadius: 4,
                    overflow: 'hidden', flexShrink: 0,
                    backgroundColor: 'var(--color-cave)',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}>
                    {item.book.cover_image_url ? (
                      <img
                        src={item.book.cover_image_url}
                        alt={item.book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', padding: 4 }}>
                        <span className="font-serif font-black" style={{ fontSize: 9, color: '#FAF6EB', lineHeight: 1.1 }}>
                          {item.book.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title / author / activity + progress bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-bold" style={{
                      fontSize: 14, color: 'var(--color-ink)', marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.book.title}
                    </p>
                    {item.book.author_name && (
                      <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 5 }}>
                        {item.book.author_name}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--color-ink-2)', marginBottom: 8, letterSpacing: '0.02em' }}>
                      {item.activity_label}
                    </p>
                    {/* Bar */}
                    <div style={{ height: 5, backgroundColor: 'var(--color-cave)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((item.total_count / maxCount) * 100)}%`,
                        backgroundColor: CIRCLE_BAR_COLORS[i % CIRCLE_BAR_COLORS.length],
                        borderRadius: 999,
                      }} />
                    </div>
                  </div>

                  {/* Total count */}
                  <span className="font-black tabular-nums" style={{
                    fontSize: '1.4rem', color: 'var(--color-ink)', flexShrink: 0,
                  }}>
                    {item.total_count}
                  </span>
                </div>
                {i < books.length - 1 && (
                  <div style={{ borderBottom: '1.5px dashed var(--color-rim)', margin: '0 24px' }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  )
}

// ── Browse by section ────────────────────────────────────────────────────────

function BrowseBySectionSection() {
  const GENRES = GENRE_CONFIG
  return (
    <section style={{ marginBottom: 80 }}>
      {/* Header */}
      <div className="flex items-baseline gap-4 flex-wrap" style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
            color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            Browse
          </span>
        </div>
        <h2 className="font-serif font-black" style={{
          fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
          color: 'var(--color-ink)', lineHeight: 1.05,
        }}>
          Wander{' '}
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>by section</em>
        </h2>
      </div>

      {/* Genre grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {GENRES.map((genre, i) => (
          <motion.div
            key={genre.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          >
            <Link
              href={`/discover/genre/${genre.slug}`}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                height: 150, padding: '16px 20px',
                borderRadius: 16,
                border: '2px solid var(--color-ink)',
                boxShadow: '4px 4px 0px var(--color-ink)',
                backgroundColor: genre.color,
                textDecoration: 'none',
                cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseDown={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translate(2px,2px)'
                el.style.boxShadow = '2px 2px 0px var(--color-ink)'
              }}
              onMouseUp={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = ''
                el.style.boxShadow = '4px 4px 0px var(--color-ink)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = ''
                el.style.boxShadow = '4px 4px 0px var(--color-ink)'
              }}
            >
              {/* Ghost number decoration */}
              <span
                className="font-serif font-black"
                aria-hidden
                style={{
                  position: 'absolute', top: 8, right: 14,
                  fontSize: '3.5rem', lineHeight: 1, fontStyle: 'italic',
                  color: genre.textColor === '#1A1A1A'
                    ? 'rgba(26,26,26,0.12)'
                    : 'rgba(250,246,235,0.14)',
                  userSelect: 'none', pointerEvents: 'none',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Short descriptor */}
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
                textTransform: 'uppercase', marginBottom: 6,
                color: genre.textColor === '#1A1A1A'
                  ? 'rgba(26,26,26,0.5)'
                  : 'rgba(250,246,235,0.6)',
              }}>
                {genre.label}
              </span>

              {/* Genre name */}
              <h3 className="font-serif font-black leading-tight" style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)',
                color: genre.textColor,
                lineHeight: 1.1,
              }}>
                {genre.name}
              </h3>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Category pills ────────────────────────────────────────────────────────────

const PILLS = ['Books', 'People'] as const
type Pill = typeof PILLS[number]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const { cacheSearchResults } = useBooksStore()
  const inputRef              = useRef<HTMLInputElement>(null)
  const [query, setQuery]     = useState('')
  const [active, setActive]   = useState<Pill>('Books')
  const [scannerOpen, setScannerOpen] = useState(false)

  const issueNumber = getIssueNumber()
  const weekDate    = formatNewsDate(getWeekMonday())

  const {
    books,
    loading: booksLoading,
    setQuery: setBookQuery,
    hasMore: hasMoreBooks,
    loadMore: loadMoreBooks,
  } = useBookSearch({ debounceMs: 350, perPage: 20 })

  const {
    users,
    loading: usersLoading,
    search: searchUsers,
    hasMore: hasMoreUsers,
    loadMore: loadMoreUsers,
  } = useUserSearch({ debounceMs: 350, pageSize: 10 })

  const isSearching = query.trim().length > 0

  function handleQueryChange(val: string) {
    setQuery(val)
    if (active === 'Books') setBookQuery(val)
    if (active === 'People') searchUsers(val)
  }

  function handlePillChange(pill: Pill) {
    setActive(pill)
    if (query.trim()) {
      if (pill === 'Books') setBookQuery(query)
      if (pill === 'People') searchUsers(query)
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
  }

  // ⌘K focuses the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>

      {/* ── Newspaper masthead ─────────────────────────────────────────────── */}
      <div style={{
        borderTop: '3px double var(--color-ink)',
        borderBottom: '1.5px solid var(--color-ink)',
        backgroundColor: 'var(--color-canvas)',
      }}>
        <div
          className="container-mobile"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          {/* Left */}
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
            color: 'var(--color-ink)', textTransform: 'uppercase',
          }}>
            Issue №{issueNumber}
          </span>

          {/* Center */}
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
            color: 'var(--color-ink)', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            Week of {weekDate}
          </span>

          {/* Right — hidden on mobile */}
          <span className="hidden sm:block" style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
            color: 'var(--color-ink)', textTransform: 'uppercase',
            textAlign: 'right',
          }}>
            Curated by your circle · No AI
          </span>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="container-mobile" style={{ paddingTop: 52, paddingBottom: 60, position: 'relative' }}>

        {/* "FROM PEOPLE · NOT MODELS" rotated stamp */}
        {/* <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 56,
            bottom: 90,
            transform: 'rotate(6deg)',
            border: '2px solid var(--color-ink)',
            borderRadius: 4,
            padding: '7px 14px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
            color: 'var(--color-ink)', textTransform: 'uppercase',
          }}>
            From people · not models
          </span>
        </div> */}

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-3"
          style={{ marginBottom: 22 }}
        >
          <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
            color: 'var(--color-accent)', textTransform: 'uppercase',
          }}>
            Discover
          </span>
        </motion.div>

        {/* Hero headline */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
          className="font-serif font-black tracking-tight"
          style={{
            fontSize: 'clamp(3.8rem, 9vw, 7.5rem)',
            lineHeight: 1.0,
            color: 'var(--color-ink)',
            marginBottom: 52,
          }}
        >
          What to{' '}
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>read</em>
          <br />
          <span style={{ position: 'relative', display: 'inline-block' }}>
            next
            <span style={{ color: 'var(--color-ink)' }}>.</span>
            {/* Yellow brush underline — matches landing page technique */}
            <svg
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '-0.12em',
                left: 0,
                width: '100%',
                overflow: 'visible',
              }}
              viewBox="0 0 200 10"
              preserveAspectRatio="none"
              height="10"
            >
              <path
                d="M0 8 Q50 2 100 8 Q150 14 200 8"
                stroke="#F1C75B"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.h1>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.23, 1, 0.32, 1] }}
          style={{ maxWidth: 700, marginBottom: 18 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              padding: '14px 22px',
              backgroundColor: 'var(--color-canvas)',
              boxShadow: '4px 4px 0px var(--color-accent-yellow)',
              transition: 'box-shadow 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.boxShadow = '6px 6px 0px var(--color-accent-yellow)')}
            onBlur={e => (e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-accent-yellow)')}
          >
            <Search style={{ width: 18, height: 18, color: 'var(--color-ink-3)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search millions of books, authors…"
              className="flex-1 outline-none bg-transparent font-serif"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                color: 'var(--color-ink)',
                caretColor: 'var(--color-accent)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                style={{ color: 'var(--color-ink-3)', flexShrink: 0, lineHeight: 0 }}
              >
                <X size={16} />
              </button>
            )}
            {active === 'Books' && (
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                title="Scan book barcode"
                style={{
                  flexShrink: 0,
                  width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--color-accent)',
                  color: '#FAF6EB',
                  border: '2px solid var(--color-ink)',
                  cursor: 'pointer',
                }}
                onMouseDown={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseUp={e => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <ScanLine size={15} />
              </button>
            )}
          </div>
        </motion.form>

        <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
            color: 'var(--color-ink-3)', textTransform: 'uppercase',
            marginRight: 4,
          }}>
            Try:
          </span>
          {PILLS.map(pill => {
            const isActive = active === pill
            return (
              <button
                key={pill}
                onClick={() => { handlePillChange(pill); inputRef.current?.focus() }}
                className="font-bold transition-all"
                style={{
                  fontSize: 13, letterSpacing: '0.04em',
                  padding: '8px 18px', borderRadius: 999,
                  border: '2px solid var(--color-ink)',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--color-ink)' : 'transparent',
                  color: isActive ? '#FAF6EB' : 'var(--color-ink)',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                {pill}
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* ── Search results (live) ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="container-mobile"
            style={{ paddingBottom: 80 }}
          >
            {/* Books results */}
            {active === 'Books' && (
              <section>
                <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                  <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    Books
                  </span>
                  {!booksLoading && books.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)', marginLeft: 4 }}>
                      {books.length} results
                    </span>
                  )}
                </div>

                {booksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="animate-pulse" style={{
                        border: '2px solid var(--color-rim)', borderRadius: 8,
                        backgroundColor: 'var(--color-surface)', overflow: 'hidden',
                      }}>
                        <div style={{ width: '100%', height: 220, backgroundColor: 'var(--color-cave)' }} />
                        <div style={{ padding: '10px 12px', borderTop: '2px solid var(--color-rim)' }}>
                          <div style={{ height: 13, width: '80%', borderRadius: 3, backgroundColor: 'var(--color-cave)', marginBottom: 6 }} />
                          <div style={{ height: 11, width: '55%', borderRadius: 3, backgroundColor: 'var(--color-cave)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : books.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {books.map((book, i) => (
                        <Link
                          key={book.google_books_id || book.id || i}
                          href={`/books/${book.google_books_id ?? book.id}`}
                          onClick={() => cacheSearchResults([book])}
                          className="flex flex-col"
                          style={{
                            border: '2px solid var(--color-ink)',
                            borderRadius: 8,
                            boxShadow: '4px 4px 0px var(--color-ink)',
                            backgroundColor: 'var(--color-canvas)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.1s, border-color 0.1s',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '5px 5px 0px var(--color-accent)'
                            e.currentTarget.style.borderColor = 'var(--color-accent)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-ink)'
                            e.currentTarget.style.borderColor = 'var(--color-ink)'
                          }}
                        >
                          {/* Cover — fills container height, natural width */}
                          <div style={{
                            position: 'relative', width: '100%', height: 220,
                            backgroundColor: 'var(--color-cave)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                          }}>
                            {book.cover_image_url ? (
                              <img
                                src={book.cover_image_url}
                                alt={book.title}
                                style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : null}
                            <span style={{
                              position: 'absolute', top: 8, left: 8,
                              fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                              color: 'var(--color-canvas)', backgroundColor: 'var(--color-ink)',
                              border: '1.5px solid var(--color-canvas)',
                              borderRadius: 4, padding: '3px 6px', lineHeight: 1.3,
                            }}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                          </div>
                          {/* Info */}
                          <div style={{ padding: '10px 12px', flex: 1, borderTop: '2px solid var(--color-ink)' }}>
                            <p className="font-serif" style={{
                              fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.25,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {book.title}
                            </p>
                            {book.author_name && (
                              <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 3 }}>
                                {book.author_name}
                              </p>
                            )}
                            {book.release_date && (
                              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--color-accent)', textTransform: 'uppercase', display: 'block', marginTop: 5 }}>
                                {String(book.release_date).slice(0, 4)}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    {hasMoreBooks && (
                      <button
                        onClick={loadMoreBooks}
                        className="w-full font-bold transition-opacity hover:opacity-70"
                        style={{ marginTop: 16, padding: '12px 0', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', borderTop: '1.5px dashed var(--color-rim)' }}
                      >
                        Load more results
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--color-rim)', borderRadius: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-2)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                      No books found for &ldquo;{query}&rdquo;
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 4 }}>
                      Try checking the spelling or searching by author name.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* People results */}
            {active === 'People' && (
              <section>
                <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                  <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    Readers
                  </span>
                  {!usersLoading && users.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)', marginLeft: 4 }}>
                      {users.length} results
                    </span>
                  )}
                </div>

                {usersLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center animate-pulse" style={{
                        gap: 12, padding: '14px 16px',
                        border: '2px solid var(--color-rim)', borderRadius: 14,
                        backgroundColor: 'var(--color-surface)',
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-cave)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ height: 13, width: '70%', borderRadius: 4, backgroundColor: 'var(--color-cave)', marginBottom: 6 }} />
                          <div style={{ height: 11, width: '50%', borderRadius: 4, backgroundColor: 'var(--color-cave)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/users/${user.id}`}
                          className="flex items-center"
                          style={{
                            gap: 12, padding: '14px 16px',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 14,
                            boxShadow: '3px 3px 0px var(--color-ink)',
                            backgroundColor: 'var(--color-canvas)',
                            transition: 'box-shadow 0.1s, border-color 0.1s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px var(--color-accent)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0px var(--color-ink)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-ink)'
                          }}
                        >
                          <Avatar src={user.avatar_url} name={user.display_name || user.username} size="md" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="truncate" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
                              {user.display_name || user.username}
                            </p>
                            <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>@{user.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {hasMoreUsers && (
                      <button
                        onClick={loadMoreUsers}
                        className="w-full font-bold transition-opacity hover:opacity-70"
                        style={{ marginTop: 16, padding: '12px 0', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', borderTop: '1.5px dashed var(--color-rim)' }}
                      >
                        Load more results
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--color-rim)', borderRadius: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-2)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                      No readers found for &ldquo;{query}&rdquo;
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 4 }}>
                      Try searching by username or display name.
                    </p>
                  </div>
                )}
              </section>
            )}

          </motion.div>
        ) : (
          <motion.div
            key="discover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* ── Featured book ──────────────────────────────────────────────── */}
            <div className="container-mobile" style={{ paddingBottom: 52 }}>
              <FeaturedBook />
            </div>

            {/* ── Coming Up ──────────────────────────────────────────────────── */}
            <div className="container-mobile" style={{ paddingBottom: 20 }}>
              <ComingUpSection />
            </div>

            {/* ── Friend lists ───────────────────────────────────────────────── */}
            <div className="container-mobile">
              <FriendListsSection />
            </div>

            {/* ── Readers Like You ────────────────────────────────────────────── */}
            {/* Hidden until user base is large enough for meaningful recs       */}
            {/* <div className="container-mobile">
              <PeerRecommendationsSection />
            </div> */}

            {/* ── Browse by section ──────────────────────────────────────────── */}
            <div className="container-mobile">
              <BrowseBySectionSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
