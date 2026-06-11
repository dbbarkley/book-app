'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFriends, useReadingBuddy } from '@book-app/shared'
import type { FriendRequest, ReadingBuddySession } from '@book-app/shared'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#234A5A', '#D5582E', '#2D6A4F', '#1A1A1A', '#8B6914']

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
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

// ── Friend Request Row ────────────────────────────────────────────────────────

function FriendRow({
  request,
  onAccept,
  onDecline,
}: {
  request:   FriendRequest
  onAccept:  () => Promise<void>
  onDecline: () => Promise<void>
}) {
  const [visible, setVisible] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const name    = request.requester.display_name || request.requester.username
  const initial = name.charAt(0).toUpperCase()
  const color   = avatarColor(name)

  async function handle(action: () => Promise<void>) {
    if (pending) return
    const prev = visible
    setVisible(false)
    setPending(true)
    try {
      await action()
    } catch {
      setVisible(prev)
      setError('Something went wrong.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setPending(false)
    }
  }

  if (!visible) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          backgroundColor: color, border: '2px solid var(--color-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-playfair), serif', fontWeight: 900,
          fontSize: 14, color: '#FAF6EB',
        }}>
          {initial}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-playfair), serif',
            fontWeight: 700, fontSize: 13, color: 'var(--color-ink)',
            lineHeight: 1.2, marginBottom: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}{' '}
            <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--color-ink-2)' }}>
              wants to be friends
            </span>
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>
            {timeAgo(request.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => handle(onAccept)}
            disabled={pending}
            style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 4,
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              border: '1.5px solid var(--color-ink)', cursor: 'pointer',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Accept
          </button>
          <button
            onClick={() => handle(onDecline)}
            disabled={pending}
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink-3)', padding: '4px 0',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Decline
          </button>
        </div>
      </div>
      {error && (
        <p style={{ fontSize: 10, color: 'var(--color-error, #c0392b)', marginBottom: 4 }}>{error}</p>
      )}
    </div>
  )
}

// ── Buddy Invite Row ──────────────────────────────────────────────────────────

function BuddyRow({
  session,
  onAccept,
  onDecline,
}: {
  session:   ReadingBuddySession
  onAccept:  () => Promise<void>
  onDecline: () => Promise<void>
}) {
  const [visible, setVisible] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const initiatorName = session.initiator.display_name || session.initiator.username

  async function handle(action: () => Promise<void>) {
    if (pending) return
    const prev = visible
    setVisible(false)
    setPending(true)
    try {
      await action()
    } catch {
      setVisible(prev)
      setError('Something went wrong.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setPending(false)
    }
  }

  if (!visible) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        {/* Book spine */}
        <div style={{
          width: 24, height: 36, flexShrink: 0, borderRadius: 3,
          border: '1.5px solid var(--color-ink)',
          boxShadow: '2px 2px 0 var(--color-ink)',
          transform: 'rotate(-2deg)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-grove)',
        }}>
          {session.book.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.book.cover_image_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-playfair), serif',
            fontWeight: 700, fontSize: 13, color: 'var(--color-ink)',
            lineHeight: 1.25, marginBottom: 1,
          }}>
            {initiatorName}{' '}
            <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--color-ink-2)' }}>
              invited you to read{' '}
            </span>
            <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
              {session.book.title}
            </em>
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>
            {timeAgo(session.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => handle(onAccept)}
            disabled={pending}
            style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 4,
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              border: '1.5px solid var(--color-ink)', cursor: 'pointer',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Join
          </button>
          <button
            onClick={() => handle(onDecline)}
            disabled={pending}
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink-3)', padding: '4px 0',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Decline
          </button>
        </div>
      </div>
      {error && (
        <p style={{ fontSize: 10, color: 'var(--color-error, #c0392b)', marginBottom: 4 }}>{error}</p>
      )}
    </div>
  )
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function DashboardLetters() {
  const router = useRouter()

  const {
    pendingRequests,
    loading:       friendsLoading,
    acceptRequest,
    declineRequest,
  } = useFriends()

  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    acceptSession,
    declineSession,
  } = useReadingBuddy()

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const buddyInvites: ReadingBuddySession[] = sessions.filter(
    (s) => s.status === 'pending' && !s.is_initiator
  )

  const loading    = friendsLoading || sessionsLoading
  const totalCount = pendingRequests.length + buddyInvites.length
  const isEmpty    = !loading && totalCount === 0

  const showDivider = pendingRequests.length > 0 && buddyInvites.length > 0

  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      border: '2px solid var(--color-ink)',
      borderRadius: 14,
      padding: 22,
      boxShadow: '5px 5px 0 var(--color-ink)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
        <span style={{
          fontSize: 10, fontWeight: 800, color: 'var(--color-accent)',
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          Letters
        </span>
        {totalCount > 0 && (
          <span style={{
            marginLeft: 2,
            minWidth: 18, height: 18, borderRadius: 9,
            backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
            fontSize: 9, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 5px',
          }}>
            {totalCount}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 56, borderRadius: 8,
                backgroundColor: 'var(--color-grove)',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
          <div style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 32, color: 'var(--color-ink-3)',
            lineHeight: 1, marginBottom: 8,
          }}>
            ✉
          </div>
          <p style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 18, fontStyle: 'italic',
            color: 'var(--color-ink)', marginBottom: 4,
          }}>
            All quiet.
          </p>
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--color-ink-3)',
          }}>
            No new letters.
          </p>
        </div>
      )}

      {/* Friend request rows */}
      {!loading && pendingRequests.map((req) => (
        <FriendRow
          key={req.id}
          request={req}
          onAccept={()  => acceptRequest(req.id)}
          onDecline={() => declineRequest(req.id)}
        />
      ))}

      {/* Divider between groups */}
      {!loading && showDivider && (
        <div style={{ borderTop: '1.5px dashed var(--color-ink-3)', margin: '2px 0' }} />
      )}

      {/* Buddy invite rows */}
      {!loading && buddyInvites.map((session) => (
        <BuddyRow
          key={session.id}
          session={session}
          onAccept={async () => {
            await acceptSession(session.id)
            router.push(`/reading-buddy/${session.id}`)
          }}
          onDecline={() => declineSession(session.id)}
        />
      ))}

    </div>
  )
}
