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

/**
 * SocialTabBar — pill-style tab row for Friends / Following / Followers.
 * Active tab uses surface bg + accent border + accent text. Mirrors mobile.
 */
export default function SocialTabBar<T extends string = string>({
  tabs,
  activeTab,
  onSelect,
}: SocialTabBarProps<T>) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {tabs.map(({ key, label, count }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            role="tab"
            aria-selected={active}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: active ? 'var(--color-surface)' : 'var(--color-grove)',
              border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-rim)'}`,
              color: active ? 'var(--color-accent)' : 'var(--color-lit-2)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span style={{ fontSize: 11, fontWeight: 700 }}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
