'use client'

export interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  estimatedTime?: string
  className?: string
}

const DEFAULT_LABELS = ['Welcome', 'Import', 'Genres', 'Authors']
const CIRCLE_SIZE = 52

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = DEFAULT_LABELS,
  estimatedTime = 'About Two Minutes',
  className = '',
}: ProgressIndicatorProps) {
  return (
    <div className={className}>

      {/* ── Step track ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>

        {/* Dashed connector — runs between circle centres */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: CIRCLE_SIZE / 2,
            left: CIRCLE_SIZE / 2,
            right: CIRCLE_SIZE / 2,
            borderTop: '1.5px dashed var(--color-ink-3)',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        {/* Circles + labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const active    = i === currentStep
            const completed = i < currentStep
            const label     = stepLabels[i] ?? `Step ${i + 1}`

            return (
              <div
                key={i}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: '50%',
                    backgroundColor: active
                      ? 'var(--color-accent)'
                      : completed
                      ? 'var(--color-canvas)'
                      : 'var(--color-canvas)',
                    border: active
                      ? 'none'
                      : `2px solid ${completed ? 'var(--color-accent)' : 'var(--color-ink)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                    // Canvas bg so the dashed line doesn't show through the circle body
                    boxShadow: `0 0 0 4px var(--color-canvas)`,
                  }}
                >
                  <span
                    className="font-serif font-bold"
                    style={{
                      fontSize: 20,
                      lineHeight: 1,
                      color: active
                        ? '#fff'
                        : completed
                        ? 'var(--color-accent)'
                        : 'var(--color-ink-2)',
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--color-ink)' : 'var(--color-ink-3)',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom meta row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-3)',
          }}
        >
          Chapter {currentStep + 1} of {totalSteps}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-3)',
          }}
        >
          · {estimatedTime} ·
        </span>
      </div>
    </div>
  )
}
