'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Loader2, Check, X, AlertTriangle } from 'lucide-react'
import { useReadingBuddy, useFriends, useAuth } from '@book-app/shared'
import type { User } from '@book-app/shared'
import Avatar from './Avatar'

interface Props {
  bookId: number
  bookTitle: string
}

export default function ReadingBuddyBookSection({ bookId, bookTitle }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const { sessions, sessionsLoading, fetchSessions, createSession } = useReadingBuddy()
  const { friends, loading: friendsLoading } = useFriends()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviting, setInviting] = useState<number | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const bookSessions    = sessions.filter(s => s.book.id === bookId)
  const openSessions    = bookSessions.filter(s => s.status === 'pending' || s.status === 'active')
  const invitableFriends = friends.filter(f =>
    !openSessions.some(s => s.initiator.id === f.id || s.invited.id === f.id)
  )

  const handleInvite = async (friend: User) => {
    setInviting(friend.id)
    setInviteError(null)
    try {
      const session = await createSession(bookId, friend.id)
      setInviteSuccess(true)
      setTimeout(() => {
        setIsModalOpen(false)
        setInviteSuccess(false)
        router.push(`/reading-buddy/${session.id}`)
      }, 800)
    } catch (err: any) {
      setInviteError(err?.response?.data?.error || err?.message || 'Failed to send invite')
    } finally {
      setInviting(null)
    }
  }

  const handleJoin = () => {
    if (openSessions.length > 0) {
      router.push(`/reading-buddy/${openSessions[0].id}`)
    } else {
      router.push('/reading-buddy')
    }
  }

  return (
    <>
      {/* ── Reading Buddy card ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--color-accent)',
          border: '2px solid var(--color-ink)',
          borderRadius: 16,
          boxShadow: '5px 5px 0px var(--color-ink)',
          padding: '28px 32px',
        }}
      >
        {/* Yellow shimmer — top right */}
        <div
          aria-hidden
          style={{
            position: 'absolute', top: 0, right: 0,
            width: '50%', height: '100%',
            background: 'radial-gradient(ellipse at top right, rgba(241,199,91,0.42) 0%, transparent 62%)',
            pointerEvents: 'none',
          }}
        />

        <div className="flex items-center justify-between gap-8" style={{ position: 'relative' }}>
          {/* Left: icon + text */}
          <div className="flex items-start gap-5">
            <div style={{ flexShrink: 0, paddingTop: 6 }}>
              <Users size={36} strokeWidth={1.5} style={{ color: 'rgba(250,246,235,0.6)' }} />
            </div>

            <div>
              <div style={{ marginBottom: 12 }}>
                <span
                  className="font-bold uppercase"
                  style={{
                    fontSize: 10, letterSpacing: '0.22em',
                    color: 'var(--color-accent-yellow)',
                    border: '1.5px solid var(--color-accent-yellow)',
                    borderRadius: 4, padding: '2px 8px',
                    display: 'inline-block',
                  }}
                >
                  Reading Buddy
                </span>
              </div>

              <h3 className="font-serif font-black" style={{ fontSize: 24, color: '#FAF6EB', lineHeight: 1.1, marginBottom: 10 }}>
                Read this{' '}
                <span style={{ color: 'var(--color-accent-yellow)', fontStyle: 'italic' }}>with a friend.</span>
              </h3>

              <p style={{ fontSize: 13, color: 'rgba(250,246,235,0.72)', lineHeight: 1.65, maxWidth: 440 }}>
                Spoiler-safe reactions, shared highlights, synced pace. Reading is already better with a friend.
              </p>
            </div>
          </div>

          {/* Right: buttons */}
          <div className="flex flex-col gap-3" style={{ flexShrink: 0 }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="font-bold uppercase transition-opacity hover:opacity-80"
              style={{
                fontSize: 11, letterSpacing: '0.14em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                padding: '12px 22px',
                backgroundColor: 'var(--color-accent-yellow)',
                color: 'var(--color-ink)',
                whiteSpace: 'nowrap',
              }}
            >
              + Start a Session
            </button>

            <button
              onClick={handleJoin}
              className="font-bold uppercase transition-opacity hover:opacity-80"
              style={{
                fontSize: 11, letterSpacing: '0.14em',
                border: '2px solid rgba(250,246,235,0.5)',
                borderRadius: 999,
                padding: '12px 22px',
                backgroundColor: 'transparent',
                color: '#FAF6EB',
                whiteSpace: 'nowrap',
              }}
            >
              Join Existing
            </button>
          </div>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-5"
            style={{
              backgroundColor: 'var(--color-canvas)',
              border: '2px solid var(--color-ink)',
              boxShadow: '5px 5px 0px var(--color-ink)',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                  Invite to Read Together
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
                  Pick a friend to read <span className="italic">{bookTitle}</span> with
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setInviteError(null) }}
                className="p-1.5 rounded-full transition-all hover:opacity-70"
                style={{ color: 'var(--color-ink-3)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(213,88,46,0.1)',
                  border: '1px solid rgba(213,88,46,0.3)',
                  color: 'var(--color-accent)',
                }}
              >
                <AlertTriangle className="w-4 h-4 flex-none" />
                {inviteError}
              </div>
            )}

            {friendsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
              </div>
            ) : invitableFriends.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
                {friends.length === 0
                  ? "You haven't added any friends yet."
                  : 'All your friends already have an open session for this book.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {invitableFriends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleInvite(friend)}
                    disabled={inviting !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80 disabled:opacity-50 text-left"
                    style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-rim)' }}
                  >
                    <Avatar src={friend.avatar_url ?? undefined} name={friend.display_name || friend.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>@{friend.username}</p>
                    </div>
                    {inviting === friend.id ? (
                      inviteSuccess
                        ? <Check className="w-4 h-4 flex-none" style={{ color: '#2D6A4F' }} />
                        : <Loader2 className="w-4 h-4 animate-spin flex-none" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <UserPlus className="w-4 h-4 flex-none" style={{ color: 'var(--color-ink-3)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
