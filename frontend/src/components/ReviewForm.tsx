'use client'

import { useState, useRef, useEffect } from 'react'
import { useBookReview } from '@book-app/shared'
import Button from './Button'
import type { UserBook } from '@book-app/shared'

interface ReviewFormProps {
  userBook?: UserBook | null
  onReviewSubmit?: () => void
}

// ── Quarter-star SVG ──────────────────────────────────────────────────────────

let gradIdCounter = 0
function StarIcon({ fill, size = 32 }: { fill: number; size?: number }) {
  const id = useRef(`sg-${++gradIdCounter}`).current
  const pct = `${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={pct} stopColor="var(--color-accent)" />
          <stop offset={pct} stopColor="var(--color-grove)" />
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function ratingLabel(r: number): string {
  if (r <= 1)   return 'Not for me'
  if (r <= 2)   return 'It was okay'
  if (r <= 3)   return 'I liked it'
  if (r <= 4)   return 'Really liked it'
  return 'It was amazing'
}

function clientXToRating(clientX: number, el: HTMLElement): number {
  const { left, width } = el.getBoundingClientRect()
  const raw = (clientX - left) / width        // 0→1 across 5 stars
  const steps = Math.round(raw * 20)          // 20 quarter-steps
  return Math.max(1, Math.min(20, steps)) * 0.25
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReviewForm({ userBook, onReviewSubmit }: ReviewFormProps) {
  const { saveReview, loading } = useBookReview()
  const [rating,  setRating]   = useState<number>(Number(userBook?.rating)  || 0)
  const [review,  setReview]   = useState<string>(userBook?.review  || '')
  const [hovered, setHovered]  = useState<number>(0)
  const [saved,   setSaved]    = useState(false)
  const starsRef = useRef<HTMLDivElement>(null)

  // Sync when userBook updates (e.g. after refetch)
  useEffect(() => {
    setRating(Number(userBook?.rating)  || 0)
    setReview(userBook?.review  || '')
    setSaved(false)
  }, [userBook?.rating, userBook?.review])

  const display = hovered || rating

  // ── Mouse ────────────────────────────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent) => {
    if (starsRef.current) setHovered(clientXToRating(e.clientX, starsRef.current))
  }
  const handleMouseLeave = () => setHovered(0)
  const handleClick = (e: React.MouseEvent) => {
    if (starsRef.current) { setRating(clientXToRating(e.clientX, starsRef.current)); setSaved(false) }
  }

  // ── Touch ────────────────────────────────────────────────────────────────────
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault() // stop page scroll while rating
    if (starsRef.current) setHovered(clientXToRating(e.touches[0].clientX, starsRef.current))
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (starsRef.current) {
      const touch = e.changedTouches[0]
      setRating(clientXToRating(touch.clientX, starsRef.current))
      setSaved(false)
    }
    setHovered(0)
  }

  // ── Stepper (± 0.25) — great for mobile fine-tuning ──────────────────────────
  const nudge = (delta: number) => {
    setRating(prev => Math.max(0.25, Math.min(5, Math.round((Number(prev) + delta) * 4) / 4)))
    setSaved(false)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
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

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-grove)',
    border: '1px solid var(--color-rim)',
    color: 'var(--color-lit)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-lit-3)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Star picker ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p style={labelStyle}>Your Rating</p>

        {/* Stars + stepper row */}
        <div className="flex items-center gap-3">
          {/* The draggable/tappable star strip */}
          <div
            ref={starsRef}
            className="flex gap-1 cursor-pointer select-none touch-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                fill={Math.min(Math.max(display - (star - 1), 0), 1)}
                size={34}
              />
            ))}
          </div>

          {/* Stepper — helpful on mobile after coarse drag */}
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => nudge(-0.25)}
              disabled={rating <= 0.25}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-opacity disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)', fontSize: 16 }}
            >
              −
            </button>
            <button
              type="button"
              onClick={() => nudge(0.25)}
              disabled={rating >= 5}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-opacity disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)', fontSize: 16 }}
            >
              +
            </button>
          </div>
        </div>

        {/* Numeric + label */}
        <div className="flex items-baseline gap-2 min-h-[22px]">
          {display > 0 ? (
            <>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1 }}>
                {display % 1 === 0 ? display.toFixed(0) : display % 0.5 === 0 ? display.toFixed(1) : display.toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-lit-3)', fontStyle: 'italic' }}>
                {ratingLabel(display)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--color-lit-3)' }}>
              Drag or tap stars to rate
            </span>
          )}
        </div>
      </div>

      {/* ── Review text ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p style={labelStyle}>
          Review <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </p>
        <textarea
          value={review}
          onChange={(e) => { setReview(e.target.value); setSaved(false) }}
          rows={4}
          placeholder="Share your thoughts about this book..."
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
        />
        <p style={{ fontSize: 11, color: 'var(--color-lit-3)', textAlign: 'right' }}>
          {review.length} characters
        </p>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <Button
        type="submit"
        isLoading={loading}
        fullWidth
        size="md"
        className="rounded-xl py-3 font-bold"
        disabled={rating === 0 || !userBook?.id}
      >
        {saved ? '✓ Saved' : userBook?.rating ? 'Update Review' : 'Save Review'}
      </Button>

      {!userBook?.id && (
        <p style={{ fontSize: 12, color: 'var(--color-lit-3)', textAlign: 'center' }}>
          Add this book to your shelf first to leave a review.
        </p>
      )}

    </form>
  )
}
