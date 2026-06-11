'use client'

interface AuthorData {
  name: string
  count: number
}

interface TopAuthorsChartProps {
  data: AuthorData[]
}

export default function TopAuthorsChart({ data }: TopAuthorsChartProps) {
  if (!data || data.length === 0) return null

  const top     = data.slice(0, 5)
  const maxCount = Math.max(...top.map(d => d.count))

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '5px 5px 0px var(--color-accent-teal)',
        padding: '20px 22px 22px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent-teal)', marginBottom: 4 }}
          >
            Most Read
          </p>
          <h3
            className="font-serif font-bold leading-tight"
            style={{ fontSize: 22, color: 'var(--color-ink)' }}
          >
            Authors on rotation
          </h3>
        </div>

        <div
          className="font-bold uppercase flex-shrink-0"
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'var(--color-ink)',
            border: '2px solid var(--color-ink)',
            borderRadius: 5,
            padding: '5px 10px',
            marginTop: 2,
          }}
        >
          All Time
        </div>
      </div>

      {/* Author rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {top.map((author, i) => {
          const pct    = (author.count / maxCount) * 100
          const isTop  = i === 0

          return (
            <div key={author.name}>
              <div className="flex items-center gap-3 mb-1.5">
                {/* Rank badge */}
                <div
                  className="flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '2px solid var(--color-ink)',
                    backgroundColor: isTop ? 'var(--color-accent-yellow)' : 'var(--color-surface)',
                    fontSize: 12,
                    color: 'var(--color-ink)',
                  }}
                >
                  {i + 1}
                </div>

                {/* Name + count */}
                <span className="font-bold text-[13px] flex-1 min-w-0 truncate" style={{ color: 'var(--color-ink)' }}>
                  {author.name}
                </span>
                <span className="font-bold text-[13px] flex-shrink-0" style={{ color: 'var(--color-accent-teal)' }}>
                  {author.count}
                </span>
              </div>

              {/* Track */}
              <div
                style={{
                  width: '100%',
                  height: 10,
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
                    backgroundColor: 'var(--color-accent-teal)',
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
