'use client'

import { CheckCircle } from 'lucide-react'

interface ReadingGoalCardProps {
  /** The target number of books for the year, or null if not set. */
  goal: number | null
  /** Books completed this year (counts toward the goal). */
  completed: number
  /** Opens the goal-setting modal. */
  onEdit: () => void
}

/**
 * Reading Goal card — mirrors the mobile `goalCard` on the home / library
 * screens. Solid accent progress bar, large count, complete-pill.
 */
export default function ReadingGoalCard({ goal, completed, onEdit }: ReadingGoalCardProps) {
  const year = new Date().getFullYear()
  const pct = goal ? Math.min(100, Math.round((completed / goal) * 100)) : 0
  const isComplete = !!goal && completed >= goal

  return (
    <button
      onClick={onEdit}
      className="w-full text-left"
      style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        border: '1px solid var(--color-rim)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-lit)' }}>
          Reading Goal{' '}
          <span style={{ color: 'var(--color-lit-3)', fontWeight: 600 }}>· {year}</span>
        </span>
        {isComplete ? (
          <span
            className="flex items-center gap-1"
            style={{
              backgroundColor: 'var(--color-success)',
              borderRadius: 9999,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            <CheckCircle size={11} />
            Complete!
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>
            {goal ? 'Edit' : 'Set →'}
          </span>
        )}
      </div>

      {goal ? (
        <>
          {/* Count row */}
          <div className="flex items-baseline">
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-lit)' }}>{completed}</span>
            <span style={{ fontSize: 13, color: 'var(--color-lit-2)', marginLeft: 4 }}>
              of {goal} books
            </span>
            <span className="flex-1" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)' }}>{pct}%</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'var(--color-grove)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'var(--color-accent)',
                borderRadius: 4,
              }}
            />
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--color-lit-2)' }}>
          Track how many books you read this year
        </p>
      )}
    </button>
  )
}
