'use client'

import { useState, useEffect } from 'react'
import { PenLine, Lock, ArrowRight, ChevronUp, Loader2 } from 'lucide-react'
import { apiClient } from '@book-app/shared/api/client'
import type { BookNote } from '@book-app/shared/types'
import { BookCoverImage } from '../BookCoverImage'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function NoteCard({ note, expanded = false }: { note: BookNote; expanded?: boolean }) {
  const book = note.book
  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 14,
        boxShadow: '4px 4px 0 var(--color-ink)',
        padding: '16px 16px 14px',
        width: expanded ? '100%' : 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Book row */}
      {book && (
        <div className="flex items-start gap-2.5">
          <div style={{
            flexShrink: 0,
            transform: 'rotate(-3deg)',
            width: 34,
            aspectRatio: '2/3',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(26,26,26,0.2)',
            boxShadow: '2px 2px 0 var(--color-ink)',
            backgroundColor: 'var(--color-cave)',
          }}>
            <BookCoverImage src={book.cover_image_url} title={book.title ?? ''} size="small" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold leading-snug" style={{
              fontSize: 11, color: 'var(--color-ink)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {book.title}
            </p>
            {book.author_name && (
              <p style={{ fontSize: 9, color: 'var(--color-ink-3)', marginTop: 1 }}>{book.author_name}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1.5px dashed var(--color-ink-3)' }} />

      {/* Note text */}
      <p style={{
        fontSize: 12,
        lineHeight: 1.65,
        color: 'var(--color-ink-2)',
        fontStyle: 'italic',
        flex: 1,
        overflow: expanded ? undefined : 'hidden',
        display: expanded ? undefined : '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 4,
        WebkitBoxOrient: expanded ? undefined : 'vertical',
        whiteSpace: expanded ? 'pre-wrap' : undefined,
      }}>
        {note.content}
      </p>

      {note.page_number && (
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
          p. {note.page_number}
        </p>
      )}

      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-3)' }}>
        {formatDate(note.created_at)}
      </p>
    </div>
  )
}

export default function LibraryNotesStrip() {
  const [notes,   setNotes]   = useState<BookNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    apiClient.getAllUserNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)' }} />
          <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>Marginalia</span>
        </div>
      </section>
    )
  }

  if (notes.length === 0) return null

  const preview = notes.slice(0, 8)

  return (
    <section className="mb-12">

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
          <PenLine size={13} style={{ color: 'var(--color-accent)' }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
            Marginalia
          </span>
          <div className="flex items-center gap-1 ml-1">
            <Lock size={9} style={{ color: 'var(--color-ink-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--color-ink-3)' }}>Only You</span>
          </div>
        </div>

        {notes.length > 4 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-ink)' }}
          >
            {showAll
              ? <><ChevronUp size={12} /> Show less</>
              : <>See all {notes.length} <ArrowRight size={12} /></>
            }
          </button>
        )}
      </div>

      {/* Headline */}
      <h2
        className="font-serif font-bold leading-[1.05] tracking-tight mb-5"
        style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
      >
        Your{' '}
        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>notes.</em>
      </h2>

      {showAll ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map(note => <NoteCard key={note.id} note={note} expanded />)}
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {preview.map(note => <NoteCard key={note.id} note={note} />)}

          {notes.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-2 transition-opacity hover:opacity-70"
              style={{ width: 100, border: '2px dashed var(--color-ink)', borderRadius: 14, color: 'var(--color-ink)' }}
            >
              <ArrowRight size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">+{notes.length - 8} more</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
