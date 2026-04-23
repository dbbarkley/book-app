'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import { useFriendship } from '@book-app/shared'
import type { FriendshipStatus } from '@book-app/shared'

interface FriendButtonProps {
  userId: number
  initialStatus?: FriendshipStatus
  initialFriendshipId?: number | null
  onStatusChange?: (status: FriendshipStatus) => void
}

export default function FriendButton({
  userId,
  initialStatus = 'none',
  initialFriendshipId = null,
  onStatusChange,
}: FriendButtonProps) {
  const { status, sending, sendRequest, acceptRequest, declineRequest, removeFriend } =
    useFriendship(userId, initialStatus, initialFriendshipId)

  const [showConfirm, setShowConfirm] = useState(false)

  const handleAction = async () => {
    if (status === 'none') {
      await sendRequest()
      onStatusChange?.('pending_sent')
    } else if (status === 'pending_received') {
      await acceptRequest()
      onStatusChange?.('accepted')
    } else if (status === 'accepted') {
      setShowConfirm(true)
    }
  }

  const handleRemove = async () => {
    await removeFriend()
    setShowConfirm(false)
    onStatusChange?.('none')
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-lit-2)' }}>Remove friend?</span>
        <button
          onClick={handleRemove}
          disabled={sending}
          className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
        >
          Remove
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleAction}
          disabled={sending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
        >
          <UserCheck size={15} />
          Accept Request
        </button>
        <button
          onClick={async () => { await declineRequest(); onStatusChange?.('none') }}
          disabled={sending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
        >
          <UserX size={15} />
        </button>
      </div>
    )
  }

  const config = {
    none: {
      icon: UserPlus,
      label: 'Add Friend',
      style: { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit)' },
    },
    pending_sent: {
      icon: Clock,
      label: 'Request Sent',
      style: { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-3)' },
    },
    accepted: {
      icon: UserCheck,
      label: 'Friends',
      style: { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' },
    },
  } as const

  const current = config[status as keyof typeof config] ?? config.none
  const Icon = current.icon

  return (
    <button
      onClick={handleAction}
      disabled={sending || status === 'pending_sent'}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 hover:opacity-80"
      style={current.style}
    >
      <Icon size={15} />
      {sending ? '…' : current.label}
    </button>
  )
}
