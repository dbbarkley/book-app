'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Users } from 'lucide-react'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import type { ReadingBuddySession } from '@book-app/shared'
import Avatar from '@/components/Avatar'

// ─── Mini progress comparison bar ────────────────────────────────────────────
function CompareBar({
  myPct,
  partnerPct,
  partnerName,
}: {
  myPct: number
  partnerPct: number
  partnerName: string
}) {
  const partnerFirstName = partnerName.split(' ')[0]
  const rows = [
    { label: 'You', pct: myPct, color: 'var(--color-accent)' },
    { label: partnerFirstName, pct: partnerPct, color: '#7B8EC4' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
      {rows.map(({ label, pct, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="truncate"
            style={{
              width: 38,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              color,
            }}
          >
            {label}
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(237,228,220,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(pct, 1)}%`,
                height: '100%',
                borderRadius: 2,
                backgroundColor: color,
                transition: 'width 0.8s cubic-bezier(0.32,0.72,0,1)',
              }}
            />
          </div>
          <span
            style={{ width: 28, fontSize: 11, fontWeight: 700, textAlign: 'right', color }}
          >
            {pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:  { label: 'Awaiting',        dot: 'rgba(237,224,196,0.4)',  text: 'rgba(237,224,196,0.55)' },
  active:   { label: 'Reading',         dot: '#5A9E7A',               text: '#5A9E7A' },
  declined: { label: 'Declined',        dot: 'rgba(237,224,196,0.3)', text: 'rgba(237,224,196,0.4)' },
  dnf:      { label: 'Did Not Finish',  dot: 'rgba(237,224,196,0.3)', text: 'rgba(237,224,196,0.4)' },
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  userId,
  index,
}: {
  session: ReadingBuddySession
  userId: number | undefined
  index: number
}) {
  const partner     = session.initiator.id === userId ? session.invited   : session.initiator
  const me          = session.initiator.id === userId ? session.initiator : session.invited
  const cfg         = STATUS[session.status as keyof typeof STATUS] ?? STATUS.pending
  const myPct       = me.progress?.completion_percentage      ?? 0
  const ptnPct      = partner.progress?.completion_percentage ?? 0
  const partnerName = partner.display_name || partner.username
  const isActive    = session.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.065,
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link href={`/reading-buddy/${session.id}`} className="block group">
        {/* Session card */}
        <div
          className="flex items-start"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            border: `1px solid ${isActive ? 'rgba(201,168,76,0.45)' : 'var(--color-rim)'}`,
            padding: 14,
            gap: 12,
            boxShadow: isActive
              ? '0 2px 12px rgba(0,0,0,0.2), 0 0 16px rgba(201,168,76,0.06)'
              : '0 2px 12px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
            {/* Book cover */}
            <div className="flex-none">
              {session.book.cover_image_url ? (
                <div
                  className="overflow-hidden group-hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    width: 64,
                    aspectRatio: '2/3',
                    borderRadius: 8,
                    boxShadow: '3px 5px 18px rgba(0,0,0,0.45)',
                  }}
                >
                  <img
                    src={session.book.cover_image_url}
                    alt={session.book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    aspectRatio: '2/3',
                    borderRadius: 8,
                    background: 'var(--color-grove)',
                    boxShadow: '3px 5px 18px rgba(0,0,0,0.4)',
                  }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: 'var(--color-lit-3)' }} />
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="font-serif font-semibold leading-snug line-clamp-1"
                    style={{ color: 'var(--color-lit)', fontSize: '0.9375rem' }}
                  >
                    {session.book.title}
                  </h3>
                  {session.book.author_name && (
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-lit-3)' }}>
                      {session.book.author_name}
                    </p>
                  )}
                </div>

                {/* Status pill */}
                <div
                  className="flex items-center gap-1.5 flex-none mt-0.5 px-2.5 py-1"
                  style={{
                    borderRadius: '999px',
                    background: 'rgba(237,224,196,0.05)',
                    border: '1px solid rgba(237,224,196,0.08)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-none"
                    style={{
                      backgroundColor: cfg.dot,
                      boxShadow: isActive ? `0 0 6px ${cfg.dot}` : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] font-bold tracking-wide whitespace-nowrap"
                    style={{ color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Partner row */}
              <div className="flex items-center gap-2">
                <Avatar src={partner.avatar_url ?? undefined} name={partnerName} size="xs" />
                <span className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>
                  with{' '}
                  <span className="font-medium" style={{ color: 'var(--color-lit-2)' }}>
                    {partnerName}
                  </span>
                </span>
              </div>

              {/* Progress — active sessions only */}
              {isActive && (
                <CompareBar myPct={myPct} partnerPct={ptnPct} partnerName={partnerName} />
              )}
            </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="animate-pulse flex items-start"
      style={{
        borderRadius: 16,
        padding: 14,
        gap: 12,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rim)',
      }}
    >
      <div style={{ width: 64, aspectRatio: '2/3', borderRadius: 8, background: 'var(--color-grove)', flexShrink: 0 }} />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 rounded-full w-3/4" style={{ background: 'var(--color-grove)' }} />
        <div className="h-3 rounded-full w-2/5" style={{ background: 'var(--color-grove)' }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--color-grove)' }} />
      </div>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 px-1 mb-3">
      <span
        className="text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-lit-3)' }}
      >
        {label}
      </span>
      <span
        className="px-2 py-0.5 text-[10px] font-bold rounded-full"
        style={{
          background: 'rgba(237,224,196,0.06)',
          color: 'var(--color-lit-3)',
          border: '1px solid rgba(237,224,196,0.09)',
        }}
      >
        {count}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-rim)' }} />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center pt-6 pb-6"
    >
      {/* Book cluster illustration */}
      <div className="relative mb-10" style={{ width: 120, height: 90 }}>
        {/* Left book */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 44,
            height: 64,
            borderRadius: '5px 2px 2px 5px',
            background: 'linear-gradient(160deg, var(--color-grove) 0%, var(--color-surface) 100%)',
            border: '1px solid rgba(237,224,196,0.08)',
            boxShadow: '3px 5px 18px rgba(0,0,0,0.4)',
            transform: 'rotate(-7deg)',
            transformOrigin: 'bottom center',
          }}
        />
        {/* Right book */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 40,
            height: 58,
            borderRadius: '5px 2px 2px 5px',
            background: 'linear-gradient(160deg, rgba(90,158,122,0.18) 0%, var(--color-surface) 100%)',
            border: '1px solid rgba(90,158,122,0.12)',
            boxShadow: '3px 5px 18px rgba(0,0,0,0.35)',
            transform: 'rotate(6deg)',
            transformOrigin: 'bottom center',
          }}
        />
        {/* Center book */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 0,
            width: 50,
            height: 74,
            borderRadius: '5px 2px 2px 5px',
            background: 'linear-gradient(160deg, rgba(201,168,76,0.22) 0%, var(--color-surface) 100%)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)',
            zIndex: 2,
          }}
        />
        {/* Badge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            background: 'var(--color-accent)',
            borderRadius: '999px',
            padding: '5px 6px',
            boxShadow: '0 0 18px rgba(201,168,76,0.35)',
          }}
        >
          <Users className="w-3 h-3" style={{ color: 'var(--color-accent-on)' }} />
        </div>
      </div>

      <p className="font-serif font-semibold text-xl mb-2" style={{ color: 'var(--color-lit)' }}>
        No reading buddies yet
      </p>
      <p
        className="text-sm leading-relaxed max-w-[260px] mb-8"
        style={{ color: 'var(--color-lit-3)' }}
      >
        Find a book, then invite a friend to read it alongside you.
      </p>

      <Link
        href="/search"
        className="group inline-flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm transition-all duration-200 active:scale-[0.97]"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-accent-on)',
          boxShadow: '0 4px 18px rgba(201,168,76,0.28)',
        }}
      >
        Browse books
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center flex-none group-hover:translate-x-0.5 transition-transform duration-200"
          style={{ background: 'rgba(26,18,5,0.2)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5h6M6 3l2 2-2 2"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReadingBuddyIndexPage() {
  const { user } = useAuth()
  const { sessions, sessionsLoading, fetchSessions } = useReadingBuddy()

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const active  = sessions.filter(s => s.status === 'active')
  const pending = sessions.filter(s => s.status === 'pending')
  const closed  = sessions.filter(s => s.status === 'declined' || s.status === 'dnf')

  return (
    <div className="container-mobile py-10 pb-28 max-w-xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full"
            style={{
              background: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              border: '1px solid rgba(201,168,76,0.18)',
            }}
          >
            Together · In sync
          </span>
        </div>

        <h1
          className="font-serif font-bold leading-[0.95] mb-3"
          style={{
            fontSize: 'clamp(2rem, 6vw, 2.75rem)',
            color: 'var(--color-lit)',
            letterSpacing: '-0.02em',
          }}
        >
          Reading Buddies
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-3)', maxWidth: '28ch' }}>
          Read with friends. Track progress. Discuss as you go.
        </p>
      </motion.div>

      {/* ── Content ───────────────────────────────────────────────── */}
      {sessionsLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">

          {active.length > 0 && (
            <section>
              <SectionLabel label="Active" count={active.length} />
              <div className="space-y-3">
                {active.map((s, i) => (
                  <SessionCard key={s.id} session={s} userId={user?.id} index={i} />
                ))}
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <section>
              <SectionLabel label="Pending" count={pending.length} />
              <div className="space-y-3">
                {pending.map((s, i) => (
                  <SessionCard key={s.id} session={s} userId={user?.id} index={active.length + i} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <SectionLabel label="Past" count={closed.length} />
              <div className="space-y-3">
                {closed.map((s, i) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    userId={user?.id}
                    index={active.length + pending.length + i}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
