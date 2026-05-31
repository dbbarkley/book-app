'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding, useAuth } from '@book-app/shared'
import { apiClient } from '@book-app/shared'
import type { Author } from '@book-app/shared'
import ProgressIndicator from '@/components/ProgressIndicator'
import { GoodreadsImportInline } from '@/components/GoodreadsImportInline'
import { mockGenres, mockAuthors } from '@/utils/onboardingData'
import { Layers, Sparkles, Heart, Gift, ArrowRight, Check, Lock, Pencil, Search } from 'lucide-react'

// ─── Step definitions ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 4

// ─── Welcome step sub-components ─────────────────────────────────────────────

function BookStack() {
  const books = [
    {
      color: '#1E3A4A', z: 1, rotate: -12, left: '2%', w: 108, h: 152,
      author: 'Sally Rooney', title: 'Normal People',
    },
    {
      color: '#234A5A', z: 2, rotate: -5, left: '28%', w: 112, h: 160,
      author: 'Gabrielle Zevin', title: 'Tomorrow and Tomorrow and Tomorrow',
    },
    {
      color: '#100A06', z: 3, rotate: 8, right: '2%', w: 104, h: 165,
      author: 'Frank Herbert', title: 'Dune',
    },
  ]

  return (
    <div style={{ position: 'relative', height: 188 }}>
      {books.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            left: b.left,
            right: (b as any).right,
            width: b.w,
            height: b.h,
            backgroundColor: b.color,
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.28)',
            boxShadow: '3px 5px 14px rgba(0,0,0,0.45)',
            transform: `rotate(${b.rotate}deg)`,
            zIndex: b.z,
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Spine highlight */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }} />
          <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3 }}>
            {b.author}
          </p>
          <p className="font-serif" style={{ fontSize: i === 2 ? 20 : 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>
            {b.title}
          </p>
        </div>
      ))}
    </div>
  )
}

function WelcomeStep() {
  const TASKS = [
    {
      num: '01', Icon: Layers, bg: 'var(--color-accent-teal)', iconColor: '#fff',
      title: 'Import your Goodreads library',
      sub: 'Books, ratings, shelves — all of it.',
    },
    {
      num: '02', Icon: Sparkles, bg: 'var(--color-accent)', iconColor: '#fff',
      title: 'Pick the genres you actually read',
      sub: "We'll bias recommendations toward them, never away from yours.",
    },
    {
      num: '03', Icon: Heart, bg: 'var(--color-accent-yellow)', iconColor: 'var(--color-ink)',
      title: "Tag the authors you'd buy in hardcover",
      sub: "We'll wake you when they publish next — once, quietly.",
    },
  ]

  return (
    <>
      {/* Headline */}
      <h1 className="font-serif font-black" style={{ fontSize: 'clamp(2.6rem, 7vw, 4rem)', lineHeight: 1.04, color: 'var(--color-ink)', marginBottom: 10, letterSpacing: '-0.02em' }}>
        Welcome <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>home</em>.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65, marginBottom: 32 }}>
        Let's get your library set up.
      </p>

      {/* Quote card + book stack */}
      <div className="grid sm:grid-cols-2 gap-5 mb-8 items-start">
        <div style={{ backgroundColor: 'var(--color-accent-yellow)', borderRadius: 14, padding: '22px 24px', border: '2px solid var(--color-ink)', boxShadow: '4px 4px 0px var(--color-ink)' }}>
          <p className="font-serif" style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--color-ink)', lineHeight: 1.55, marginBottom: 14 }}>
            &ldquo;Three small questions, then we leave you alone with your books.&rdquo;
          </p>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-ink)', opacity: 0.5 }}>
            — The Welcome Desk
          </p>
        </div>
        <BookStack />
      </div>

      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 22, height: 1.5, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>
          Here&rsquo;s what we&rsquo;ll ask
        </span>
      </div>

      {/* Task rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {TASKS.map(({ num, Icon, bg, iconColor, title, sub }) => (
          <div
            key={num}
            style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', border: '2px solid var(--color-ink)', borderRadius: 14, backgroundColor: 'var(--color-canvas)', boxShadow: '3px 3px 0px var(--color-ink)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: bg, border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '2px 2px 0px var(--color-ink)' }}>
              <Icon size={18} style={{ color: iconColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span className="font-serif" style={{ fontSize: 11, fontStyle: 'italic', fontWeight: 700, color: 'var(--color-accent)' }}>№ {num}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy pledge */}
      <div style={{ backgroundColor: 'var(--color-ink)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gift size={14} style={{ color: 'var(--color-canvas)', opacity: 0.65, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-canvas)', opacity: 0.85 }}>
            Nothing on this page becomes training data. Ever.
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent-yellow)', flexShrink: 0, marginLeft: 16 }}>
          Our Pledge
        </span>
      </div>
    </>
  )
}

// ─── Import step ─────────────────────────────────────────────────────────────

function ImportStep({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Headline ──────────────────────────────────────────────────────── */}
      <h2 className="font-serif font-black" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', lineHeight: 1.04, color: 'var(--color-ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>
        Import{' '}
        <em style={{ color: 'var(--color-accent-teal)', fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: 'var(--color-accent-yellow)', textUnderlineOffset: 4, textDecorationThickness: 2 }}>
          your books
        </em>
        .
      </h2>
      <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
        Bring your reading history over in seconds.
      </p>

      {/* ── Goodreads — shared component ──────────────────────────────────── */}
      <GoodreadsImportInline onSuccess={onSuccess} defaultOpen />

      {/* ── StoryGraph card ───────────────────────────────────────────────── */}
      <div style={{ border: '1.5px dashed var(--color-rim)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: 'var(--color-surface)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px dashed var(--color-rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-ink-3)' }}>SG</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-2)', marginBottom: 3 }}>StoryGraph import</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>We&rsquo;re talking to them. It&rsquo;ll land here when it&rsquo;s right.</p>
        </div>
        <div style={{ flexShrink: 0, backgroundColor: 'var(--color-accent-yellow)', border: '2px solid var(--color-ink)', borderRadius: 9999, padding: '4px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>
          Soon
        </div>
      </div>

      {/* ── No Goodreads info bar ─────────────────────────────────────────── */}
      <div style={{ border: '1.5px solid var(--color-rim)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Lock size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-ink)' }}>No Goodreads?</strong> That&rsquo;s fine. Hit{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-ink)' }}>Skip for now</em>{' '}
          below and we&rsquo;ll set up shelves by hand later.
        </p>
      </div>

    </div>
  )
}

// ─── Genre step ──────────────────────────────────────────────────────────────

function GenreStep({ selectedGenres, onToggle, genres }: {
  selectedGenres: string[]
  onToggle: (id: string) => void
  genres: { id: string; name: string; description?: string }[]
}) {
  return (
    <>
      {/* Headline */}
      <h2 className="font-serif font-black" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', lineHeight: 1.04, color: 'var(--color-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Pick the{' '}
        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: 'var(--color-accent-yellow)', textUnderlineOffset: 4, textDecorationThickness: 2 }}>
          genres
        </em>
        .
      </h2>
      <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65, marginBottom: 24 }}>
        We&rsquo;ll use these to personalise — never to profile.
      </p>

      {/* Subheader row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-ink-3)' }}>
          Pick three or more
        </span>
        {selectedGenres.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-success)', borderRadius: 9999, padding: '5px 14px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-lit)' }}>
              {selectedGenres.length} picked
            </span>
          </div>
        )}
      </div>

      {/* Genre grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {genres.map(g => {
          const selected = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              onClick={() => onToggle(g.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                padding: '16px 14px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', width: '100%',
                border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-ink)'}`,
                backgroundColor: selected ? 'var(--color-ink)' : 'var(--color-canvas)',
                transition: 'background-color 0.12s, border-color 0.12s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: selected ? 'var(--color-lit)' : 'var(--color-ink)', marginBottom: 3, lineHeight: 1.2 }}>
                  {g.name}
                </p>
                {g.description && (
                  <p style={{ fontSize: 12, color: selected ? 'var(--color-lit-3)' : 'var(--color-ink-3)', lineHeight: 1.4 }}>
                    {g.description}
                  </p>
                )}
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                backgroundColor: selected ? 'var(--color-accent)' : 'transparent',
                border: selected ? 'none' : '2px solid rgba(26,26,26,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Info bar */}
      <div style={{ border: '1.5px solid var(--color-rim)', borderRadius: 12, padding: '13px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Pencil size={13} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.55 }}>
          Change your mind anytime in <strong style={{ color: 'var(--color-ink)', fontWeight: 700 }}>Settings → Preferences</strong>. Nothing locks you in.
        </p>
      </div>
    </>
  )
}

// ─── Author step ──────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: '#C85A3A', fg: '#FAF6EB' },
  { bg: '#1E3A5C', fg: '#FAF6EB' },
  { bg: '#C9A227', fg: '#1A1A1A' },
  { bg: '#2D6A4F', fg: '#FAF6EB' },
  { bg: '#2B6777', fg: '#FAF6EB' },
  { bg: '#7C3238', fg: '#FAF6EB' },
  { bg: '#4A3765', fg: '#FAF6EB' },
  { bg: '#3D5A80', fg: '#FAF6EB' },
  { bg: '#76553A', fg: '#FAF6EB' },
  { bg: '#4A6741', fg: '#FAF6EB' },
]

const AUTHOR_COLORS: Record<number, { bg: string; fg: string }> = {
  1:  { bg: '#C85A3A', fg: '#FAF6EB' },
  2:  { bg: '#1E3A5C', fg: '#FAF6EB' },
  3:  { bg: '#4A3765', fg: '#FAF6EB' },
  4:  { bg: '#C9A227', fg: '#1A1A1A' },
  5:  { bg: '#2D6A4F', fg: '#FAF6EB' },
  6:  { bg: '#2B6777', fg: '#FAF6EB' },
  7:  { bg: '#76553A', fg: '#FAF6EB' },
  8:  { bg: '#3D5A80', fg: '#FAF6EB' },
  9:  { bg: '#7C3238', fg: '#FAF6EB' },
  10: { bg: '#4A6741', fg: '#FAF6EB' },
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

function getAvatarColor(id: number): { bg: string; fg: string } {
  return AUTHOR_COLORS[id] ?? AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length]
}

function AuthorStep({
  authors,
  selectedAuthorIds,
  onToggle,
  onSearch,
  searchLoading,
}: {
  authors: Author[]
  selectedAuthorIds: number[]
  onToggle: (id: number) => void
  onSearch: (query: string) => void
  searchLoading: boolean
}) {
  const [query, setQuery] = useState('')
  const [selectedAuthorsMap, setSelectedAuthorsMap] = useState<Record<number, Author>>({})

  // Keep selected authors map in sync as authors list changes (preserves chips after search)
  useEffect(() => {
    setSelectedAuthorsMap(prev => {
      const next = { ...prev }
      authors.forEach(a => {
        if (selectedAuthorIds.includes(a.id) && !next[a.id]) next[a.id] = a
      })
      Object.keys(next).forEach(k => {
        if (!selectedAuthorIds.includes(Number(k))) delete next[Number(k)]
      })
      return next
    })
  }, [authors, selectedAuthorIds])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => onSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, onSearch])

  const selectedAuthors = selectedAuthorIds
    .map(id => selectedAuthorsMap[id])
    .filter((a): a is Author => Boolean(a))

  const listAuthors = authors.filter(a => !selectedAuthorIds.includes(a.id))

  return (
    <>
      {/* Headline */}
      <h2 className="font-serif font-black" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', lineHeight: 1.04, color: 'var(--color-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        And the{' '}
        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: 'var(--color-accent-yellow)', textUnderlineOffset: 4, textDecorationThickness: 2 }}>
          authors
        </em>
        .
      </h2>
      <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65, marginBottom: 22 }}>
        Add the names that already live on your shelf.
      </p>

      {/* Section label + picked pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-ink-3)' }}>
          The names that ring a bell
        </span>
        {selectedAuthorIds.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-ink)', borderRadius: 9999, padding: '5px 16px', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-lit)' }}>
              {selectedAuthorIds.length} picked
            </span>
          </div>
        )}
      </div>

      {/* Selected authors tray */}
      <div
        style={{
          border: '1.5px dashed var(--color-rim)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          minHeight: 52,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {selectedAuthors.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
            Search and pick your favourites below&hellip;
          </span>
        ) : (
          selectedAuthors.map(author => (
            <div
              key={author.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                backgroundColor: 'var(--color-ink)',
                borderRadius: 9999,
                padding: '5px 10px 5px 14px',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-lit)', whiteSpace: 'nowrap' }}>
                {author.name}
              </span>
              <button
                onClick={() => onToggle(author.id)}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-3)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a name — Atwood, Murakami, Baldwin..."
          style={{
            width: '100%',
            padding: '13px 16px 13px 42px',
            fontSize: 14,
            color: 'var(--color-ink)',
            backgroundColor: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)',
            borderRadius: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Author list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {searchLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : listAuthors.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
            {query ? 'No authors found for that search.' : 'All done — every author is picked!'}
          </p>
        ) : (
          listAuthors.map(author => {
            const palette = getAvatarColor(author.id)
            return (
              <div
                key={author.id}
                onClick={() => onToggle(author.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 12,
                  backgroundColor: 'var(--color-canvas)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: palette.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: palette.fg, letterSpacing: '0.02em' }}>
                    {getInitials(author.name)}
                  </span>
                </div>

                {/* Name + bio */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 2 }}>
                    {author.name}
                  </p>
                  {author.bio && (
                    <p style={{ fontSize: 12, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
                      {author.bio}
                    </p>
                  )}
                </div>

                {/* + indicator (decorative — row handles the click) */}
                <div
                  style={{
                    width: 34, height: 34,
                    borderRadius: 8,
                    border: '1.5px solid var(--color-rim)',
                    backgroundColor: 'var(--color-canvas)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--color-ink)',
                    fontSize: 20, fontWeight: 400, lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  +
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

// ─── Chapter header (shared across all steps) ────────────────────────────────

function ChapterHeader({ step }: { step: number }) {
  const num = String(step + 1).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
      <div style={{ border: '1.5px solid var(--color-accent)', borderRadius: 5, padding: '4px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-accent)', transform: 'rotate(-2deg)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Chapter {num}
      </div>
      <div style={{ flex: 1, borderTop: '1.5px dashed var(--color-rim)' }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const {
    currentStep,
    selectedGenres,
    selectedAuthorIds,
    isLoading,
    error,
    nextStep,
    prevStep,
    toggleGenre,
    toggleAuthor,
    submitPreferences,
    skipOnboarding,
  } = useOnboarding()

  const [authors, setAuthors] = useState<Author[]>([])
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false)
  const authorSearchId = useRef(0)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  // ── Skip if already onboarded ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) { setCheckingOnboarding(false); return }
    const check = async () => {
      try {
        if (user?.onboarding_completed) { router.push('/dashboard'); return }
        const completed = await apiClient.checkOnboardingStatus()
        if (completed) router.push('/dashboard')
      } catch { /* allow access */ } finally { setCheckingOnboarding(false) }
    }
    check()
  }, [isAuthenticated, user, router])

  // ── Fetch authors ───────────────────────────────────────────────────────────
  useEffect(() => {
    apiClient.getAuthors({ per_page: 100 }).then(res => {
      const list = Array.isArray(res) ? res : (res as any).authors
      setAuthors(list || [])
    }).catch(() => {})
  }, [])

  const handleAuthorSearch = useCallback(async (query: string) => {
    const id = ++authorSearchId.current
    setAuthorSearchLoading(true)
    try {
      const result = query
        ? await apiClient.searchAuthors(query, 1, 50)
        : await apiClient.getAuthors({ per_page: 100 })
      if (id !== authorSearchId.current) return
      setAuthors(Array.isArray(result) ? result : (result as any).authors || [])
    } catch {}
    finally { if (id === authorSearchId.current) setAuthorSearchLoading(false) }
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (currentStep === TOTAL_STEPS - 1) {
      const result = await submitPreferences()
      if (result.success) {
        await refreshUser().catch(() => {})
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      nextStep()
    }
  }

  const handleSkipAll = async () => {
    const result = await skipOnboarding()
    if (result.success) {
      await refreshUser().catch(() => {})
      router.push('/dashboard')
      router.refresh()
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!isAuthenticated || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-4 mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-ink-3)' }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep />

      case 1: return <ImportStep onSuccess={nextStep} />

      // Step 2: Genres
      case 2:
        return (
          <GenreStep
            genres={mockGenres}
            selectedGenres={selectedGenres}
            onToggle={toggleGenre}
          />
        )

      // Step 3: Authors
      case 3:
        return (
          <AuthorStep
            authors={authors.length > 0 ? authors : mockAuthors}
            selectedAuthorIds={selectedAuthorIds}
            onToggle={toggleAuthor}
            onSearch={handleAuthorSearch}
            searchLoading={authorSearchLoading}
          />
        )

      default: return null
    }
  }

  const isLastStep   = currentStep === TOTAL_STEPS - 1
  const isImportStep = currentStep === 1
  const nextDisabled = currentStep === 2 && selectedGenres.length < 3

  const nextLabel = isLastStep ? 'Finish Setup' : isImportStep ? 'Skip for now' : 'Continue'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)', padding: '32px 16px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Progress indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={['Welcome', 'Import', 'Genres', 'Authors']}
          className="mb-8"
        />

        {/* Error banner */}
        {error && (
          <div className="zine-error-banner mb-5">{error}</div>
        )}

        {/* Step card */}
        <div style={{ border: '2px solid var(--color-ink)', borderRadius: 28, boxShadow: '6px 6px 0px var(--color-ink)', backgroundColor: 'var(--color-canvas)', padding: '40px 44px', overflow: 'hidden' }}>
          <ChapterHeader step={currentStep} />
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 24 }}>

          {/* Left: Back button — outlined pill on all non-first steps */}
          <div>
            {currentStep >= 1 && (
              <button
                onClick={prevStep}
                disabled={isLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 9999, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
            )}
          </div>

          {/* Right: skip text (step 0) or primary action button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {currentStep === 0 && (
              <button
                onClick={handleSkipAll}
                disabled={isLoading}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-ink-3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Skip Setup Entirely
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading || nextDisabled}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 9999, backgroundColor: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-ink)', boxShadow: '3px 3px 0px var(--color-ink)', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: isLoading || nextDisabled ? 'not-allowed' : 'pointer', opacity: nextDisabled ? 0.45 : 1 }}
            >
              {isLoading
                ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                : (
                  <>
                    {nextLabel}
                    {isLastStep ? <Check size={14} /> : <ArrowRight size={14} />}
                  </>
                )
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
