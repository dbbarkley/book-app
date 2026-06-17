'use client'

import { useState, useEffect } from 'react'
import { useBookReview } from '@book-app/shared'
import type { UserBook } from '@book-app/shared'
import { StarRatingInput } from './StarRatingInput'

interface ReviewFormProps {
  userBook?: UserBook | null
  onReviewSubmit?: () => void
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReviewForm({ userBook, onReviewSubmit }: ReviewFormProps) {
  const { saveReview, loading } = useBookReview()
  const [rating,       setRating]       = useState<number>(Number(userBook?.rating) || 0)
  const [review,       setReview]       = useState<string>(userBook?.review || '')
  const [saved,        setSaved]        = useState(false)
  const [hideSpoilers, setHideSpoilers] = useState(true)

  useEffect(() => {
    setRating(Number(userBook?.rating) || 0)
    setReview(userBook?.review || '')
    setSaved(false)
  }, [userBook?.rating, userBook?.review])

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
          <StarRatingInput
            value={rating}
            onChange={r => { setRating(r); setSaved(false) }}
            size={30}
          />
          {rating > 0 && (
            <span style={{ fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
              {ratingLabel(rating)}
            </span>
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
