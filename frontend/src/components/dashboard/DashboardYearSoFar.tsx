'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { UserBook } from '@book-app/shared'

interface DashboardYearSoFarProps {
  readBooks: UserBook[]
  readingStreak?: number
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function computeYearStats(readBooks: UserBook[], year: number) {
  const finished = readBooks.filter((ub) => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === year
  })

  const genreSet = new Set<string>()
  finished.forEach((ub) => ub.book?.categories?.forEach((g) => genreSet.add(g)))

  const pages = finished.reduce((sum, ub) => sum + (ub.total_pages || 0), 0)

  let slowest: UserBook | null = null
  let slowestDays = 0
  finished.forEach((ub) => {
    if (!ub.started_at || !ub.finished_at) return
    const days = Math.round(
      (new Date(ub.finished_at).getTime() - new Date(ub.started_at).getTime()) / 86400000
    )
    if (days > slowestDays) { slowestDays = days; slowest = ub }
  })

  return { finished, genreCount: genreSet.size, pages, slowest, slowestDays }
}

export default function DashboardYearSoFar({ readBooks, readingStreak = 0 }: DashboardYearSoFarProps) {
  const now = new Date()
  const { finished, genreCount, pages, slowest, slowestDays } = computeYearStats(readBooks, now.getFullYear())

  const fmt = (n: number) => n > 0 ? n.toLocaleString() : '–'

  const stats = [
    { n: fmt(finished.length), label: 'Books finished' },
    { n: fmt(genreCount),      label: 'Genres' },
    { n: fmt(readingStreak),   label: 'Day streak · max' },
    { n: fmt(pages),           label: 'Pages turned' },
  ]

  const slowestBook = slowest as UserBook | null

  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      border: '2px solid var(--color-ink)',
      borderRadius: 14,
      padding: 22,
      boxShadow: '5px 5px 0 var(--color-ink)',
    }}>

      {/* Eyebrow + date range */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: 'var(--color-accent)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            Year so far
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, color: 'var(--color-ink-3)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Jan → {MONTH_ABBR[now.getMonth()]}
        </span>
      </div>

      {/* Tagline */}
      <h3 style={{
        fontFamily: 'var(--font-playfair), serif',
        fontSize: 22, fontWeight: 600, color: 'var(--color-ink)',
        margin: '0 0 18px', lineHeight: 1.05, letterSpacing: '-0.025em',
      }}>
        Just the{' '}
        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>facts.</em>
      </h3>

      {/* Ledger grid — 2×2 with hairline borders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderTop: '1.5px solid var(--color-ink)',
        borderLeft: '1.5px solid var(--color-ink)',
      }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            padding: '14px 12px',
            borderRight: '1.5px solid var(--color-ink)',
            borderBottom: '1.5px solid var(--color-ink)',
            backgroundColor: 'var(--color-canvas)',
          }}>
            <div style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 34, fontWeight: 600, color: 'var(--color-ink)',
              lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              {s.n}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 800, color: 'var(--color-ink-3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginTop: 6,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Slowest read — only shown when data is available */}
      {slowestBook && (
        <div style={{
          marginTop: 14,
          display: 'flex', gap: 12, alignItems: 'center',
          padding: 12, borderRadius: 8,
          border: '1.5px dashed var(--color-ink-3)',
        }}>
          <BookSpine book={slowestBook} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: 'var(--color-ink-3)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Slowest read
            </div>
            <div style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 13, fontWeight: 700, color: 'var(--color-ink)',
              lineHeight: 1.2, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {slowestBook.book?.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-ink-3)', marginTop: 2 }}>
              {slowestDays} days to finish
            </div>
          </div>
        </div>
      )}

      <Link href="/library" style={{
        marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontWeight: 800, color: 'var(--color-ink)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        textDecoration: 'none',
      }}>
        See the ledger <ArrowRight size={11} />
      </Link>
    </div>
  )
}

function BookSpine({ book }: { book: UserBook }) {
  const coverUrl = book.book?.cover_image_url
  return (
    <div style={{
      width: 30, height: 44, flexShrink: 0,
      borderRadius: 3,
      border: '1px solid rgba(26,26,26,0.25)',
      boxShadow: '2px 2px 0 var(--color-ink)',
      transform: 'rotate(-3deg)',
      overflow: 'hidden',
      backgroundColor: 'var(--color-grove)',
    }}>
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )
}
