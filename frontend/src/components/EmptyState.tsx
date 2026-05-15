'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body?: string
  /** Optional CTA — renders an accent button. */
  cta?: { label: string; href: string } | { label: string; onClick: () => void }
  /** 'lg' (default) = 72px icon wrap, 'sm' = 48px. */
  size?: 'lg' | 'sm'
}

/**
 * EmptyState — consistent empty-state block matching the mobile design:
 * circular grove icon wrap, centered title + body, optional accent CTA.
 */
export default function EmptyState({ icon: Icon, title, body, cta, size = 'lg' }: EmptyStateProps) {
  const wrap = size === 'lg' ? 72 : 48
  const iconSize = size === 'lg' ? 36 : 22

  const ctaButton = cta && (
    <span
      className="inline-flex items-center justify-center"
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-accent-on)',
        borderRadius: 14,
        padding: '13px 20px',
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {cta.label}
    </span>
  )

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ gap: 14, paddingTop: 56, paddingBottom: 56 }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: wrap,
          height: wrap,
          borderRadius: '50%',
          background: 'var(--color-grove)',
          border: '1px solid var(--color-rim)',
        }}
      >
        <Icon size={iconSize} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-lit)', letterSpacing: '-0.3px' }}>
          {title}
        </p>
        {body && (
          <p
            className="max-w-xs mx-auto"
            style={{ fontSize: 14, color: 'var(--color-lit-2)', lineHeight: '20px' }}
          >
            {body}
          </p>
        )}
      </div>
      {cta && ('href' in cta
        ? <Link href={cta.href}>{ctaButton}</Link>
        : <button onClick={cta.onClick}>{ctaButton}</button>
      )}
    </div>
  )
}
