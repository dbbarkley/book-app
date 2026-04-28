'use client'

/**
 * HeroDust — ambient floating page-corner particles.
 *
 * Renders 14 tiny rectangles that drift upward slowly,
 * like dust motes or loose page corners in a library.
 *
 * - Pure CSS animation, zero JS runtime cost
 * - All values are deterministic (no random on render)
 * - Respects prefers-reduced-motion via media query
 * - Uses CSS variables so it works with any theme
 * - Position absolute — parent must be position: relative
 */

const PARTICLES: {
  x: number       // left % position
  size: number    // px width/height
  delay: number   // animation-delay in seconds
  dur: number     // animation-duration in seconds
  opacity: number // max opacity
  rot: number     // initial rotation in degrees
}[] = [
  { x: 4,  size: 3, delay: 0,    dur: 14, opacity: 0.055, rot: 12  },
  { x: 11, size: 2, delay: 3.6,  dur: 10, opacity: 0.07,  rot: -9  },
  { x: 18, size: 4, delay: 1.2,  dur: 16, opacity: 0.04,  rot: 22  },
  { x: 27, size: 2, delay: 6.0,  dur: 12, opacity: 0.065, rot: -17 },
  { x: 34, size: 3, delay: 2.3,  dur: 11, opacity: 0.05,  rot: 6   },
  { x: 43, size: 2, delay: 8.1,  dur: 15, opacity: 0.07,  rot: -28 },
  { x: 51, size: 3, delay: 0.7,  dur: 9,  opacity: 0.045, rot: 19  },
  { x: 59, size: 4, delay: 4.5,  dur: 17, opacity: 0.055, rot: -11 },
  { x: 66, size: 2, delay: 2.8,  dur: 13, opacity: 0.065, rot: 9   },
  { x: 74, size: 3, delay: 7.4,  dur: 10, opacity: 0.04,  rot: -30 },
  { x: 81, size: 2, delay: 1.5,  dur: 14, opacity: 0.07,  rot: 15  },
  { x: 88, size: 3, delay: 5.2,  dur: 11, opacity: 0.05,  rot: -6  },
  { x: 93, size: 2, delay: 3.0,  dur: 16, opacity: 0.06,  rot: 24  },
  { x: 97, size: 4, delay: 9.0,  dur: 12, opacity: 0.045, rot: -18 },
]

const KEYFRAMES = `
@keyframes heroDustFloat {
  0%   { transform: translateY(0)      rotate(var(--p-rot)); opacity: 0; }
  8%   { opacity: var(--p-op); }
  92%  { opacity: var(--p-op); }
  100% { transform: translateY(-110vh) rotate(calc(var(--p-rot) + 20deg)); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-dust-particle { display: none !important; }
}
`

export default function HeroDust() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="hero-dust-particle"
            style={
              {
                position: 'absolute',
                bottom: `${(i * 7) % 40}%`,   // stagger start heights so they're not all at bottom
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                backgroundColor: 'var(--color-accent)',
                borderRadius: '1px',
                '--p-rot': `${p.rot}deg`,
                '--p-op': p.opacity,
                animation: `heroDustFloat ${p.dur}s ${p.delay}s infinite linear`,
                willChange: 'transform, opacity',
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  )
}
