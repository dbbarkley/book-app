'use client'

import { useRouter } from 'next/navigation'
import { UserCheck, UserX, Users } from 'lucide-react'
import Avatar from './Avatar'
import type { FriendRequest } from '@book-app/shared'

interface FriendRequestsPanelProps {
  requests: FriendRequest[]
  onAccept: (friendshipId: number) => Promise<void>
  onDecline: (friendshipId: number) => Promise<void>
}

export default function FriendRequestsPanel({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsPanelProps) {
  const router = useRouter()

  if (requests.length === 0) return null

  return (
    <div
      className="rounded-[28px] p-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-rim-accent)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} style={{ color: 'var(--color-accent)' }} />
        <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-lit)' }}>
          Friend Requests
        </h3>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
        >
          {requests.length}
        </span>
      </div>

      <div className="space-y-3">
        {requests.map(req => (
          <div
            key={req.id}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
          >
            <button
              onClick={() => router.push(`/users/${req.requester.id}`)}
              className="flex-shrink-0"
            >
              <Avatar
                src={req.requester.avatar_url}
                name={req.requester.display_name || req.requester.username}
                size="sm"
              />
            </button>

            <button
              onClick={() => router.push(`/users/${req.requester.id}`)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                {req.requester.display_name || req.requester.username}
              </p>
              {req.requester.display_name && (
                <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
                  @{req.requester.username}
                </p>
              )}
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onAccept(req.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                title="Accept"
              >
                <UserCheck size={13} />
                Accept
              </button>
              <button
                onClick={() => onDecline(req.id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-3)' }}
                title="Decline"
              >
                <UserX size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
