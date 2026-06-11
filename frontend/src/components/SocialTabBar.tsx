'use client'

export interface SocialTab<T extends string = string> {
  key: T
  label: string
  count?: number
}

interface SocialTabBarProps<T extends string = string> {
  tabs: SocialTab<T>[]
  activeTab: T
  onSelect: (key: T) => void
}

export default function SocialTabBar<T extends string = string>({
  tabs,
  activeTab,
  onSelect,
}: SocialTabBarProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(({ key, label, count }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            role="tab"
            aria-selected={active}
            className="flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-80"
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              padding: '7px 14px',
              backgroundColor: active ? 'var(--color-ink)' : 'transparent',
              color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
            }}
          >
            {label}
            {count !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: '1px 6px',
                  backgroundColor: active ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: active ? '#FAF6EB' : 'var(--color-ink-3)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
