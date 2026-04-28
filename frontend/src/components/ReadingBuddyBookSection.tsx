'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, UserPlus, Loader2, Check, Clock, X, AlertTriangle } from 'lucide-react'
import { useReadingBuddy, useFriends, useAuth } from '@book-app/shared'
import type { User, ReadingBuddySession } from '@book-app/shared'
import Avatar from './Avatar'

interface Props {
  bookId: number
  bookTitle: string
}

const STATUS_LABEL: Record<string, string> = {
  pending:  'Invite Pending',
  active:   'Reading Together',
  declined: 'Declined',
  dnf:      'Did Not Finish',
}

const STATUS_COLOR: Record<string, string> = {
  pending:  'var(--color-lit-3)',
  active:   '#4ade80',
  declined: 'var(--color-lit-3)',
  dnf:      'var(--color-lit-3)',
}

export default function ReadingBuddyBookSection({ bookId, bookTitle }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    createSession,
  } = useReadingBuddy()

  const { friends, loading: friendsLoading } = useFriends()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviting, setInviting] = useState<number | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Sessions for this specific book
  const bookSessions = sessions.filter(s => s.book.id === bookId)
  const openSessions = bookSessions.filter(s => s.status === 'pending' || s.status === 'active')

  // Friends who don't already have an open session for this book
  const invitableFriends = friends.filter(f =>
    !openSessions.some(s =>
      s.initiator.id === f.id || s.invited.id === f.id
    )
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
      setInviteError(
        err?.response?.data?.error ||
        err?.message ||
        'Failed to send invite'
      )
    } finally {
      setInviting(null)
    }
  }

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-rim)',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-lit flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          Reading Buddy
        </h3>
        {openSessions.length === 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-grove)',
              border: '1px solid var(--color-rim)',
              color: 'var(--color-lit-2)',
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite a Friend
          </button>
        )}
      </div>

      {sessionsLoading ? (
        <div className="flex gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 flex-1 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
          ))}
        </div>
      ) : openSessions.length > 0 ? (
        <div className="space-y-2">
          {openSessions.map(session => {
            const partner = session.initiator.id === user?.id ? session.invited : session.initiator
            return (
              <Link
                key={session.id}
                href={`/reading-buddy/${session.id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                style={cardStyle}
              >
                <Avatar src={partner.avatar_url ?? undefined} name={partner.display_name || partner.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-lit truncate">
                    {partner.display_name || partner.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {session.status === 'pending' && <Clock className="w-3 h-3" style={{ color: STATUS_COLOR[session.status] }} />}
                    {session.status === 'active'  && <Check className="w-3 h-3" style={{ color: STATUS_COLOR[session.status] }} />}
                    <span className="text-xs font-medium" style={{ color: STATUS_COLOR[session.status] }}>
                      {STATUS_LABEL[session.status]}
                    </span>
                  </div>
                </div>
                {partner.progress && (
                  <div className="text-right flex-none">
                    <p className="text-xs font-bold text-lit">
                      {partner.progress.completion_percentage ?? 0}%
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-lit-3)' }}>
                      {partner.progress.pages_read ?? 0}p
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ color: 'var(--color-lit-3)', border: '1px dashed var(--color-rim)' }}
          >
            <UserPlus className="w-3 h-3" />
            Invite another friend
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--color-lit-3)', border: '1px dashed var(--color-rim)', backgroundColor: 'var(--color-grove)' }}
        >
          <Users className="w-4 h-4" />
          Read this together with a friend
        </button>
      )}

      {/* Invite Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-5"
            style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-rim)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-lit">Invite to Read Together</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>
                  Pick a friend to read <span className="italic">{bookTitle}</span> with
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setInviteError(null) }}
                className="p-1.5 rounded-full transition-all hover:opacity-70"
                style={{ color: 'var(--color-lit-3)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
              >
                <AlertTriangle className="w-4 h-4 flex-none" />
                {inviteError}
              </div>
            )}

            {friendsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-lit-3)' }} />
              </div>
            ) : invitableFriends.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-lit-3)' }}>
                {friends.length === 0
                  ? 'You haven\'t added any friends yet.'
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
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
                  >
                    <Avatar src={friend.avatar_url ?? undefined} name={friend.display_name || friend.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-lit">{friend.display_name || friend.username}</p>
                      <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{friend.username}</p>
                    </div>
                    {inviting === friend.id ? (
                      inviteSuccess
                        ? <Check className="w-4 h-4 flex-none" style={{ color: '#4ade80' }} />
                        : <Loader2 className="w-4 h-4 animate-spin flex-none" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <UserPlus className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
