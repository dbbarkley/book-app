'use client'

import { Lock, Flame } from 'lucide-react'

interface LibraryStatsProps {
  stats: {
    reading: number
    toRead: number
    read: number
    readThisYear?: number
    dnf: number
    private: number
  }
  readingStreak?: number
  goal?: number | null
  onGoalClick?: () => void
}

const SHELF_CONFIG: { key: keyof LibraryStatsProps['stats']; label: string; color: string }[] = [
  { key: 'reading', label: 'Reading',   color: 'var(--color-accent)'        },
  { key: 'toRead',  label: 'To Read',   color: 'var(--color-accent-teal)'   },
  { key: 'read',    label: 'Completed', color: 'var(--color-accent-teal)'   },
  { key: 'dnf',     label: 'DNF',       color: 'var(--color-ink-3)'         },
  { key: 'private', label: 'Private',   color: 'var(--color-accent-yellow)' },
]

export default function LibraryStats({ stats, readingStreak = 0 }: LibraryStatsProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '6px 6px 0px var(--color-accent-teal)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-3">
        <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-teal)' }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent-teal)' }}>
          By The Shelf
        </span>
      </div>

      {/* Shelf tiles */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {SHELF_CONFIG.map(({ key, label, color }) => (
          <div
            key={key}
            className="flex flex-col items-center justify-center py-2 sm:py-3 px-1"
            style={{
              backgroundColor: 'var(--color-cave)',
              border: '1.5px solid var(--color-rim)',
              borderRadius: 10,
            }}
          >
            <div className="flex items-end gap-0.5 mb-1">
              <span
                className="font-serif font-bold leading-none text-xl sm:text-[28px]"
                style={{ color }}
              >
                {stats[key] ?? 0}
              </span>
              {key === 'private' && (
                <Lock size={11} style={{ color, marginBottom: 4 }} />
              )}
            </div>
            <span
              className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.1em] text-center"
              style={{ color: 'var(--color-ink-3)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Streak banner */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: 'var(--color-accent)',
          borderRadius: 10,
          border: '1.5px solid var(--color-ink)',
        }}
      >
        <div className="flex items-center gap-2">
          <Flame size={15} style={{ color: 'var(--color-accent-yellow)' }} />
          {readingStreak > 0 ? (
            <span className="font-bold" style={{ color: '#fff', fontSize: 13 }}>
              <span style={{ fontSize: 17 }}>{readingStreak}</span>
              {' '}day reading streak
            </span>
          ) : (
            <span className="font-bold" style={{ color: '#fff', fontSize: 13 }}>
              Start a streak — read today
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Keep it going
        </span>
      </div>
    </div>
  )
}
