'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserLibrary } from '@book-app/shared'
import type { UserBook } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'

interface UserLibraryProps {
  userId: number
  username: string
  isOwnProfile?: boolean
}

type ShelfTab = 'all' | 'reading' | 'read' | 'dnf'

// ── Book colours (deterministic by index) ──────────────────────────────────────

const BOOK_BG_COLORS = [
  '#183F4F', '#1A3D2A', '#1B3520', '#1E2D18', '#3B2815',
  '#1A1F58', '#2A1838', '#200808', '#280808', '#183A22',
  '#2A2010', '#1A2840', '#2A1020', '#103020', '#281828',
]

// ── Mini horizontal book card ──────────────────────────────────────────────────

function ShelfBook({ userBook, index }: { userBook: UserBook; index: number }) {
  const router  = useRouter()
  const book    = userBook.book!
  const bgColor = BOOK_BG_COLORS[index % BOOK_BG_COLORS.length]
  const href    = `/books/${book.google_books_id ?? book.id}`

  return (
    <button
      onClick={() => router.push(href)}
      className="flex-none text-left"
      style={{ width: 130, paddingTop: 0 }}
    >
      <div
        style={{
          width: 130,
          height: 194,   // ~2:3
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid var(--color-ink)',
          boxShadow: '3px 3px 0px rgba(26,26,26,0.35)',
          position: 'relative',
          backgroundColor: bgColor,
        }}
      >
        {book.cover_image_url && (
          <BookCoverImage
            src={book.cover_image_url}
            title={book.title}
            author={book.author_name}
            size="medium"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 38%, rgba(0,0,0,0.78) 68%)',
          }}
        />

        {/* Author */}
        {book.author_name && (
          <p
            className="absolute font-bold uppercase"
            style={{
              top: 8, left: 8, right: 8,
              fontSize: 8, letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.68)',
              lineHeight: 1.3,
            }}
          >
            {book.author_name}
          </p>
        )}

        {/* Spine accent line */}
        <div
          style={{
            position: 'absolute', left: 8, right: 8,
            top: '58%', height: 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />

        {/* Title */}
        <p
          className="absolute font-serif font-bold"
          style={{
            bottom: 8, left: 8, right: 8,
            fontSize: 14, lineHeight: 1.25,
            color: '#FAF6EB',
          }}
        >
          {book.title}
        </p>
      </div>
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function UserLibrary({ userId, username, isOwnProfile }: UserLibraryProps) {
  const { groupedLibrary, loading, error } = useUserLibrary(userId)
  const [activeTab, setActiveTab] = useState<ShelfTab>('all')

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          borderRadius: 16,
          boxShadow: '5px 5px 0px var(--color-ink)',
          padding: '22px 22px 24px',
        }}
      >
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-none animate-pulse rounded-lg" style={{ width: 130, height: 194, backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          borderRadius: 16,
          padding: '22px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>Failed to load library.</p>
      </div>
    )
  }

  const allBooks = [
    ...groupedLibrary.reading,
    ...groupedLibrary.read,
    ...groupedLibrary.dnf,
    ...groupedLibrary.to_read,
  ]

  const tabs: { id: ShelfTab; label: string; count: number }[] = [
    { id: 'all',     label: 'Everything', count: allBooks.length             },
    { id: 'reading', label: 'Reading',    count: groupedLibrary.reading.length },
    { id: 'read',    label: 'Finished',   count: groupedLibrary.read.length    },
    { id: 'dnf',     label: 'DNF',        count: groupedLibrary.dnf.length     },
  ]

  const shelfMap: Record<ShelfTab, UserBook[]> = {
    all:     allBooks,
    reading: groupedLibrary.reading,
    read:    groupedLibrary.read,
    dnf:     groupedLibrary.dnf,
  }

  const displayBooks = shelfMap[activeTab]
  const totalCount   = allBooks.length
  const shelfLabel   = isOwnProfile ? 'Your shelf' : `${username}'s shelf`

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '5px 5px 0px var(--color-ink)',
        padding: '22px 22px 24px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}
          >
            Library
          </p>
          <h3
            className="font-serif font-bold leading-tight"
            style={{ fontSize: 22, color: 'var(--color-ink)' }}
          >
            {shelfLabel}
            {totalCount > 0 && (
              <span className="font-serif" style={{ color: 'var(--color-ink-3)', fontWeight: 400, fontStyle: 'italic' }}>
                {' '}— {totalCount} book{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-80"
              style={{
                fontSize: 11, letterSpacing: '0.12em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                padding: '7px 14px',
                backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: '1px 6px',
                  backgroundColor: active ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: active ? '#FAF6EB' : 'var(--color-ink-3)',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Horizontal book scroll */}
      {displayBooks.length > 0 ? (
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}
        >
          {displayBooks.map((ub, i) => (
            <ShelfBook key={ub.id} userBook={ub} index={i} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '32px 0',
            textAlign: 'center',
            border: '1.5px dashed var(--color-rim)',
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
            {isOwnProfile ? 'Nothing here yet.' : `${username} hasn't shared any books in this shelf.`}
          </p>
        </div>
      )}

      {!isOwnProfile && (
        <p
          className="font-medium mt-4"
          style={{ fontSize: 11, color: 'var(--color-ink-3)', borderTop: '1.5px dashed var(--color-rim)', paddingTop: 12 }}
        >
          Only public books are shown.
        </p>
      )}
    </div>
  )
}
