'use client'

import { useState, useRef, useEffect } from 'react'
import { useBookReview } from '@book-app/shared'
import type { UserBook } from '@book-app/shared'

interface ReviewFormProps {
  userBook?: UserBook | null
  onReviewSubmit?: () => void
}

// ── Quarter-star SVG ──────────────────────────────────────────────────────────

let gradIdCounter = 0
function StarIcon({ fill, size = 30 }: { fill: number; size?: number }) {
  const id = useRef(`sg-${++gradIdCounter}`).current
  const pct = `${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={pct} stopColor="var(--color-accent)" />
          <stop offset={pct} stopColor="var(--color-surface)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
        fill={`url(#${id})`}
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Rating messages per star level ───────────────────────────────────────────

function ratingLabel(r: number): string {
  if (r <= 0)   return ''
  if (r <= 1)   return 'Not for me'
  if (r <= 2)   return "Wouldn't recommend"
  if (r <= 3)   return 'It was fine'
  if (r <= 4)   return 'Really enjoyed it'
  return "Couldn't put it down"
}

function clientXToRating(clientX: number, el: HTMLElement): number {
  const { left, width } = el.getBoundingClientRect()
  const raw   = (clientX - left) / width
  const steps = Math.round(raw * 20)
  return Math.max(1, Math.min(20, steps)) * 0.25
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReviewForm({ userBook, onReviewSubmit }: ReviewFormProps) {
  const { saveReview, loading } = useBookReview()
  const [rating,       setRating]       = useState<number>(Number(userBook?.rating) || 0)
  const [review,       setReview]       = useState<string>(userBook?.review || '')
  const [hovered,      setHovered]      = useState<number>(0)
  const [saved,        setSaved]        = useState(false)
  const [hideSpoilers, setHideSpoilers] = useState(true)
  const starsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRating(Number(userBook?.rating) || 0)
    setReview(userBook?.review || '')
    setSaved(false)
  }, [userBook?.rating, userBook?.review])

  const display = hovered || rating

  const handleMouseMove  = (e: React.MouseEvent) => {
    if (starsRef.current) setHovered(clientXToRating(e.clientX, starsRef.current))
  }
  const handleMouseLeave = () => setHovered(0)
  const handleClick      = (e: React.MouseEvent) => {
    if (starsRef.current) { setRating(clientXToRating(e.clientX, starsRef.current)); setSaved(false) }
  }
  const handleTouchMove  = (e: React.TouchEvent) => {
    e.preventDefault()
    if (starsRef.current) setHovered(clientXToRating(e.touches[0].clientX, starsRef.current))
  }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (starsRef.current) {
      setRating(clientXToRating(e.changedTouches[0].clientX, starsRef.current))
      setSaved(false)
    }
    setHovered(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !userBook?.id) return
    try {
      await saveReview(userBook.id, rating, review || undefined)
      setSaved(true)
      onReviewSubmit?.()
    } catch (err) {
      console.error('Failed to save review:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Star rating row ── */}
      <div style={{ marginBottom: 20 }}>
        <p className="font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--color-ink-3)', marginBottom: 10 }}>
          Rating
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            ref={starsRef}
            className="flex gap-0.5 cursor-pointer select-none touch-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                fill={Math.min(Math.max(display - (star - 1), 0), 1)}
                size={30}
              />
            ))}
          </div>

          {display > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="font-black" style={{ fontSize: 20, color: 'var(--color-accent)', lineHeight: 1 }}>
                {display % 1 === 0 ? display.toFixed(1) : display.toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                {ratingLabel(display)}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>Tap stars to rate</span>
          )}
        </div>
      </div>

      {/* ── Review textarea ── */}
      <textarea
        value={review}
        onChange={e => { setReview(e.target.value); setSaved(false) }}
        rows={5}
        placeholder="What did you actually think? Spoilers are okay — they'll be hidden by default."
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          color: 'var(--color-ink)',
          borderRadius: 10,
          padding: '14px 16px',
          fontSize: 14,
          width: '100%',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 1.65,
          transition: 'border-color 0.15s',
          marginBottom: 18,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
        onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-ink)')}
      />

      {/* ── Bottom row: spoiler toggle + submit ── */}
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setHideSpoilers(h => !h)}
            style={{
              width: 18, height: 18,
              borderRadius: 4,
              backgroundColor: hideSpoilers ? 'var(--color-accent)' : 'transparent',
              border: `2px solid ${hideSpoilers ? 'var(--color-accent)' : 'var(--color-ink)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 0.12s, border-color 0.12s',
            }}
          >
            {hideSpoilers && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="font-medium" style={{ fontSize: 13, color: 'var(--color-ink)' }}>
            Hide spoilers by default
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || rating === 0 || !userBook?.id}
          className="font-bold uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            fontSize: 11, letterSpacing: '0.14em',
            border: '2px solid var(--color-ink)',
            borderRadius: 999,
            padding: '10px 20px',
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-canvas)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {loading ? 'Saving…' : saved ? '✓ Saved' : userBook?.rating ? 'Update Review' : 'Post Review'}
        </button>
      </div>

      {!userBook?.id && (
        <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 12 }}>
          Add this book to your shelf first to leave a review.
        </p>
      )}

    </form>
  )
}
