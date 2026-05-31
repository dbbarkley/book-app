'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, ArrowRight, LayoutGrid, List, Star, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient, useBooksStore } from '@book-app/shared'
import type { Book, CircleGenreRead, UserList, User } from '@book-app/shared'
import { getGenreBySlug, getGenreSectionNumber } from '../../genreConfig'

// ── Genre hero header ────────────────────────────────────────────────────────

function GenreHero({
  genre,
  sectionNumber,
  bookCount,
  subcatCounts,
  activeSubcat,
  onSubcat,
}: {
  genre:         ReturnType<typeof getGenreBySlug> & {}
  sectionNumber: string
  bookCount:     number | null
  subcatCounts:  Record<string, number>
  activeSubcat:  string | null
  onSubcat:      (name: string | null) => void
}) {
  const isLight   = genre.textColor === '#1A1A1A'
  const muted     = isLight ? 'rgba(26,26,26,0.55)'  : 'rgba(250,246,235,0.6)'
  const dimBg     = isLight ? 'rgba(26,26,26,0.12)'  : 'rgba(0,0,0,0.22)'
  const pillBg    = isLight ? 'rgba(26,26,26,0.08)'  : 'rgba(250,246,235,0.15)'
  const pillBorder = isLight ? 'rgba(26,26,26,0.25)' : 'rgba(250,246,235,0.35)'

  return (
    <div style={{
      borderRadius: 20,
      border: '2px solid var(--color-ink)',
      boxShadow: '5px 5px 0px var(--color-ink)',
      overflow: 'hidden',
      backgroundColor: genre.color,
      /* subtle depth vignette — lighter in top-right */
      backgroundImage: `radial-gradient(ellipse at 82% 12%, rgba(255,255,255,0.13) 0%, transparent 55%)`,
      marginBottom: 56,
    }}>
      <div style={{ padding: '32px 36px 28px' }}>

        {/* ── Row 1: section badge + count box ── */}
        <div className="flex items-start justify-between gap-8" style={{ marginBottom: 24 }}>
          {/* Left: badge + label */}
          <div className="flex items-center gap-3">
            <div style={{
              border: `1.5px solid ${genre.textColor}`,
              borderRadius: 6, padding: '5px 12px',
              display: 'inline-flex', alignItems: 'center',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 900, letterSpacing: '0.14em',
                color: genre.textColor, textTransform: 'uppercase',
              }}>
                Section {sectionNumber}
              </span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.2em',
              color: muted, textTransform: 'uppercase',
            }}>
              Wander by section
            </span>
          </div>

          {/* Right: "In this section" count box */}
          <div style={{
            backgroundColor: dimBg,
            borderRadius: 14,
            padding: '14px 22px',
            textAlign: 'center',
            minWidth: 130,
            flexShrink: 0,
          }}>
            <p style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.22em',
              color: muted, textTransform: 'uppercase', marginBottom: 4,
            }}>
              In this section
            </p>
            <p className="font-serif font-black tabular-nums" style={{
              fontSize: bookCount !== null ? '3.5rem' : '2rem',
              lineHeight: 1, color: genre.textColor, marginBottom: 2,
            }}>
              {bookCount !== null ? bookCount.toLocaleString() : '—'}
            </p>
            <p style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
              color: muted, textTransform: 'uppercase',
            }}>
              Books
            </p>
          </div>
        </div>

        {/* ── Genre name ── */}
        <h1 className="font-serif font-black" style={{
          fontSize: 'clamp(4rem, 9vw, 7rem)',
          lineHeight: 0.95, color: genre.textColor,
          marginBottom: 16,
        }}>
          {genre.name}
          <span style={{ color: '#F1C75B' }}>.</span>
        </h1>

        {/* ── Tagline quote ── */}
        <p className="font-serif" style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          fontStyle: 'italic', lineHeight: 1.5,
          color: muted, marginBottom: 32,
        }}>
          &ldquo;{genre.quote}&rdquo;
        </p>

        {/* ── Dashed divider ── */}
        <div style={{ borderTop: `1.5px dashed ${pillBorder}`, marginBottom: 24 }} />

        {/* ── Sub-categories ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Eyebrow */}
          <div className="flex items-center gap-2" style={{ marginRight: 6 }}>
            <div style={{ width: 18, height: 1.5, backgroundColor: genre.textColor, opacity: 0.5, flexShrink: 0 }} />
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.22em',
              color: muted, textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              Sub-categories
            </span>
          </div>

          {/* Pills */}
          {genre.subcategories.map(sub => {
            const isActive = activeSubcat === sub.name
            const count    = subcatCounts[sub.name]
            return (
              <button
                key={sub.name}
                onClick={() => onSubcat(isActive ? null : sub.name)}
                className="flex items-center gap-2 font-bold transition-all"
                style={{
                  fontSize: 13,
                  padding: count !== undefined ? '8px 14px 8px 18px' : '8px 18px',
                  borderRadius: 999,
                  border: `1.5px solid ${isActive ? genre.textColor : pillBorder}`,
                  backgroundColor: isActive ? genre.textColor : pillBg,
                  color: isActive ? genre.color : genre.textColor,
                  cursor: 'pointer',
                  backdropFilter: 'none',
                }}
              >
                {sub.name}
                {count !== undefined && (
                  <span style={{
                    fontSize: 11, fontWeight: 900,
                    backgroundColor: isActive ? genre.color : (isLight ? 'rgba(26,26,26,0.15)' : 'rgba(0,0,0,0.25)'),
                    color: isActive ? genre.textColor : genre.textColor,
                    borderRadius: 999, padding: '2px 7px',
                    lineHeight: 1.4,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Suggest a tag */}
          <button
            className="flex items-center gap-1.5 font-bold transition-opacity hover:opacity-70"
            style={{
              fontSize: 13,
              padding: '8px 18px',
              borderRadius: 999,
              border: `1.5px dashed ${pillBorder}`,
              backgroundColor: 'transparent',
              color: muted,
              cursor: 'pointer',
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            Suggest a tag
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Friend circle section ────────────────────────────────────────────────────

const CIRCLE_AVATAR_COLORS = ['#3D7553', '#234A5A', '#C94B7A', '#2D5BA5', '#D5582E', '#B8970A']

function statusLabel(status: CircleGenreRead['status']): string {
  if (status === 'reading')  return 'is reading'
  if (status === 'read')     return 'just finished'
  return 'wants to read'
}

function FriendCircleSection({ genre }: { genre: ReturnType<typeof getGenreBySlug> & {} }) {
  const [reads, setReads]     = useState<CircleGenreRead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.getCircleGenreReads(genre.name, 30).then(res => {
      if (!cancelled) { setReads(res.reads); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [genre.name])

  const isEmpty = !loading && reads.length === 0

  const CARD_SHADOWS = [genre.color, '#234A5A', '#B8970A', '#2D5BA5', '#6B3A7D', '#C94B7A']

  return (
    <section style={{ marginBottom: 52 }}>
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 20 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              From your circle
            </span>
          </div>
          <h2 className="font-serif font-black" style={{
            fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
            color: 'var(--color-ink)', lineHeight: 1.05,
          }}>
            What friends are reading{' '}
            <em style={{ color: genre.color, fontStyle: 'italic' }}>
              in {genre.name.toLowerCase()}
            </em>
          </h2>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
          color: 'var(--color-ink-3)', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          Last 30 days
        </span>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="animate-pulse" style={{
              flexShrink: 0, width: 'calc((100% - 28px) / 3)', minWidth: 260,
              height: 120, borderRadius: 16,
              border: '2px solid var(--color-rim)',
              backgroundColor: 'var(--color-surface)',
            }} />
          ))}
        </div>
      ) : isEmpty ? (
        <div style={{
          border: '1.5px dashed var(--color-rim)', borderRadius: 14,
          padding: '28px 32px',
        }}>
          <p className="font-serif" style={{
            fontSize: 15, fontStyle: 'italic',
            color: 'var(--color-ink-3)', lineHeight: 1.55,
          }}>
            What your friends are reading in{' '}
            <em style={{ color: genre.color }}>{genre.name.toLowerCase()}</em>{' '}
            will show here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: 14,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 6, alignItems: 'stretch',
        }}>
          {reads.map((read, i) => {
            const shadowColor = CARD_SHADOWS[i % CARD_SHADOWS.length]
            const avatarColor = CIRCLE_AVATAR_COLORS[i % CIRCLE_AVATAR_COLORS.length]
            const initial = (read.user.display_name || read.user.username).charAt(0).toUpperCase()
            const displayName = read.user.display_name || read.user.username

            return (
              <motion.div
                key={`${read.user.id}-${read.book.google_books_id ?? read.book.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{ flexShrink: 0, width: 'calc((100% - 28px) / 3)', minWidth: 260 }}
              >
                <div style={{
                  border: '2px solid var(--color-ink)',
                  borderBottom: `4px solid ${shadowColor}`,
                  borderRadius: 16,
                  backgroundColor: 'var(--color-canvas)',
                  overflow: 'hidden',
                  display: 'flex', height: '100%',
                }}>
                  {/* Book cover — left edge, clipped */}
                  <div style={{
                    width: 88, flexShrink: 0,
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {read.book.cover_image_url ? (
                      <img
                        src={read.book.cover_image_url}
                        alt={read.book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: shadowColor,
                        display: 'flex', alignItems: 'flex-end', padding: 10,
                      }}>
                        <span className="font-serif font-black" style={{ fontSize: 11, color: '#FAF6EB', lineHeight: 1.2 }}>
                          {read.book.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, padding: '18px 16px 18px 14px' }}>
                    {/* Friend + status */}
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      {read.user.avatar_url ? (
                        <img
                          src={read.user.avatar_url}
                          alt={displayName}
                          style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#FAF6EB', lineHeight: 1 }}>
                            {initial}
                          </span>
                        </div>
                      )}
                      <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                        <span className="font-bold">{displayName}</span>
                        <span style={{ color: 'var(--color-ink-3)', fontWeight: 400 }}> {statusLabel(read.status)}</span>
                      </p>
                    </div>

                    {/* Book title + author */}
                    <p className="font-bold leading-snug" style={{
                      fontSize: 14, color: 'var(--color-ink)', marginBottom: 3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {read.book.title}
                    </p>
                    {read.book.author_name && (
                      <p style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
                        {read.book.author_name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Book grid ─────────────────────────────────────────────────────────────────

type SortOption = 'circle' | 'newest' | 'rated' | 'unread'
type ViewMode   = 'grid'   | 'list'

const SORT_LABELS: { id: SortOption; label: string }[] = [
  { id: 'circle',  label: 'Most read by circle' },
  { id: 'newest',  label: 'Newest'               },
  { id: 'rated',   label: 'Highest rated'        },
  { id: 'unread',  label: 'Unread by me'         },
]

function GenreBookCard({
  book, accentColor, badge,
}: {
  book:        Book
  accentColor: string
  badge?:      'MOST READ' | 'FRIENDS PICK'
}) {
  const author = book.author_name ?? book.author?.name
  const router = useRouter()
  const { cacheSearchResults } = useBooksStore()
  const href   = `/books/${book.google_books_id ?? book.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div
        onClick={() => { cacheSearchResults([book]); router.push(href) }}
        style={{
          border: '2px solid var(--color-ink)',
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: 'var(--color-canvas)',
          display: 'flex', flexDirection: 'column',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Badge */}
        {badge && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 2,
            backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
            borderRadius: 6, padding: '4px 10px',
            fontSize: 9, fontWeight: 900, letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
            {badge}
          </div>
        )}

        {/* Colored left accent on badged cards */}
        {badge && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 3, backgroundColor: accentColor, zIndex: 1,
          }} />
        )}

        {/* Cover */}
        <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', flexShrink: 0 }}>
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              backgroundColor: accentColor,
              display: 'flex', alignItems: 'flex-end', padding: 14,
            }}>
              <p className="font-serif font-black" style={{ fontSize: 18, color: '#FAF6EB', lineHeight: 1.2 }}>
                {book.title}
              </p>
            </div>
          )}
        </div>

        {/* Title + author */}
        <div style={{ padding: '12px 14px 0' }}>
          <p className="font-bold leading-snug" style={{
            fontSize: 14, color: 'var(--color-ink)', marginBottom: 3,
          }}>
            {book.title}
          </p>
          {author && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 12 }}>
              {author}
            </p>
          )}
        </div>

        {/* Dashed divider */}
        <div style={{ borderTop: '1.5px dashed var(--color-rim)', margin: '0 14px' }} />

        {/* Stats row */}
        <div className="flex items-center justify-between" style={{ padding: '8px 14px 14px', marginTop: 'auto' }}>
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
            <Star style={{ width: 12, height: 12, color: 'var(--color-accent-yellow)' }} />
            {book.followers_count !== undefined ? '—' : '—'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
            {book.page_count ? `${book.page_count}pp` : '—'}
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
            <Users style={{ width: 12, height: 12 }} />
            —
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function BookGrid({ genre, activeSubcat, totalCount }: {
  genre:        ReturnType<typeof getGenreBySlug> & {}
  activeSubcat: string | null
  totalCount:   number | null
}) {
  const router = useRouter()
  const { cacheSearchResults } = useBooksStore()
  const [sort, setSort]         = useState<SortOption>('circle')
  const [view, setView]         = useState<ViewMode>('grid')
  const [books, setBooks]       = useState<Book[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPage(1)
    setHasMore(false)

    if (activeSubcat) {
      const subcatBisacCode = genre.subcategories.find(s => s.name === activeSubcat)?.bisacCode
      if (subcatBisacCode) {
        // Subcat has its own curated Hardcover shelf — use it
        apiClient.getCuratedShelfBooks(subcatBisacCode).then(res => {
          if (cancelled) return
          setBooks(res.books)
          setLoading(false)
        }).catch(() => { if (!cancelled) setLoading(false) })
      } else {
        // No curated shelf for this subcat — fall back to local DB search
        apiClient.searchBooks(`${activeSubcat} ${genre.name}`, 1, 20).then(res => {
          if (cancelled) return
          setBooks(res.books)
          setHasMore((res.pagination?.total_pages ?? 1) > 1)
          setLoading(false)
        }).catch(() => { if (!cancelled) setLoading(false) })
      }
    } else {
      // Full genre: read from the weekly-populated Hardcover curated shelf
      apiClient.getCuratedShelfBooks(genre.bisacCode).then(res => {
        if (cancelled) return
        if (res.populated && res.books.length > 0) {
          setBooks(res.books)
          setLoading(false)
        } else {
          // Shelf not yet populated — fall back to live NYT/Open Library fetch
          return apiClient.getGenreBooks(genre.slug).then(fallback => {
            if (!cancelled) {
              setBooks(fallback.books)
              setLoading(false)
            }
          })
        }
      }).catch(() => {
        if (!cancelled) {
          apiClient.getGenreBooks(genre.slug).then(fallback => {
            if (!cancelled) { setBooks(fallback.books); setLoading(false) }
          }).catch(() => { if (!cancelled) setLoading(false) })
        }
      })
    }

    return () => { cancelled = true }
  }, [genre.slug, activeSubcat])

  function loadMore() {
    if (!activeSubcat) return
    const subcatBisacCode = genre.subcategories.find(s => s.name === activeSubcat)?.bisacCode
    if (subcatBisacCode) return  // curated shelves return all books at once — no pagination needed
    const next = page + 1
    setPage(next)
    apiClient.searchBooks(`${activeSubcat} ${genre.name}`, next, 20).then(res => {
      setBooks(prev => [...prev, ...res.books])
      setHasMore((res.pagination?.total_pages ?? 1) > next)
    })
  }

  const displayCount = totalCount ?? books.length

  return (
    <section style={{ marginBottom: 52 }}>

      {/* ── Section header ── */}
      <div className="flex items-baseline justify-between gap-6" style={{ marginBottom: 18 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              All Books
            </span>
          </div>
          <h2 className="font-serif font-black" style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            color: 'var(--color-ink)', lineHeight: 1.05,
          }}>
            The whole shelf
            {displayCount > 0 && (
              <span style={{ color: genre.color, marginLeft: '0.3em' }}>
                · {displayCount.toLocaleString()}
              </span>
            )}
          </h2>
        </div>
        {!activeSubcat && (
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
            color: 'var(--color-ink-3)', textTransform: 'uppercase',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Pick a sub-category above to narrow it down
          </span>
        )}
      </div>

      {/* ── Sort + view bar ── */}
      <div
        className="flex items-center gap-0"
        style={{
          border: '2px solid var(--color-ink)',
          borderRadius: 999,
          padding: '6px 8px 6px 18px',
          marginBottom: 24,
          backgroundColor: 'var(--color-canvas)',
        }}
      >
        {/* Sort label */}
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: '0.2em',
          color: 'var(--color-ink-3)', textTransform: 'uppercase',
          marginRight: 10, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Sort
        </span>

        {/* Sort pills */}
        <div className="flex items-center gap-1.5 flex-1">
          {SORT_LABELS.map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className="font-bold transition-all"
              style={{
                fontSize: 12, letterSpacing: '0.02em',
                padding: '7px 16px', borderRadius: 999,
                border: 'none', cursor: 'pointer',
                backgroundColor: sort === s.id ? 'var(--color-ink)' : 'transparent',
                color: sort === s.id ? '#FAF6EB' : 'var(--color-ink)',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div
          className="flex items-center gap-1"
          style={{
            borderLeft: '1.5px solid var(--color-rim)',
            paddingLeft: 12, marginLeft: 8,
            flexShrink: 0,
          }}
        >
          <span style={{
            fontSize: 10, fontWeight: 900, letterSpacing: '0.2em',
            color: 'var(--color-ink-3)', textTransform: 'uppercase',
            marginRight: 6,
          }}>
            View
          </span>
          {([['grid', LayoutGrid], ['list', List]] as const).map(([id, Icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: view === id ? 'var(--color-ink)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
            >
              <Icon style={{
                width: 16, height: 16,
                color: view === id ? '#FAF6EB' : 'var(--color-ink-3)',
              }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid / list ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              borderRadius: 14, border: '2px solid var(--color-rim)',
              backgroundColor: 'var(--color-surface)',
            }}>
              <div style={{ aspectRatio: '3/4', backgroundColor: 'var(--color-cave)', borderRadius: '12px 12px 0 0' }} />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ height: 13, backgroundColor: 'var(--color-cave)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
                <div style={{ height: 10, backgroundColor: 'var(--color-cave)', borderRadius: 4, width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div style={{
          border: '2px dashed var(--color-rim)', borderRadius: 16,
          padding: '60px 32px', textAlign: 'center',
        }}>
          <p className="font-serif font-bold" style={{ fontSize: 17, color: 'var(--color-ink)', marginBottom: 8 }}>
            No books found
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
            Try clearing the sub-category filter.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {books.map((book, i) => (
              <GenreBookCard
                key={book.google_books_id ?? book.id}
                book={book}
                accentColor={genre.color}
                badge={i === 0 ? 'MOST READ' : i === 2 ? 'FRIENDS PICK' : undefined}
              />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={loadMore}
                className="font-bold uppercase transition-all"
                style={{
                  fontSize: 11, letterSpacing: '0.14em',
                  padding: '12px 32px', borderRadius: 999,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                  backgroundColor: 'transparent', color: 'var(--color-ink)', cursor: 'pointer',
                }}
                onMouseDown={e => { const el = e.currentTarget; el.style.transform = 'translate(2px,2px)'; el.style.boxShadow = '1px 1px 0px var(--color-ink)' }}
                onMouseUp={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
              >
                Load more
              </button>
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {books.map((book, i) => {
            const author = book.author_name ?? book.author?.name
            return (
              <div
                key={book.google_books_id ?? book.id}
                className="flex items-center gap-4"
                onClick={() => { cacheSearchResults([book]); router.push(`/books/${book.google_books_id ?? book.id}`) }}
                style={{
                  padding: '14px 0',
                  borderBottom: '1.5px dashed var(--color-rim)',
                  cursor: 'pointer',
                }}
              >
                {/* Rank */}
                <span className="font-serif font-black" style={{
                  fontSize: '1.1rem', fontStyle: 'italic',
                  color: 'var(--color-rim)', width: 28, flexShrink: 0, textAlign: 'center',
                }}>
                  {i + 1}
                </span>
                {/* Cover */}
                <div style={{
                  width: 42, height: 58, borderRadius: 4,
                  overflow: 'hidden', flexShrink: 0,
                  backgroundColor: genre.color,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}>
                  {book.cover_image_url && (
                    <img src={book.cover_image_url} alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                {/* Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-bold" style={{ fontSize: 14, color: 'var(--color-ink)', marginBottom: 2 }}>
                    {book.title}
                  </p>
                  {author && (
                    <p style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>{author}</p>
                  )}
                </div>
                {/* Page count */}
                {book.page_count && (
                  <span style={{ fontSize: 12, color: 'var(--color-ink-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {book.page_count}pp
                  </span>
                )}
                {/* Add */}
                <button
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 font-bold uppercase transition-opacity hover:opacity-70"
                  style={{
                    fontSize: 10, letterSpacing: '0.12em',
                    padding: '6px 14px', borderRadius: 999,
                    border: '1.5px solid var(--color-ink)',
                    backgroundColor: 'transparent', color: 'var(--color-ink)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Plus style={{ width: 10, height: 10 }} />
                  Add
                </button>
              </div>
            )
          })}
          {hasMore && (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <button onClick={loadMore} className="font-bold uppercase transition-opacity hover:opacity-70"
                style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Load more ↓
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ── Curated lists section ────────────────────────────────────────────────────

interface FriendList { list: UserList; friend: User }

function CuratedListsSection({ genre }: { genre: ReturnType<typeof getGenreBySlug> & {} }) {
  const [friendLists, setFriendLists] = useState<FriendList[]>([])
  const [loading, setLoading]         = useState(true)

  // card 0 uses genre color; cards 1–3 cycle through fixed editorial tones
  const CARD_COLORS = [
    { bg: genre.color,  text: genre.textColor },
    { bg: '#1C2B47',    text: '#FAF6EB'        },
    { bg: '#C9A227',    text: '#1A1A1A'        },
    { bg: '#4A7A5C',    text: '#FAF6EB'        },
  ]

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const friends = await apiClient.getFriends()
        if (cancelled || friends.length === 0) { setLoading(false); return }
        const results = await Promise.allSettled(
          friends.slice(0, 8).map(f => apiClient.getUserLists(f.id).then(lists => ({ f, lists })))
        )
        if (cancelled) return
        const collected: FriendList[] = []
        for (const r of results) {
          if (r.status !== 'fulfilled') continue
          for (const list of r.value.lists) {
            collected.push({ list, friend: r.value.f })
          }
        }
        setFriendLists(collected)
      } catch { /* silently fall through */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (!loading && friendLists.length === 0) return null

  return (
    <section style={{ marginBottom: 80 }}>
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 22 }}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              Friend-made lists
            </span>
          </div>
          <h2 className="font-serif font-black" style={{
            fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
            color: 'var(--color-ink)', lineHeight: 1.05,
          }}>
            Curated{' '}
            <em style={{ color: genre.color, fontStyle: 'italic' }}>
              in {genre.name.toLowerCase()}
            </em>
          </h2>
        </div>
        <Link
          href="/lists"
          className="flex items-center gap-1 font-bold uppercase transition-opacity hover:opacity-70"
          style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--color-ink)', whiteSpace: 'nowrap' }}
        >
          See all lists <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="animate-pulse" style={{
              flexShrink: 0, width: 'calc((100% - 28px) / 3)', minWidth: 260,
              height: 160, borderRadius: 16,
              border: '2px solid var(--color-rim)',
              backgroundColor: 'var(--color-surface)',
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: 14,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 4, alignItems: 'stretch',
        }}>
          {friendLists.map(({ list, friend }, i) => {
            const { bg, text } = CARD_COLORS[i % CARD_COLORS.length]
            const muted = text === '#FAF6EB'
              ? 'rgba(250,246,235,0.55)'
              : 'rgba(26,26,26,0.45)'
            const name = (friend.display_name || friend.username).toUpperCase()

            return (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{ flexShrink: 0, width: 'calc((100% - 28px) / 3)', minWidth: 260 }}
              >
                <Link
                  href={`/users/${friend.id}?list=${list.id}`}
                  style={{ textDecoration: 'none', display: 'flex', height: '100%' }}
                >
                  <div style={{
                    border: '2px solid var(--color-ink)',
                    borderRadius: 16,
                    backgroundColor: bg,
                    padding: '20px 22px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%', minHeight: 158,
                    cursor: 'pointer',
                  }}>
                    {/* Top */}
                    <div>
                      <p style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
                        color: muted, textTransform: 'uppercase', marginBottom: 12,
                      }}>
                        List · {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="font-serif font-black leading-tight" style={{
                        fontSize: 'clamp(1.15rem, 2.2vw, 1.55rem)',
                        color: text, lineHeight: 1.15,
                      }}>
                        {list.name}
                      </h3>
                    </div>

                    {/* Bottom: by + count */}
                    <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
                        color: muted, textTransform: 'uppercase',
                      }}>
                        By {name}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
                        color: text, textTransform: 'uppercase',
                      }}>
                        {list.items_count ?? list.items?.length ?? 0} Books
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GenrePage() {
  const params = useParams()
  const slug   = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? ''
  const genre  = getGenreBySlug(slug)

  const [bookCount, setBookCount]         = useState<number | null>(null)
  const [subcatCounts, setSubcatCounts]   = useState<Record<string, number>>({})
  const [activeSubcat, setActiveSubcat]   = useState<string | null>(null)

  if (!genre) notFound()

  const sectionNumber = getGenreSectionNumber(slug)

  useEffect(() => {
    const subcatsWithCode = genre!.subcategories.filter(s => s.bisacCode)
    Promise.allSettled(
      subcatsWithCode.map(s =>
        apiClient.getCuratedShelfBooks(s.bisacCode!).then(res => ({
          name: s.name,
          count: res.books.length,
        }))
      )
    ).then(results => {
      const counts: Record<string, number> = {}
      for (const r of results) {
        if (r.status === 'fulfilled') counts[r.value.name] = r.value.count
      }
      setSubcatCounts(counts)
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
      if (total > 0) setBookCount(total)
    })
  }, [genre!.bisacCode])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="container-mobile" style={{ paddingTop: 28, paddingBottom: 80 }}>

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <Link
            href="/discover"
            className="flex items-center justify-center transition-opacity hover:opacity-70"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '2px solid var(--color-ink)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: 'var(--color-ink)' }} />
          </Link>
          <span style={{
            fontSize: 12, fontWeight: 800, letterSpacing: '0.18em',
            color: 'var(--color-ink)', textTransform: 'uppercase',
          }}>
            <Link
              href="/discover"
              style={{ color: 'var(--color-ink-3)', textDecoration: 'none' }}
              className="transition-opacity hover:opacity-70"
            >
              Discover
            </Link>
            {' / '}
            {genre.name.toUpperCase()}
          </span>
        </div>

        {/* ── Hero ── */}
        <GenreHero
          genre={genre}
          sectionNumber={sectionNumber}
          bookCount={bookCount}
          subcatCounts={subcatCounts}
          activeSubcat={activeSubcat}
          onSubcat={setActiveSubcat}
        />

        {/* ── Friends circle ── */}
        <FriendCircleSection genre={genre!} />

        {/* ── Books ── */}
        <BookGrid genre={genre!} activeSubcat={activeSubcat} totalCount={bookCount} />

        {/* ── Curated lists ── */}
        <CuratedListsSection genre={genre!} />

      </div>
    </div>
  )
}
