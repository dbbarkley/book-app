'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, X, Loader2, Clock, MessageCircle, ChevronRight } from 'lucide-react'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import type { ReadingBuddySession } from '@book-app/shared'
import Avatar from '../Avatar'

function ProgressMini({ value }: { value: number }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-grove)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: 'var(--color-accent)' }}
      />
    </div>
  )
}

export default function DashboardReadingBuddy() {
  const { user } = useAuth()
  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    acceptSession,
    declineSession,
  } = useReadingBuddy()

  const [actionLoading, setActionLoading] = useState<{ id: number; type: 'accept' | 'decline' } | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Pending invites where I'm the invited party
  const pendingInvites = sessions.filter(
    s => s.status === 'pending' && s.invited.id === user?.id
  )

  // Active sessions
  const activeSessions = sessions.filter(s => s.status === 'active')

  if (sessionsLoading) {
    return (
      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-lit flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-accent" />
          Reading Buddy
        </h2>
        <div className="flex gap-2">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 h-20 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (pendingInvites.length === 0 && activeSessions.length === 0) return null

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-rim)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  }

  const handleAccept = async (session: ReadingBuddySession) => {
    setActionLoading({ id: session.id, type: 'accept' })
    try {
      await acceptSession(session.id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (session: ReadingBuddySession) => {
    setActionLoading({ id: session.id, type: 'decline' })
    try {
      await declineSession(session.id)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-lit flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-accent" />
          Reading Buddy
        </h2>
        {activeSessions.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
            {activeSessions.length} active
          </span>
        )}
      </div>

      {/* ── Pending Invites ──────────────────────────────────────────── */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          {pendingInvites.map(session => (
            <div
              key={session.id}
              className="rounded-2xl p-4 space-y-3"
              style={{ ...cardStyle, border: '1px solid var(--color-accent)' }}
            >
              <div className="flex items-start gap-3">
                {session.book.cover_image_url && (
                  <div className="w-10 h-14 rounded-lg overflow-hidden flex-none shadow">
                    <img
                      src={session.book.cover_image_url}
                      alt={session.book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar
                      src={session.initiator.avatar_url ?? undefined}
                      name={session.initiator.display_name || session.initiator.username}
                      size="xs"
                    />
                    <span className="text-xs font-bold text-lit truncate">
                      {session.initiator.display_name || session.initiator.username}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-lit line-clamp-1">{session.book.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-accent)' }}>
                    Reading Buddy invite
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(session)}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                >
                  {actionLoading?.id === session.id && actionLoading.type === 'accept'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Check className="w-3.5 h-3.5" />
                  }
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(session)}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                >
                  {actionLoading?.id === session.id && actionLoading.type === 'decline'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <X className="w-3.5 h-3.5" />
                  }
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Sessions ──────────────────────────────────────────── */}
      {activeSessions.length > 0 && (
        <div className="space-y-2">
          {activeSessions.map(session => {
            const partner = session.initiator.id === user?.id ? session.invited : session.initiator
            const myProgress = (session.initiator.id === user?.id ? session.initiator : session.invited).progress
            const partnerProgress = partner.progress

            return (
              <Link
                key={session.id}
                href={`/reading-buddy/${session.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:opacity-80"
                style={cardStyle}
              >
                {session.book.cover_image_url && (
                  <div className="w-9 h-12 rounded-lg overflow-hidden flex-none shadow">
                    <img src={session.book.cover_image_url} alt={session.book.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold text-lit truncate">{session.book.title}</p>
                  <div className="flex items-center gap-1.5">
                    <Avatar src={partner.avatar_url ?? undefined} name={partner.display_name || partner.username} size="xs" />
                    <span className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
                      with {partner.display_name || partner.username}
                    </span>
                  </div>
                  {(myProgress || partnerProgress) && (
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-lit-3)' }}>
                          You
                        </p>
                        <ProgressMini value={myProgress?.completion_percentage ?? 0} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-lit-3)' }}>
                          {partner.display_name || partner.username}
                        </p>
                        <ProgressMini value={partnerProgress?.completion_percentage ?? 0} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-none flex flex-col items-center gap-1" style={{ color: 'var(--color-lit-3)' }}>
                  <MessageCircle className="w-4 h-4" />
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pending outgoing invites (muted) */}
      {sessions.filter(s => s.status === 'pending' && s.initiator.id === user?.id).map(session => (
        <div
          key={session.id}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
        >
          <Clock className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-lit truncate">{session.book.title}</p>
            <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
              Waiting for {session.invited.display_name || session.invited.username}…
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
