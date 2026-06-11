'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Check, X } from 'lucide-react'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import type { ReadingBuddySession } from '@book-app/shared'
import Avatar from '@/components/Avatar'
import NewReadingBuddyModal from '@/components/reading-buddy/NewReadingBuddyModal'

function timeAgo(date: Date | string): string {
  const d    = typeof date === 'string' ? new Date(date) : date
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)       return 'JUST NOW'
  if (diff < 3600)     return `${Math.floor(diff / 60)}M AGO`
  if (diff < 86400)    return `${Math.floor(diff / 3600)}H AGO`
  if (diff < 172800)   return 'YESTERDAY'
  if (diff < 2592000)  return `${Math.floor(diff / 86400)}D AGO`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}MO AGO`
  return `${Math.floor(diff / 31536000)}Y AGO`
}

// ─── Pending invite card ─────────────────────────────────────────────────────
function PendingInviteCard({ session, userId, index, onAccept, onDecline, onCancel, loading }: {
  session:   ReadingBuddySession
  userId:    number | undefined
  index:     number
  onAccept:  (id: number) => Promise<void>
  onDecline: (id: number) => Promise<void>
  onCancel:  (id: number) => Promise<void>
  loading:   number | null
}) {
  const isInitiator = session.is_initiator
  const partner     = isInitiator ? session.invited : session.initiator
  const partnerName = partner.display_name || partner.username

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{
        backgroundColor: 'var(--color-accent-yellow)',
        border: '2px solid var(--color-ink)',
        borderRadius: 18,
        boxShadow: '4px 4px 0px var(--color-ink)',
        overflow: 'hidden',
        display: 'flex',
      }}>
        {/* Book cover — full height left strip */}
        <div style={{
          width: 72, flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          borderRight: '2px solid var(--color-ink)',
        }}>
          {session.book.cover_image_url ? (
            <img
              src={session.book.cover_image_url}
              alt={session.book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 180,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(26,26,26,0.15)',
            }}>
              <BookOpen style={{ width: 22, height: 22, color: 'rgba(26,26,26,0.4)' }} />
            </div>
          )}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, padding: '16px 18px 16px', minWidth: 0 }}>

          {/* Top row: partner + time ago */}
          <div className="flex items-start justify-between gap-3" style={{ marginBottom: 10 }}>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={partner.avatar_url ?? undefined} name={partnerName} size="xs" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                {partnerName}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(26,26,26,0.55)', whiteSpace: 'nowrap' }}>
                {isInitiator ? 'invited to buddy read' : 'wants to buddy read'}
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(26,26,26,0.45)', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
              · {timeAgo(session.created_at)}
            </span>
          </div>

          {/* Book title + author */}
          <h3 className="font-serif font-black leading-tight" style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
            color: 'var(--color-ink)',
            marginBottom: 2,
          }}>
            {session.book.title}
          </h3>
          {session.book.author_name && (
            <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.55)', marginBottom: 12 }}>
              {session.book.author_name}
            </p>
          )}

          {/* Note / invite message */}
          {session.invite_message && (
            <div style={{
              border: '1.5px dashed rgba(26,26,26,0.35)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}>
              <p className="font-serif" style={{
                fontSize: 13, fontStyle: 'italic', lineHeight: 1.55,
                color: 'rgba(26,26,26,0.75)',
              }}>
                &ldquo;{session.invite_message}&rdquo;
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: session.invite_message ? 0 : 4 }}>
            {!isInitiator ? (
              <>
                <button
                  onClick={() => onAccept(session.id)}
                  disabled={loading === session.id}
                  className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    fontSize: 11, letterSpacing: '0.13em',
                    backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)',
                    border: '2px solid var(--color-ink)', borderRadius: 999,
                    padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  <Check style={{ width: 12, height: 12 }} />
                  Accept · Start Reading
                </button>
                <button
                  onClick={() => onDecline(session.id)}
                  disabled={loading === session.id}
                  className="font-bold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    fontSize: 11, letterSpacing: '0.13em',
                    backgroundColor: 'transparent', color: 'var(--color-ink)',
                    border: '2px solid var(--color-ink)', borderRadius: 999,
                    padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                onClick={() => onCancel(session.id)}
                disabled={loading === session.id}
                className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  fontSize: 11, letterSpacing: '0.13em',
                  backgroundColor: 'transparent', color: 'var(--color-ink)',
                  border: '2px solid var(--color-ink)', borderRadius: 999,
                  padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <X style={{ width: 12, height: 12 }} />
                Cancel invite
              </button>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  )
}

// ─── Mini progress ring ───────────────────────────────────────────────────────
function MiniRing({ pct, color, size = 72, stroke = 6 }: {
  pct: number; color: string; size?: number; stroke?: number
}) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.32,0.72,0,1)' }} />
    </svg>
  )
}

// ─── Active session hero card ─────────────────────────────────────────────────
function ActiveSessionHero({ sessions, userId }: { sessions: ReadingBuddySession[]; userId: number | undefined }) {
  const [idx, setIdx] = useState(0)
  const session     = sessions[Math.min(idx, sessions.length - 1)]
  const partner     = session.initiator.id === userId ? session.invited   : session.initiator
  const me          = session.initiator.id === userId ? session.initiator : session.invited
  const myPct       = me.progress?.completion_percentage      ?? 0
  const partnerPct  = partner.progress?.completion_percentage ?? 0
  const partnerName = partner.display_name || partner.username

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.23, 1, 0.32, 1] }}
    >
      <div style={{
        position: 'relative', overflow: 'hidden',
        backgroundColor: 'var(--color-accent-teal)',
        border: '2px solid var(--color-ink)',
        borderRadius: 20,
        boxShadow: '5px 5px 0px var(--color-ink)',
        padding: '28px 32px',
        marginBottom: 32,
      }}>
        {/* Glows */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
          background: 'radial-gradient(ellipse at top right, rgba(213,88,46,0.38) 0%, transparent 62%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: 0, width: '40%', height: '70%',
          background: 'radial-gradient(ellipse at bottom left, rgba(241,199,91,0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          {/* Main row */}
          <div className="flex items-start gap-6 flex-wrap">

            {/* Book cover */}
            <Link href={`/reading-buddy/${session.id}`} className="flex-none transition-opacity hover:opacity-80">
              <div style={{
                width: 80, aspectRatio: '2/3',
                borderRadius: '4px 2px 2px 4px',
                overflow: 'hidden',
                boxShadow: '4px 5px 20px rgba(0,0,0,0.6), inset -2px 0 4px rgba(0,0,0,0.35)',
              }}>
                {session.book.cover_image_url ? (
                  <img src={session.book.cover_image_url} alt={session.book.title} className="w-full h-full object-cover" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen className="w-5 h-5" style={{ color: 'rgba(250,246,235,0.4)' }} />
                  </div>
                )}
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Sticker */}
              <div style={{ marginBottom: 10, display: 'inline-block', transform: 'rotate(-2deg)' }}>
                <span className="font-bold uppercase" style={{
                  fontSize: 9, letterSpacing: '0.22em',
                  color: '#1A1A1A', backgroundColor: '#F1C75B',
                  border: '1.5px solid #1A1A1A', borderRadius: 4,
                  padding: '2px 7px', display: 'inline-block',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}>
                  Active Session
                </span>
              </div>

              <h2 className="font-serif font-black" style={{
                fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
                color: '#FAF6EB', lineHeight: 1.1, marginBottom: 6,
              }}>
                {session.book.title}
              </h2>

              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 18 }}>
                {session.book.author_name && (
                  <span style={{ fontSize: 12, color: 'rgba(250,246,235,0.5)' }}>{session.book.author_name}</span>
                )}
                {session.book.author_name && (
                  <span style={{ fontSize: 12, color: 'rgba(250,246,235,0.25)' }}>·</span>
                )}
                <Avatar src={partner.avatar_url ?? undefined} name={partnerName} size="xs" />
                <span style={{ fontSize: 12, color: 'rgba(250,246,235,0.5)' }}>
                  with <span style={{ color: '#FAF6EB', fontWeight: 600 }}>{partnerName}</span>
                </span>
              </div>

              {/* Rings + CTA */}
              <div className="flex items-center gap-5 flex-wrap">

                {/* My ring */}
                <div className="flex flex-col items-center gap-1.5">
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <MiniRing pct={myPct} color="#F1C75B" />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="font-black tabular-nums" style={{ fontSize: 18, color: '#F1C75B', lineHeight: 1 }}>
                        {myPct}%
                      </span>
                    </div>
                  </div>
                  <span className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.16em', color: '#F1C75B' }}>You</span>
                </div>

                {/* Partner ring */}
                <div className="flex flex-col items-center gap-1.5">
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <MiniRing pct={partnerPct} color="rgba(250,246,235,0.7)" />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="font-black tabular-nums" style={{ fontSize: 18, color: 'rgba(250,246,235,0.85)', lineHeight: 1 }}>
                        {partnerPct}%
                      </span>
                    </div>
                  </div>
                  <span className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'rgba(250,246,235,0.5)' }}>
                    {partnerName.split(' ')[0]}
                  </span>
                </div>

                {/* Jump in CTA */}
                <Link
                  href={`/reading-buddy/${session.id}`}
                  className="font-bold uppercase transition-opacity hover:opacity-80"
                  style={{
                    fontSize: 11, letterSpacing: '0.14em',
                    border: '2px solid #1A1A1A', borderRadius: 999,
                    padding: '10px 22px', whiteSpace: 'nowrap',
                    backgroundColor: '#F1C75B', color: '#1A1A1A',
                    boxShadow: '3px 3px 0px #1A1A1A',
                    display: 'inline-block', marginLeft: 4,
                  }}
                >
                  Jump in →
                </Link>
              </div>
            </div>
          </div>

          {/* Session switcher — only when multiple active sessions */}
          {sessions.length > 1 && (
            <div style={{
              marginTop: 22, paddingTop: 18,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              <span className="font-bold uppercase self-center" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(250,246,235,0.35)', marginRight: 4 }}>
                Also active:
              </span>
              {sessions.map((s, i) => (
                i !== idx && (
                  <button
                    key={s.id}
                    onClick={() => setIdx(i)}
                    className="flex items-center gap-2 transition-all hover:opacity-80"
                    style={{
                      padding: '7px 12px', borderRadius: 10,
                      background: 'rgba(0,0,0,0.2)',
                      border: '1.5px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                    }}
                  >
                    {s.book.cover_image_url ? (
                      <img src={s.book.cover_image_url} alt={s.book.title}
                        style={{ width: 18, height: 27, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 18, height: 27, borderRadius: 2, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    )}
                    <span className="font-bold" style={{
                      fontSize: 11, color: 'rgba(250,246,235,0.55)',
                      maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.book.title}
                    </span>
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Past sessions section ────────────────────────────────────────────────────
function StarRating({ rating }: { rating?: number | null }) {
  const filled = rating ? Math.round(rating) : 0
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: 13, color: n <= filled ? 'var(--color-accent)' : 'rgba(213,88,46,0.2)' }}>★</span>
      ))}
    </div>
  )
}

function PastSessionsSection({ sessions, userId }: { sessions: ReadingBuddySession[]; userId: number | undefined }) {
  const uniquePartners = new Set(
    sessions.map(s => (s.is_initiator ? s.invited.id : s.initiator.id))
  ).size

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '2px solid var(--color-ink)',
        borderRadius: 20,
        boxShadow: '5px 5px 0px var(--color-ink)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 2, backgroundColor: '#2D6A4F', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: '#2D6A4F', textTransform: 'uppercase' }}>
                Finished Together
              </span>
            </div>
            <h2 className="font-serif font-black" style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.7rem)', color: 'var(--color-ink)', lineHeight: 1 }}>
              Past sessions
            </h2>
          </div>
          {sessions.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-ink-3)', whiteSpace: 'nowrap' }}>
              {sessions.length} BOOK{sessions.length !== 1 ? 'S' : ''} · {uniquePartners} FRIEND{uniquePartners !== 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {/* Session cards */}
        {sessions.length > 0 ? (
          <div style={{
            padding: '0 24px 24px',
            display: 'flex', gap: 12,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {sessions.map(s => {
              const partner     = s.is_initiator ? s.invited : s.initiator
              const me          = s.is_initiator ? s.initiator : s.invited
              const partnerName = partner.display_name || partner.username
              const rating      = me.progress?.rating

              return (
                <Link
                  key={s.id}
                  href={`/reading-buddy/${s.id}`}
                  style={{ flexShrink: 0, display: 'block', width: 220 }}
                  className="transition-opacity hover:opacity-75"
                >
                  <div style={{
                    border: '2px solid var(--color-ink)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    backgroundColor: 'var(--color-canvas)',
                  }}>
                    {/* Book cover */}
                    <div style={{
                      width: 52, aspectRatio: '2/3', flexShrink: 0,
                      borderRadius: 6, overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.18)',
                      boxShadow: '2px 3px 8px rgba(0,0,0,0.25)',
                    }}>
                      {s.book.cover_image_url ? (
                        <img src={s.book.cover_image_url} alt={s.book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-cave)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen style={{ width: 16, height: 16, color: 'var(--color-ink-3)' }} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-serif font-bold leading-snug line-clamp-2" style={{ fontSize: 14, color: 'var(--color-ink)', marginBottom: 4 }}>
                        {s.book.title}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                        with{' '}
                        <span style={{ color: 'var(--color-ink-2)', fontWeight: 700 }}>
                          {partnerName.split(' ')[0]}
                        </span>
                        {' · '}
                        {formatDate(s.updated_at)}
                      </p>
                      <StarRating rating={rating} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* Empty state */
          <div style={{ padding: '0 24px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.6 }}>
              No finished sessions yet —{' '}
              <span style={{ color: 'var(--color-ink-2)', fontStyle: 'italic' }}>
                start a buddy read above and finish your first book together.
              </span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse flex items-center gap-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-rim)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ width: 48, aspectRatio: '2/3', borderRadius: 6, backgroundColor: 'var(--color-cave)', flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-cave)' }} />
        <div className="h-2.5 rounded-full w-2/5" style={{ backgroundColor: 'var(--color-cave)' }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReadingBuddyIndexPage() {
  const { user }                                                        = useAuth()
  const { sessions, sessionsLoading, fetchSessions, acceptSession, declineSession, cancelSession } = useReadingBuddy()
  const [actionLoading, setActionLoading]   = useState<number | null>(null)
  const [showNewModal, setShowNewModal]     = useState(false)

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const active   = sessions.filter(s => s.status === 'active')
  const pending  = sessions.filter(s => s.status === 'pending')
  const finished = sessions.filter(s => s.status === 'declined' || s.status === 'dnf')

  async function handleAccept(id: number) {
    setActionLoading(id)
    try { await acceptSession(id) } finally { setActionLoading(null) }
  }
  async function handleDecline(id: number) {
    setActionLoading(id)
    try { await declineSession(id) } finally { setActionLoading(null) }
  }
  async function handleCancel(id: number) {
    setActionLoading(id)
    try { await cancelSession(id) } finally { setActionLoading(null) }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <div
          className="container-mobile flex items-end justify-between gap-8 flex-wrap"
          style={{ paddingTop: 52, paddingBottom: 40, borderBottom: '2px solid var(--color-ink)' }}
        >
          {/* Left: copy */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
              <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
              <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent)' }}>
                Reading Together
              </span>
            </div>
            <h1
              className="font-serif font-black"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', color: 'var(--color-ink)', lineHeight: 0.95, marginBottom: 20 }}
            >
              Reading{' '}
              <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>buddies.</span>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65, maxWidth: '46ch' }}>
              Pick a book, invite a friend, and share the journey — page by page,
              highlight by highlight.
            </p>
          </div>

          {/* Right: status pills */}
          {!sessionsLoading && sessions.length > 0 && (
            <div className="flex items-center gap-2 flex-none flex-wrap" style={{ paddingBottom: 2 }}>
              {active.length > 0 && (
                <span className="font-bold uppercase" style={{
                  fontSize: 11, letterSpacing: '0.14em',
                  border: '2px solid var(--color-ink)', borderRadius: 999,
                  padding: '9px 16px', whiteSpace: 'nowrap',
                  backgroundColor: 'var(--color-accent)', color: '#FAF6EB',
                  boxShadow: '2px 2px 0px var(--color-ink)',
                }}>
                  {active.length} Active
                </span>
              )}
              {pending.length > 0 && (
                <span className="font-bold uppercase" style={{
                  fontSize: 11, letterSpacing: '0.14em',
                  border: '2px solid var(--color-ink)', borderRadius: 999,
                  padding: '9px 16px', whiteSpace: 'nowrap',
                  backgroundColor: 'var(--color-accent-yellow)', color: 'var(--color-ink)',
                  boxShadow: '2px 2px 0px var(--color-ink)',
                }}>
                  {pending.length} Pending
                </span>
              )}
              {finished.length > 0 && (
                <span className="font-bold uppercase" style={{
                  fontSize: 11, letterSpacing: '0.14em',
                  border: '2px solid var(--color-ink)', borderRadius: 999,
                  padding: '9px 16px', whiteSpace: 'nowrap',
                  backgroundColor: 'transparent', color: 'var(--color-ink)',
                }}>
                  {finished.length} Finished
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <div className="container-mobile py-10 pb-28">

        {sessionsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div>

            {/* Active session hero */}
            {active.length > 0 && (
              <ActiveSessionHero sessions={active} userId={user?.id} />
            )}

            <div className="space-y-8">

              {/* Pending invites — always visible */}
              <section>
                <div className="flex items-baseline gap-3 px-1 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      {pending.some(s => !s.is_initiator) ? 'Asking' : 'Invites'}
                    </span>
                  </div>
                  <h2 className="font-serif font-black" style={{ fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)', color: 'var(--color-ink)', lineHeight: 1 }}>
                    Pending invites
                  </h2>
                  {pending.filter(s => !s.is_initiator).length > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--color-ink-2)',
                      backgroundColor: 'var(--color-cave)',
                      border: '1.5px solid var(--color-rim)',
                      borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap',
                    }}>
                      {pending.filter(s => !s.is_initiator).length} waiting on you
                    </span>
                  )}
                </div>

                {/* Horizontal scroll row — each card 50% wide, "New" card always last */}
                <div style={{
                  display: 'flex',
                  gap: 14,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: 6,
                }}>
                  {pending.map((s, i) => (
                    <div key={s.id} style={{ flexShrink: 0, width: 'calc(50% - 7px)', minWidth: 300 }}>
                      <PendingInviteCard
                        session={s}
                        userId={user?.id}
                        index={i}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        onCancel={handleCancel}
                        loading={actionLoading}
                      />
                    </div>
                  ))}

                  {/* Always-last: start a new buddy read */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: pending.length * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setShowNewModal(true)}
                    className="text-left transition-opacity hover:opacity-75"
                    style={{
                      flexShrink: 0,
                      width: 'calc(50% - 7px)',
                      minWidth: 300,
                      border: '2px dashed var(--color-rim)',
                      borderRadius: 16,
                      padding: '22px 24px 24px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      border: '2px dashed var(--color-rim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 18,
                    }}>
                      <span style={{ fontSize: 24, lineHeight: 1, color: 'var(--color-ink-3)', fontWeight: 300 }}>+</span>
                    </div>
                    <p className="font-serif font-bold" style={{ fontSize: 18, color: 'var(--color-ink)', marginBottom: 4 }}>
                      Start a new buddy read
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                      Pick a book. Pick a friend. Pick a pace.
                    </p>
                  </motion.button>
                </div>
              </section>

              {/* Past sessions */}
              <PastSessionsSection sessions={finished} userId={user?.id} />

            </div>
          </div>
        )}
      </div>

      {/* ── New Reading Buddy Modal ── */}
      {showNewModal && <NewReadingBuddyModal onClose={() => setShowNewModal(false)} />}

    </div>
  )
}
