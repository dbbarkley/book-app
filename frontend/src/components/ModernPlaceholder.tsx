'use client'

/**
 * ModernPlaceholder Component
 *
 * Dark library-themed placeholder for books without covers.
 * Uses a curated palette of dark, warm tones — walnut, olive, leather, slate —
 * so every placeholder feels like a physical book on a dark shelf rather
 * than a random bright gradient.
 */

interface ModernPlaceholderProps {
  title: string
  author?: string
  genre?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

// Dark, library-appropriate color pairs [from, to] for gradients
// All feel like aged book cover materials: walnut, olive, leather, midnight, slate
const DARK_PALETTES: Array<[string, string]> = [
  ['#2C1A10', '#150D06'],   // Walnut / dark mahogany
  ['#1A2E1E', '#0D1A0F'],   // Deep olive (matches canvas)
  ['#1E1A10', '#120F06'],   // Aged leather / sepia
  ['#16202A', '#0C1318'],   // Midnight navy-green
  ['#281A10', '#160D06'],   // Dark amber / burnt sienna
  ['#1A1628', '#0F0D18'],   // Deep indigo-slate
  ['#1C2418', '#0F150C'],   // Forest shadow
  ['#261818', '#150C0C'],   // Dark crimson / ruby
]

// Pick a palette deterministically from the title so the same book
// always gets the same color, but different books get different ones.
function getPalette(title: string): [string, string] {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0
  }
  return DARK_PALETTES[hash % DARK_PALETTES.length]
}

export function ModernPlaceholder({
  title = 'Unknown',
  author,
  genre,
  size = 'medium',
  className = '',
}: ModernPlaceholderProps) {
  const safeTitle = title || 'Unknown'
  const firstLetter = safeTitle.charAt(0).toUpperCase()
  const [colorFrom, colorTo] = getPalette(safeTitle)

  const sizeClasses = {
    small:  { container: 'w-24 h-36',  letter: 'text-4xl', meta: 'text-[8px]' },
    medium: { container: 'w-32 h-48',  letter: 'text-5xl', meta: 'text-[10px]' },
    large:  { container: 'w-48 h-72',  letter: 'text-7xl', meta: 'text-xs' },
  }

  const sizes = sizeClasses[size]
  const isFullWidth  = className.includes('w-full')
  const isFullHeight = className.includes('h-full')

  return (
    <div
      className={`
        ${isFullWidth  ? 'w-full' : sizes.container.split(' ')[0]}
        ${isFullHeight ? 'h-full' : sizes.container.split(' ')[1]}
        rounded-lg shadow-lg
        flex flex-col items-center justify-center
        relative overflow-hidden
        ${className}
      `}
      style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
    >
      {/* Subtle vertical grain lines — matches the body texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,1) 2px,
            rgba(255,255,255,1) 4px
          )`,
        }}
      />

      {/* Amber initial — the "spine label" */}
      <div
        className={`${sizes.letter} font-serif font-bold z-10 drop-shadow-md select-none`}
        style={{ color: 'var(--color-accent)' }}
      >
        {firstLetter}
      </div>

      {/* Title + author strip at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 p-2 z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
      >
        <div
          className={`font-medium ${sizes.meta} truncate text-center`}
          style={{ color: 'var(--color-lit)' }}
        >
          {safeTitle.length > 22 ? `${safeTitle.substring(0, 22)}…` : safeTitle}
        </div>
        {author && (
          <div
            className={`${sizes.meta} truncate text-center mt-0.5`}
            style={{ color: 'var(--color-lit-2)' }}
          >
            {author}
          </div>
        )}
      </div>

      {/* Top-left sheen — physical book highlight */}
      <div className="absolute top-0 left-0 right-1/2 h-1/2 bg-gradient-to-br from-white/10 to-transparent rounded-tl-lg pointer-events-none" />

      {/* Thin amber left edge — like a spine accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.5 }} />
    </div>
  )
}
