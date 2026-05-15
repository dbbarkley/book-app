'use client'

interface SocialStatPillProps {
  value: number | string
  label: string
}

/**
 * SocialStatPill — compact value+label pill used for friends / followers /
 * following counts on profile pages. Mirrors the mobile component.
 */
export default function SocialStatPill({ value, label }: SocialStatPillProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: 10,
        background: 'var(--color-grove)',
        border: '1px solid var(--color-rim)',
        minWidth: 56,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-lit)' }}>{value}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-lit-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
    </div>
  )
}
