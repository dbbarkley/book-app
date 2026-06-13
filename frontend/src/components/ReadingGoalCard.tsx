'use client'

import Link from 'next/link'

interface ReadingGoalCardProps {
  goal: number | null
  completed: number
  onEdit: () => void
}

export default function ReadingGoalCard({ goal, completed, onEdit }: ReadingGoalCardProps) {
  const year = new Date().getFullYear()
  const pct = goal ? Math.min(100, Math.round((completed / goal) * 100)) : 0
  const booksLeft = goal ? Math.max(0, goal - completed) : 0
  const isComplete = !!goal && completed >= goal

  const monthsElapsed = new Date().getMonth() + 1
  const expectedByNow = goal ? Math.round((monthsElapsed / 12) * goal) : 0
  const paceAhead = completed - expectedByNow

  const RADIUS = 38
  const CIRC = 2 * Math.PI * RADIUS
  const dash = (pct / 100) * CIRC

  let paceMsg = ''
  if (goal) {
    if (isComplete) paceMsg = 'Goal complete. You crushed it.'
    else if (paceAhead > 0) paceMsg = `You're ${paceAhead} book${paceAhead !== 1 ? 's' : ''} ahead of pace. Keep it boring.`
    else if (paceAhead < 0) paceMsg = `You're ${Math.abs(paceAhead)} book${Math.abs(paceAhead) !== 1 ? 's' : ''} behind pace. Time to read.`
    else paceMsg = 'Right on pace. Keep going.'
  }

  return (
    <div
      className="h-full"
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '6px 6px 0px var(--color-accent-yellow)',
        padding: 'clamp(14px, 4vw, 24px)',
      }}
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)' }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
          {year} Reading Goal
        </span>
      </div>

      {goal ? (
        <div className="flex items-center gap-4 sm:gap-5">
          {/* SVG donut */}
          <div className="flex-shrink-0 relative w-24 h-24 lg:w-36 lg:h-36">
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-cave)" strokeWidth={11} />
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={11}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif font-bold leading-none text-[26px] lg:text-[38px]" style={{ color: 'var(--color-ink)' }}>
                {completed}
              </span>
              <span className="text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
                of {goal}
              </span>
            </div>
          </div>

          {/* Text */}
          <div className="min-w-0">
            <p className="font-serif font-bold leading-tight mb-0.5 text-[20px] lg:text-[26px]" style={{ color: 'var(--color-ink)' }}>
              {pct}% there.
            </p>
            {!isComplete && (
              <p className="font-serif font-bold mb-3 text-[17px] lg:text-[21px]" style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                {booksLeft} to go.
              </p>
            )}
            <p className="text-[13px] leading-snug mb-4" style={{ color: 'var(--color-ink-2)' }}>
              {paceMsg}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={onEdit}
                className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                style={{
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '7px 14px',
                  color: 'var(--color-ink)',
                  backgroundColor: 'transparent',
                }}
              >
                Edit Goal →
              </button>
              <Link
                href="/library/year"
                className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
                style={{ color: 'var(--color-accent)' }}
              >
                {completed} Completed →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-serif font-bold mb-2" style={{ fontSize: 22, color: 'var(--color-ink)' }}>
            No goal yet.
          </p>
          <p className="text-[13px] leading-snug mb-5" style={{ color: 'var(--color-ink-2)' }}>
            Set a reading goal to track your pace through the year.
          </p>
          <button
            onClick={onEdit}
            className="zine-btn zine-btn-primary"
            style={{ padding: '10px 20px', fontSize: 11 }}
          >
            Set a Goal →
          </button>
        </div>
      )}
    </div>
  )
}
