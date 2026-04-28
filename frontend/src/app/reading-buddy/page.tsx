'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Check, MessageCircle, UserPlus } from 'lucide-react'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import type { ReadingBuddySession } from '@book-app/shared'
import Avatar from '@/components/Avatar'

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-grove)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: 'var(--color-accent)' }}
      />
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:  { label: 'Awaiting Response', color: 'var(--color-lit-3)',  dot: 'var(--color-lit-3)' },
  active:   { label: 'Reading Together',  color: '#4ade80',             dot: '#4ade80' },
  declined: { label: 'Declined',          color: 'var(--color-lit-3)',  dot: 'var(--color-lit-3)' },
  dnf:      { label: 'Did Not Finish',    color: 'var(--color-lit-3)',  dot: 'var(--color-lit-3)' },
}

function SessionCard({ session, userId }: { session: ReadingBuddySession; userId: number | undefined }) {
  const partner = session.initiator.id === userId ? session.invited : session.initiator
  const me      = session.initiator.id === userId ? session.initiator : session.invited
  const cfg     = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending
  const myPct   = me.progress?.completion_percentage ?? 0
  const ptnPct  = partner.progress?.completion_percentage ?? 0

  return (
    <Link
      href={`/reading-buddy/${session.id}`}
      className="block rounded-2xl p-5 transition-all hover:opacity-90 hover:translate-y-[-1px]"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: session.status === 'active' ? '1px solid rgba(212,175,55,0.2)' : '1px solid var(--color-rim)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'transform 0.15s, opacity 0.15s',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Cover */}
        {session.book.cover_image_url ? (
          <div className="flex-none w-12 h-[66px] rounded-lg overflow-hidden shadow-md">
            <img src={session.book.cover_image_url} alt={session.book.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex-none w-12 h-[66px] rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-grove)' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--color-lit-3)' }} />
          </div>
        )}

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-lit leading-tight line-clamp-1">{session.book.title}</p>
              {session.book.author_name && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-lit-3)' }}>
                  {session.book.author_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: cfg.dot }} />
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Partner */}
          <div className="flex items-center gap-2 mt-3">
            <Avatar src={partner.avatar_url ?? undefined} name={partner.display_name || partner.username} size="xs" />
            <span className="text-xs font-medium" style={{ color: 'var(--color-lit-3)' }}>
              with {partner.display_name || partner.username}
            </span>
          </div>

          {/* Progress — only show for active/completed sessions with data */}
          {session.status === 'active' && (
            <div className="mt-4 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-lit-3)' }}>
                  <span>You</span><span>{myPct}%</span>
                </div>
                <ProgressBar value={myPct} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-lit-3)' }}>
                  <span>{partner.display_name || partner.username}</span><span>{ptnPct}%</span>
                </div>
                <ProgressBar value={ptnPct} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ReadingBuddyIndexPage() {
  const { user } = useAuth()
  const { sessions, sessionsLoading, fetchSessions } = useReadingBuddy()

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const active   = sessions.filter(s => s.status === 'active')
  const pending  = sessions.filter(s => s.status === 'pending')
  const closed   = sessions.filter(s => s.status === 'declined' || s.status === 'dnf')

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-rim)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  }

  return (
    <div className="container-mobile py-10 pb-24 max-w-2xl space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-lit">Reading Buddy</h1>
        <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
          Read books together with friends and track each other's progress in real time.
        </p>
      </div>

      {sessionsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="rounded-3xl p-10 flex flex-col items-center text-center space-y-4"
          style={cardStyle}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-grove)' }}>
            <BookOpen className="w-8 h-8" style={{ color: 'var(--color-lit-3)' }} />
          </div>
          <div>
            <p className="font-bold text-lit text-lg">No sessions yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>
              Go to a book's page and invite a friend to read together.
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
          >
            <UserPlus className="w-4 h-4" />
            Find a Book
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-lit-3)' }}>
                  Active — {active.length}
                </h2>
              </div>
              {active.map(s => <SessionCard key={s.id} session={s} userId={user?.id} />)}
            </section>
          )}

          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" style={{ color: 'var(--color-lit-3)' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-lit-3)' }}>
                  Pending — {pending.length}
                </h2>
              </div>
              {pending.map(s => <SessionCard key={s.id} session={s} userId={user?.id} />)}
            </section>
          )}

          {closed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3" style={{ color: 'var(--color-lit-3)' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-lit-3)' }}>
                  Past — {closed.length}
                </h2>
              </div>
              {closed.map(s => <SessionCard key={s.id} session={s} userId={user?.id} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
