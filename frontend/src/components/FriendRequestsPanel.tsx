'use client'

import { useState } from 'react'
import type { FriendRequest } from '@book-app/shared'
import { Bell } from 'lucide-react'

interface FriendRequestsPanelProps {
  requests: FriendRequest[]
  onAccept: (friendshipId: number) => Promise<void>
  onDecline: (friendshipId: number) => Promise<void>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#234A5A', '#D5582E', '#2D6A4F', '#1A1A1A', '#8B6914']

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  if (mins  < 1)  return 'just now'
  if (hours < 1)  return `${mins}m ago`
  if (days  < 1)  return `${hours}h ago`
  if (weeks < 1)  return `${days}d ago`
  return `${weeks}w ago`
}

// ── Row ────────────────────────────────────────────────────────────────────────

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}) {
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  const name = request.requester.display_name || request.requester.username
  const initial = name.charAt(0).toUpperCase()
  const color = avatarColor(name)

  async function handleAccept() {
    setAccepting(true)
    try { await onAccept() } finally { setAccepting(false) }
  }

  async function handleDecline() {
    setDeclining(true)
    try { await onDecline() } finally { setDeclining(false) }
  }

  const meta = [
    `@${request.requester.username}`,
    timeAgo(request.created_at),
  ].join(' · ')

  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 12,
        boxShadow: '3px 3px 0px var(--color-ink)',
      }}
    >
      {/* Letter avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center font-serif font-black"
        style={{
          width: 44, height: 44,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid var(--color-ink)',
          color: '#FAF6EB',
          fontSize: 18,
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-serif font-bold leading-tight" style={{ fontSize: 16, color: 'var(--color-ink)' }}>
          {name}
        </p>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-ink-3)' }}>
          {meta}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAccept}
          disabled={accepting || declining}
          className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)',
            borderRadius: 999,
            padding: '9px 18px',
          }}
        >
          {accepting ? '…' : 'Accept'}
        </button>
        <button
          onClick={handleDecline}
          disabled={accepting || declining}
          className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-ink)',
            border: '2px solid var(--color-ink)',
            borderRadius: 999,
            padding: '9px 18px',
          }}
        >
          {declining ? '…' : 'Decline'}
        </button>
      </div>
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export default function FriendRequestsPanel({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsPanelProps) {
  if (requests.length === 0) return null

  return (
    <div
      className="relative"
      style={{
        backgroundColor: 'var(--color-accent-yellow)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        boxShadow: '5px 5px 0px var(--color-ink)',
        padding: '20px 20px 20px',
      }}
    >
      {/* PENDING sticker */}
      <div
        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5"
        style={{
          border: '2px solid var(--color-ink)',
          borderRadius: 6,
          backgroundColor: 'var(--color-canvas)',
          color: 'var(--color-ink)',
          transform: 'rotate(2.5deg)',
        }}
      >
        Pending
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Bell size={18} strokeWidth={2.5} style={{ color: 'var(--color-ink)', flexShrink: 0 }} />
        <p className="font-serif font-bold" style={{ fontSize: 18, color: 'var(--color-ink)' }}>
          You have{' '}
          <span style={{ color: 'var(--color-ink)' }}>{requests.length}</span>{' '}
          new friend request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Request rows */}
      <div className="flex flex-col gap-3">
        {requests.map(req => (
          <RequestRow
            key={req.id}
            request={req}
            onAccept={() => onAccept(req.id)}
            onDecline={() => onDecline(req.id)}
          />
        ))}
      </div>
    </div>
  )
}
