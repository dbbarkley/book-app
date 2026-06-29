'use client'

import { useRef, useState } from 'react'

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

function clientXToRating(clientX: number, el: HTMLElement): number {
  const { left, width } = el.getBoundingClientRect()
  const raw = (clientX - left) / width
  const steps = Math.round(raw * 20)
  return Math.max(1, Math.min(20, steps)) * 0.25
}

interface StarRatingInputProps {
  value: number
  onChange: (rating: number) => void
  size?: number
}

export function StarRatingInput({ value, onChange, size = 30 }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const display = hovered || Number(value) || 0

  const handleMouseMove  = (e: React.MouseEvent) => {
    if (ref.current) setHovered(clientXToRating(e.clientX, ref.current))
  }
  const handleMouseLeave = () => setHovered(0)
  const handleClick      = (e: React.MouseEvent) => {
    if (ref.current) onChange(clientXToRating(e.clientX, ref.current))
  }
  const handleTouchMove  = (e: React.TouchEvent) => {
    e.preventDefault()
    if (ref.current) setHovered(clientXToRating(e.touches[0].clientX, ref.current))
  }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (ref.current) onChange(clientXToRating(e.changedTouches[0].clientX, ref.current))
    setHovered(0)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        ref={ref}
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
            size={size}
          />
        ))}
      </div>

      {display > 0 ? (
        <span className="font-black" style={{ fontSize: 18, color: 'var(--color-accent)', lineHeight: 1 }}>
          {display % 1 === 0 ? display.toFixed(1) : display.toFixed(2)}
        </span>
      ) : (
        <span style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>Tap to rate</span>
      )}
    </div>
  )
}
