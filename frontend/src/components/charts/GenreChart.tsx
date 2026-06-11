'use client'

interface GenreData {
  name: string
  count: number
}

interface GenreChartProps {
  data: GenreData[]
  totalBooks?: number
}

const GENRE_COLORS = [
  '#D5582E',  // orange
  '#234A5A',  // navy
  '#C4973A',  // amber
  '#2D6A4F',  // green
  '#8B3A2A',  // dark red
  '#8B8378',  // warm gray
  '#5B7FA6',  // slate blue
]

export default function GenreChart({ data, totalBooks }: GenreChartProps) {
  if (!data || data.length === 0) return null

  const filtered = data.filter(d => d.name.toLowerCase() !== 'other')
  const total    = totalBooks ?? data.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(...filtered.map(d => d.count))

  if (filtered.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '5px 5px 0px var(--color-accent)',
        padding: '20px 22px 22px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}
          >
            Reading Mix
          </p>
          <h3
            className="font-serif font-bold leading-tight"
            style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-ink)' }}
          >
            Where the hours go
          </h3>
        </div>

        {total > 0 && (
          <div className="text-right flex-shrink-0">
            <span
              className="font-serif font-black block"
              style={{ fontSize: 42, color: 'var(--color-ink)', lineHeight: 1 }}
            >
              {total}
            </span>
            <p
              className="font-bold uppercase"
              style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--color-ink-3)', marginTop: 2 }}
            >
              Books Read
            </p>
          </div>
        )}
      </div>

      {/* Genre rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {filtered.map((genre, i) => {
          const color = GENRE_COLORS[i % GENRE_COLORS.length]
          const pct   = (genre.count / maxCount) * 100

          return (
            <div key={genre.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[13px]" style={{ color: 'var(--color-ink)' }}>
                  {genre.name}
                </span>
                <span className="font-bold text-[13px]" style={{ color }}>
                  {genre.count}
                </span>
              </div>

              {/* Track */}
              <div
                style={{
                  width: '100%', height: 12,
                  borderRadius: 999,
                  backgroundColor: 'var(--color-surface)',
                  position: 'relative',
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: `${pct}%`, height: '100%',
                    backgroundColor: color,
                    borderRadius: 999,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
