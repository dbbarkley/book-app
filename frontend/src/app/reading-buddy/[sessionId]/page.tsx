'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Check,
  Clock,
  X,
  AlertTriangle,
  Loader2,
  BookOpen,
  MessageCircle,
  Highlighter,
  Pencil,
  ChevronLeft,
} from 'lucide-react'
import { useReadingBuddy, useAuth, apiClient } from '@book-app/shared'
import type { ReadingBuddyCableEvent } from '@book-app/shared'
import { ActionCableSubscription, buildCableUrl } from '@/lib/actioncable'
import Avatar from '@/components/Avatar'
import { BookCoverImage } from '@/components/BookCoverImage'
import HighlightCaptureModal from '@/components/reading-buddy/HighlightCaptureModal'

type MobileTab = 'progress' | 'highlights' | 'discussion'

// ─── Circular SVG progress ring ───────────────────────────────────────────────
function ProgressRing({
  pct,
  color,
  size = 72,
  stroke = 4,
}: {
  pct: number
  color: string
  size?: number
  stroke?: number
}) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-rim)"
        strokeWidth={stroke}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.32,0.72,0,1)' }}
      />
    </svg>
  )
}

// ─── Progress ring card (sidebar) ────────────────────────────────────────────
function ProgressRingCard({
  label,
  pct,
  pages,
  color,
  avatarSrc,
  isYou,
}: {
  label: string
  pct: number
  pages: number
  color: string
  avatarSrc?: string
  isYou?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring + center text */}
      <div className="relative" style={{ width: 72, height: 72 }}>
        <ProgressRing pct={pct} color={color} size={72} stroke={4} />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 1 }}
        >
          {isYou ? (
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color }}
            >
              {pct}%
            </span>
          ) : avatarSrc ? (
            <Avatar src={avatarSrc} name={label} size="xs" />
          ) : (
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color }}
            >
              {pct}%
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="text-center space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[72px]" style={{ color }}>
          {isYou ? 'You' : label}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--color-lit-3)' }}>
          {pct}%
          {pages > 0 && (
            <span className="ml-1 opacity-70">· {pages}p</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Highlight card ───────────────────────────────────────────────────────────
function HighlightCard({
  text,
  pageNumber,
  authorName,
  isMe,
  date,
}: {
  text: string
  pageNumber: number
  authorName: string
  isMe: boolean
  date: string
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: '14px',
        background: 'var(--color-grove)',
        border: '1px solid var(--color-rim)',
        borderLeft: `3px solid ${isMe ? 'var(--color-accent)' : 'var(--color-success)'}`,
      }}
    >
      {/* Subtle highlight tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isMe
            ? 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)'
            : 'linear-gradient(135deg, rgba(90,158,122,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative px-4 py-3.5 space-y-2.5">
        {/* Author + date row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold"
              style={{ color: isMe ? 'var(--color-accent)' : 'var(--color-success)' }}
            >
              {isMe ? 'You' : authorName}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-lit-3)' }}>
              · p. {pageNumber}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: 'var(--color-lit-3)' }}>
            {date}
          </span>
        </div>

        {/* Passage */}
        <blockquote
          className="font-serif text-sm leading-relaxed italic"
          style={{ color: 'var(--color-lit)' }}
        >
          &ldquo;{text}&rdquo;
        </blockquote>
      </div>
    </div>
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function ChatBubble({
  content,
  isMe,
  authorName,
  authorInitials,
  time,
}: {
  content: string
  isMe: boolean
  authorName: string
  authorInitials: string
  time: string
}) {
  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
      {/* Partner avatar */}
      {!isMe ? (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
          style={{ background: 'var(--color-success)', color: 'var(--color-canvas)' }}
        >
          {authorInitials}
        </div>
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}

      <div style={{ maxWidth: '72%' }}>
        {!isMe && (
          <p className="text-[10px] font-bold mb-1 ml-1" style={{ color: 'var(--color-success)' }}>
            {authorName}
            <span className="font-normal ml-2" style={{ color: 'var(--color-lit-3)' }}>
              {time}
            </span>
          </p>
        )}

        <div
          className="px-3.5 py-2.5 text-[13px] leading-relaxed"
          style={{
            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isMe ? 'var(--color-accent)' : 'var(--color-surface)',
            color: isMe ? 'var(--color-accent-on)' : 'var(--color-lit)',
            border: isMe ? 'none' : '1px solid var(--color-rim)',
            boxShadow: isMe ? '0 2px 12px rgba(201,168,76,0.2)' : '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          {content}
        </div>

        {isMe && (
          <p className="text-[10px] mt-1 text-right mr-1" style={{ color: 'var(--color-lit-3)' }}>
            {time}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Mobile tab bar ───────────────────────────────────────────────────────────
const MOBILE_TABS: { key: MobileTab; label: string; icon: React.ReactNode }[] = [
  { key: 'progress',   label: 'Progress',    icon: <BookOpen    size={13} /> },
  { key: 'highlights', label: 'Highlights',  icon: <Highlighter size={13} /> },
  { key: 'discussion', label: 'Discussion',  icon: <MessageCircle size={13} /> },
]

function MobileTabBar({
  active,
  onChange,
}: {
  active: MobileTab
  onChange: (t: MobileTab) => void
}) {
  return (
    <div
      className="flex-none flex items-center gap-1 px-3 py-2"
      style={{ borderBottom: '1px solid var(--color-rim)' }}
    >
      {MOBILE_TABS.map(tab => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.97]"
            style={{
              color: isActive ? 'var(--color-accent)' : 'var(--color-lit-3)',
              background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
              border: isActive ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReadingBuddySessionPage() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = parseInt(params.sessionId as string, 10)

  const { user } = useAuth()
  const {
    activeSession, messages, highlights,
    sessionLoading, sessionError,
    fetchSession, clearActiveSession,
    acceptSession, declineSession, dnfSession,
    sendMessage, createHighlight, handleCableEvent,
  } = useReadingBuddy()

  const [messageText, setMessageText]               = useState('')
  const [sending, setSending]                       = useState(false)
  const [actionLoading, setActionLoading]           = useState<string | null>(null)
  const [showDnfConfirm, setShowDnfConfirm]         = useState(false)
  const [mobileTab, setMobileTab]                   = useState<MobileTab>('progress')
  const [showHighlightModal, setShowHighlightModal] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const cableRef  = useRef<ActionCableSubscription | null>(null)

  useEffect(() => {
    if (!isNaN(sessionId)) fetchSession(sessionId)
    return () => clearActiveSession()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (activeSession?.status !== 'active') return
    const token = apiClient.getToken()
    if (!token) return
    cableRef.current?.unsubscribe()
    cableRef.current = new ActionCableSubscription(buildCableUrl(token), {
      channelName:    'ReadingBuddyChannel',
      params:         { session_id: sessionId },
      onConnected:    () => {},
      onDisconnected: () => {},
      onMessage:      (data) => handleCableEvent(data as ReadingBuddyCableEvent),
    })
    return () => { cableRef.current?.unsubscribe(); cableRef.current = null }
  }, [activeSession?.status, sessionId])

  const handleSend = async () => {
    const content = messageText.trim()
    if (!content || sending) return
    setSending(true)
    setMessageText('')
    try { await sendMessage(sessionId, content) }
    catch { setMessageText(content) }
    finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleAccept = async () => {
    setActionLoading('accept')
    try { await acceptSession(sessionId) } finally { setActionLoading(null) }
  }

  const handleDecline = async () => {
    setActionLoading('decline')
    try { await declineSession(sessionId); router.push('/reading-buddy') }
    finally { setActionLoading(null) }
  }

  const handleDnf = async () => {
    setActionLoading('dnf')
    setShowDnfConfirm(false)
    try { await dnfSession(sessionId) } finally { setActionLoading(null) }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-lit-3)' }} />
      </div>
    )
  }

  // ── Error / Not Found ────────────────────────────────────────────────────────
  if (sessionError || !activeSession) {
    return (
      <div className="container-mobile py-24 text-center max-w-md mx-auto space-y-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'var(--color-grove)' }}
        >
          <BookOpen className="w-8 h-8" style={{ color: 'var(--color-lit-3)' }} />
        </div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-lit)' }}>
          Session not found
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
          {sessionError || "This session doesn't exist or you're not a participant."}
        </p>
        <Link
          href="/reading-buddy"
          className="inline-flex items-center gap-1.5 text-sm font-bold mt-4"
          style={{ color: 'var(--color-accent)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          All sessions
        </Link>
      </div>
    )
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const session      = activeSession
  const partner      = session.initiator.id === user?.id ? session.invited   : session.initiator
  const me           = session.initiator.id === user?.id ? session.initiator : session.invited
  const isActive     = session.status === 'active'
  const isPending    = session.status === 'pending'
  const isClosed     = session.status === 'declined' || session.status === 'dnf'
  const isInvited    = session.invited.id === user?.id

  const myPct        = me.progress?.completion_percentage      ?? 0
  const myPages      = me.progress?.pages_read                 ?? 0
  const partnerPct   = partner.progress?.completion_percentage ?? 0
  const partnerPages = partner.progress?.pages_read            ?? 0
  const partnerName  = partner.display_name || partner.username
  const partnerInitials = partnerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  // Group highlights by page
  const highlightsByPage = highlights.reduce<Record<number, typeof highlights>>((acc, h) => {
    if (!acc[h.page_number]) acc[h.page_number] = []
    acc[h.page_number].push(h)
    return acc
  }, {})
  const sortedPages = Object.keys(highlightsByPage).map(Number).sort((a, b) => a - b)

  // ── Status banner ────────────────────────────────────────────────────────────
  const StatusBanner = () => {
    if (isPending && isInvited) return (
      <div
        className="flex-none px-4 py-4"
        style={{ borderBottom: '1px solid var(--color-rim)' }}
      >
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 28px rgba(201,168,76,0.06)',
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-none"
              style={{ background: 'var(--color-accent-subtle)' }}
            >
              <BookOpen className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-lit)' }}>
                {session.initiator.display_name || session.initiator.username} wants to read with you
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>
                Track progress and chat as you read together.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleAccept}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
            >
              {actionLoading === 'accept'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />
              }
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
              style={{
                background: 'var(--color-grove)',
                border: '1px solid var(--color-rim)',
                color: 'var(--color-lit-3)',
              }}
            >
              {actionLoading === 'decline'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <X className="w-4 h-4" />
              }
              Decline
            </button>
          </div>
        </div>
      </div>
    )

    if (isPending && !isInvited) return (
      <div className="flex-none px-4 py-3" style={{ borderBottom: '1px solid var(--color-rim)' }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--color-grove)', border: '1px dashed rgba(237,224,196,0.12)' }}
        >
          <Clock className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
            Waiting for {partnerName} to respond…
          </p>
        </div>
      </div>
    )

    if (isClosed) return (
      <div className="flex-none px-4 py-3" style={{ borderBottom: '1px solid var(--color-rim)' }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
        >
          <AlertTriangle className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
            {session.status === 'declined' ? 'This invite was declined.' : 'This session ended as Did Not Finish.'}
          </p>
        </div>
      </div>
    )

    return null
  }

  // ── Highlights content ───────────────────────────────────────────────────────
  const HighlightsContent = () => {
    if (highlights.length === 0) {
      return (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'var(--color-grove)' }}
          >
            <Highlighter className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
          </div>
          <p className="font-serif text-base font-semibold mb-1.5" style={{ color: 'var(--color-lit)' }}>
            No highlights yet
          </p>
          <p className="text-sm leading-relaxed max-w-[220px] mb-5" style={{ color: 'var(--color-lit-3)' }}>
            Capture passages as you read — they&apos;ll appear here alongside {partnerName}&apos;s.
          </p>
          {isActive && (
            <button
              onClick={() => setShowHighlightModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 active:scale-[0.97]"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
            >
              <Pencil className="w-3 h-3" />
              Add first highlight
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-5 pb-4">
        {sortedPages.map(pageNum => (
          <div key={pageNum}>
            {/* Page divider */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex-none"
                style={{
                  background: 'var(--color-grove)',
                  color: 'var(--color-lit-3)',
                  border: '1px solid var(--color-rim)',
                }}
              >
                Page {pageNum}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-rim)' }} />
            </div>

            <div className="space-y-2.5">
              {highlightsByPage[pageNum].map(h => (
                <HighlightCard
                  key={h.id}
                  text={h.highlighted_text}
                  pageNumber={h.page_number}
                  authorName={h.user.display_name || h.user.username}
                  isMe={h.user.id === user?.id}
                  date={new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Discussion content ───────────────────────────────────────────────────────
  const DiscussionContent = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12 space-y-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-grove)' }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
              {isActive
                ? 'No messages yet — start the conversation.'
                : 'Chat unlocks once both of you accept.'}
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user?.id
            const name = msg.user.display_name || msg.user.username
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                isMe={isMe}
                authorName={name}
                authorInitials={initials}
                time={new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isActive && (
        <div className="flex-none px-3 py-3" style={{ borderTop: '1px solid var(--color-rim)' }}>
          <div
            className="flex items-end gap-2.5 px-3 py-2"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              borderRadius: '18px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something about the book…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none py-1.5 font-serif italic"
              style={{
                color: 'var(--color-lit)',
                maxHeight: 120,
                lineHeight: 1.5,
                caretColor: 'var(--color-accent)',
              }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="flex-none w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.93] disabled:opacity-30"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
            >
              {sending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // ── Progress sidebar content ─────────────────────────────────────────────────
  const ProgressContent = () => (
    <div className="h-full overflow-y-auto">

      {/* Book header */}
      <div
        className="flex items-start gap-4 px-5 py-5"
        style={{ borderBottom: '1px solid var(--color-rim)' }}
      >
        <Link href={`/books/${session.book.id}`} className="flex-none group">
          <div
            className="overflow-hidden group-hover:scale-[1.02] transition-transform duration-300"
            style={{
              width: 72,
              aspectRatio: '2/3',
              borderRadius: '6px 3px 3px 6px',
              boxShadow: '4px 6px 24px rgba(0,0,0,0.6), inset -3px 0 6px rgba(0,0,0,0.35)',
            }}
          >
            <BookCoverImage
              src={session.book.cover_image_url}
              title={session.book.title}
              author={session.book.author_name ?? undefined}
              size="medium"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0 pt-0.5">
          <h1
            className="font-serif font-semibold leading-snug"
            style={{ color: 'var(--color-lit)', fontSize: '1rem' }}
          >
            {session.book.title}
          </h1>
          {session.book.author_name && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-lit-3)' }}>
              {session.book.author_name}
            </p>
          )}
          {/* Partner badge */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <Avatar src={partner.avatar_url ?? undefined} name={partnerName} size="xs" />
            <span className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>
              with{' '}
              <span className="font-medium" style={{ color: 'var(--color-lit-2)' }}>
                {partnerName}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress rings */}
      <div className="px-5 py-6 space-y-4">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--color-lit-3)' }}
        >
          Reading Progress
        </p>

        <div className="flex items-start justify-around">
          <ProgressRingCard
            label="You"
            pct={myPct}
            pages={myPages}
            color="var(--color-accent)"
            isYou
          />
          <div className="flex-none w-px self-stretch mx-2" style={{ background: 'var(--color-rim)' }} />
          <ProgressRingCard
            label={partnerName}
            pct={partnerPct}
            pages={partnerPages}
            color="var(--color-success)"
            avatarSrc={partner.avatar_url ?? undefined}
          />
        </div>

        {/* Who's ahead */}
        {isActive && (myPct > 0 || partnerPct > 0) && (
          <div
            className="text-center pt-2 pb-1"
          >
            {myPct > partnerPct ? (
              <p className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>
                You&apos;re ahead by{' '}
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  {myPct - partnerPct}%
                </span>
              </p>
            ) : partnerPct > myPct ? (
              <p className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                  {partnerName.split(' ')[0]}
                </span>{' '}
                is ahead by{' '}
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                  {partnerPct - myPct}%
                </span>
              </p>
            ) : myPct > 0 ? (
              <p className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>
                You&apos;re at the same spot
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* DNF option for active sessions */}
      {isActive && (
        <div className="px-5 pb-6">
          <div className="h-px mb-5" style={{ background: 'var(--color-rim)' }} />
          <button
            onClick={() => setShowDnfConfirm(true)}
            className="w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.97]"
            style={{
              background: 'var(--color-grove)',
              border: '1px solid var(--color-rim)',
              color: 'var(--color-lit-3)',
            }}
          >
            Mark as Did Not Finish
          </button>
        </div>
      )}
    </div>
  )

  // ── Panel wrapper ─────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-rim)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const panelHeaderStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--color-rim)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      <StatusBanner />

      {/* ── Desktop 3-col grid (lg+) ────────────────────────────── */}
      <div
        className="flex-1 min-h-0 hidden lg:grid gap-3 p-3"
        style={{
          gridTemplateColumns: '320px 1fr 1fr',
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* LEFT: Progress sidebar */}
        <aside style={panelStyle}>
          <ProgressContent />
        </aside>

        {/* CENTER: Highlights */}
        <main style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div className="flex items-center gap-2.5 font-serif text-sm font-medium" style={{ color: 'var(--color-lit)' }}>
              <Highlighter className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              Highlights
              {highlights.length > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
                  style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
                >
                  {highlights.length}
                </span>
              )}
            </div>
            {isActive && (
              <button
                onClick={() => setShowHighlightModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold transition-opacity duration-150 hover:opacity-70 active:scale-[0.97]"
                style={{ color: 'var(--color-accent)' }}
              >
                <Pencil className="w-3 h-3" />
                Add
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <HighlightsContent />
          </div>
        </main>

        {/* RIGHT: Discussion */}
        <aside style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div className="flex items-center gap-2.5 font-serif text-sm font-medium" style={{ color: 'var(--color-lit)' }}>
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
              Discussion
            </div>
            {messages.length > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-grove)', color: 'var(--color-lit-3)' }}
              >
                {messages.length}
              </span>
            )}
          </div>
          <DiscussionContent />
        </aside>
      </div>

      {/* ── Mobile layout (< lg) ────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
        <MobileTabBar active={mobileTab} onChange={setMobileTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={mobileTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            {mobileTab === 'progress' && (
              <div className="h-full">
                <ProgressContent />
              </div>
            )}

            {mobileTab === 'highlights' && (
              <div className="h-full overflow-y-auto">
                {isActive && highlights.length > 0 && (
                  <div className="flex justify-end px-4 pt-4 pb-1">
                    <button
                      onClick={() => setShowHighlightModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-[0.97]"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                    >
                      <Pencil className="w-3 h-3" />
                      Add highlight
                    </button>
                  </div>
                )}
                <div className="px-4 py-4">
                  <HighlightsContent />
                </div>
              </div>
            )}

            {mobileTab === 'discussion' && (
              <div className="flex flex-col h-full overflow-hidden">
                <DiscussionContent />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Highlight Capture Modal ─────────────────────────────── */}
      {showHighlightModal && (
        <HighlightCaptureModal
          sessionId={sessionId}
          bookTitle={session.book.title}
          pageCount={(session.book as any).page_count ?? undefined}
          onClose={() => setShowHighlightModal(false)}
          onSave={async (payload) => {
            const highlight = await createHighlight(sessionId, payload)
            setShowHighlightModal(false)
            return highlight
          }}
        />
      )}

      {/* ── DNF Confirm Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showDnfConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowDnfConfirm(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm p-6 space-y-4"
              style={{
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-rim)',
                borderRadius: '24px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              <h3 className="font-serif text-xl font-bold" style={{ color: 'var(--color-lit)' }}>
                Mark as Did Not Finish?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-3)' }}>
                This closes the session. Your chat history and highlights stay intact.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowDnfConfirm(false)}
                  className="flex-1 py-3 font-bold text-sm rounded-xl transition-all duration-150 active:scale-[0.97]"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                >
                  Keep reading
                </button>
                <button
                  onClick={handleDnf}
                  disabled={actionLoading === 'dnf'}
                  className="flex-1 py-3 font-bold text-sm rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit-3)',
                  }}
                >
                  {actionLoading === 'dnf'
                    ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : 'DNF it'
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
