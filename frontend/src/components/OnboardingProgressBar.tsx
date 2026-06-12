'use client'

import { usePathname } from 'next/navigation'
import { useOnboarding } from '@book-app/shared'

const STEPS = [
  { num: '01', label: 'Welcome' },
  { num: '02', label: 'Import' },
  { num: '03', label: 'Genres' },
  { num: '04', label: 'Authors' },
]

export default function OnboardingProgressBar() {
  const pathname = usePathname()
  const { currentStep, selectedGenres, selectedAuthorIds } = useOnboarding()

  if (pathname !== '/onboarding') return null

  return (
    <div className="hidden md:block" style={{ backgroundColor: 'var(--color-ink)', borderBottom: '2px solid var(--color-ink)' }}>
      <div
        className="container-mobile"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}
      >
        {/* Left: label + step pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--color-accent-yellow)', flexShrink: 0, marginRight: 6,
            }}
          >
            Preview State →
          </span>

          {STEPS.map((s, i) => {
            const active = i === currentStep
            const done   = i < currentStep
            return (
              <div
                key={s.num}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 14px', borderRadius: 9999,
                  backgroundColor: active ? 'var(--color-accent)' : 'transparent',
                  border: `1.5px solid ${active ? 'var(--color-accent)' : done ? 'rgba(250,246,235,0.25)' : 'rgba(250,246,235,0.25)'}`,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: active ? 'var(--color-canvas)' : done ? 'rgba(250,246,235,0.4)' : 'rgba(250,246,235,0.55)',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                <span style={{ color: active ? 'var(--color-canvas)' : done ? 'rgba(250,246,235,0.25)' : 'rgba(250,246,235,0.35)' }}>
                  {s.num}
                </span>
                <span style={{ color: 'rgba(250,246,235,0.3)', fontSize: 9 }}>·</span>
                {s.label}
              </div>
            )
          })}
        </div>

        {/* Right: selection counts */}
        <div
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            color: 'rgba(250,246,235,0.45)', flexShrink: 0,
          }}
        >
          Genres: {selectedGenres.length}
          <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
          Authors: {selectedAuthorIds.length}
        </div>
      </div>
    </div>
  )
}
