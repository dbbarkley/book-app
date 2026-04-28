'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send,
  Check,
  Clock,
  X,
  AlertTriangle,
  Loader2,
  BookOpen,
  MessageCircle,
  Bookmark,
  Highlighter,
  Pencil,
} from 'lucide-react'
import { useReadingBuddy, useAuth, apiClient } from '@book-app/shared'
import type { ReadingBuddyCableEvent } from '@book-app/shared'
import { ActionCableSubscription, buildCableUrl } from '@/lib/actioncable'
import Avatar from '@/components/Avatar'
import { BookCoverImage } from '@/components/BookCoverImage'
import HighlightCaptureModal from '@/components/reading-buddy/HighlightCaptureModal'

// Mobile panel tabs
type MobileTab = 'progress' | 'highlights' | 'discussion'

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

  const [messageText, setMessageText]     = useState('')
  const [sending, setSending]             = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cableConnected, setCableConnected] = useState(false)
  const [showDnfConfirm, setShowDnfConfirm] = useState(false)
  const [mobileTab, setMobileTab]           = useState<MobileTab>('progress')
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
      onConnected:    () => setCableConnected(true),
      onDisconnected: () => setCableConnected(false),
      onMessage:      (data) => handleCableEvent(data as ReadingBuddyCableEvent),
    })
    return () => { cableRef.current?.unsubscribe(); cableRef.current = null; setCableConnected(false) }
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

  /* ── Loading ───────────────────────────────────────────────────── */
  if (sessionLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-lit-3)' }} />
      </div>
    )
  }

  /* ── Error / Not Found ─────────────────────────────────────────── */
  if (sessionError || !activeSession) {
    return (
      <div className="container-mobile py-24 text-center max-w-md mx-auto space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-grove)' }}>
            <BookOpen className="w-8 h-8" style={{ color: 'var(--color-lit-3)' }} />
          </div>
        </div>
        <h1 className="font-serif text-2xl font-bold text-lit">Session Not Found</h1>
        <p className="text-lit-2">{sessionError || "This reading session doesn't exist or you're not a participant."}</p>
        <Link href="/reading-buddy" className="inline-block mt-4 text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
          &larr; All Sessions
        </Link>
      </div>
    )
  }

  /* ── Derived state ─────────────────────────────────────────────── */
  const session      = activeSession
  const partner      = session.initiator.id === user?.id ? session.invited   : session.initiator
  const me           = session.initiator.id === user?.id ? session.initiator : session.invited
  const isActive     = session.status === 'active'
  const isPending    = session.status === 'pending'
  const isClosed     = session.status === 'declined' || session.status === 'dnf'
  const isInvited    = session.invited.id === user?.id

  const myPct        = me.progress?.completion_percentage ?? 0
  const myPages      = me.progress?.pages_read ?? 0
  const partnerPct   = partner.progress?.completion_percentage ?? 0
  const partnerPages = partner.progress?.pages_read ?? 0
  const partnerName  = partner.display_name || partner.username
  const partnerInitials = partnerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  /* ── Shared sub-components ─────────────────────────────────────── */

  // Vine-style progress bar with a gold leaf at the tip
  const VineBar = ({ pct, variant }: { pct: number; variant: 'self' | 'partner' }) => (
    <div
      className="relative w-full h-1.5 rounded-full overflow-visible"
      style={{ backgroundColor: 'var(--color-rim)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.max(pct, 2)}%`,
          background: variant === 'self'
            ? 'linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))'
            : 'linear-gradient(90deg, var(--color-success), #7ec49a)',
        }}
      />
      {/* Leaf glyph at tip */}
      {pct > 3 && (
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[10px] leading-none pointer-events-none select-none"
          style={{
            left: `calc(${pct}% - 6px)`,
            color: variant === 'self' ? 'var(--color-accent)' : 'var(--color-success)',
            filter: `drop-shadow(0 0 3px ${variant === 'self' ? 'var(--color-accent)' : 'var(--color-success)'})`,
          }}
        >
          ❧
        </span>
      )}
    </div>
  )

  // Progress card used in the left sidebar
  const ProgressCard = ({
    label, initials, pages, pct, variant, isYou,
  }: {
    label: string; initials: string; pages: number; pct: number;
    variant: 'self' | 'partner'; isYou?: boolean;
  }) => (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-grove)',
        border: '1px solid var(--color-rim)',
        borderRadius: '16px 14px 15px 17px',
        borderLeft: `3px solid ${variant === 'self' ? 'var(--color-accent)' : 'var(--color-success)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
          style={{
            backgroundColor: variant === 'self' ? 'var(--color-accent)' : 'var(--color-success)',
            color: variant === 'self' ? 'var(--color-accent-on)' : 'var(--color-canvas)',
          }}
        >
          {isYou ? 'You' : initials}
        </div>
        <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--color-lit-3)' }}>
          {label}
        </span>
        {pages > 0 && (
          <span className="text-[11px] flex-none" style={{ color: 'var(--color-lit-3)' }}>
            {pages} pg
          </span>
        )}
      </div>
      <VineBar pct={pct} variant={variant} />
      <p
        className="font-serif text-xl font-semibold mt-2"
        style={{ color: variant === 'self' ? 'var(--color-accent)' : 'var(--color-success)' }}
      >
        {pct}%
      </p>
    </div>
  )

  // Group highlights by page number
  const highlightsByPage = highlights.reduce<Record<number, typeof highlights>>((acc, h) => {
    if (!acc[h.page_number]) acc[h.page_number] = []
    acc[h.page_number].push(h)
    return acc
  }, {})
  const sortedPages = Object.keys(highlightsByPage).map(Number).sort((a, b) => a - b)

  // Highlights panel content (shared between desktop column and mobile tab)
  const HighlightsContent = () => {
    if (highlights.length === 0) {
      return (
        <div className="px-6 py-8 text-center">
          <div
            className="w-11 h-11 flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: 'var(--color-grove)',
              borderRadius: '14px 12px 13px 15px',
            }}
          >
            <Bookmark className="w-5 h-5" style={{ color: 'var(--color-lit-3)' }} />
          </div>
          <h3 className="font-serif text-base font-semibold mb-1.5" style={{ color: 'var(--color-lit)' }}>
            No highlights yet
          </h3>
          <p className="text-sm leading-relaxed max-w-xs mx-auto mb-5" style={{ color: 'var(--color-lit-3)' }}>
            Highlight passages as you read and they&apos;ll show up here alongside what {partnerName} is bookmarking.
          </p>
          <button
            onClick={() => setShowHighlightModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-on)',
              borderRadius: '12px 10px 11px 13px',
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Add your first highlight
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6 pb-4">
        {sortedPages.map(pageNum => (
          <div key={pageNum}>
            {/* Page number divider */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 flex-none"
                style={{
                  backgroundColor: 'var(--color-grove)',
                  color: 'var(--color-lit-3)',
                  borderRadius: '8px 6px 7px 9px',
                  border: '1px solid var(--color-rim)',
                }}
              >
                p.{pageNum}
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-rim)' }} />
            </div>

            {/* Highlight cards for this page */}
            <div className="space-y-3">
              {highlightsByPage[pageNum].map(highlight => {
                const isMe = highlight.user.id === user?.id
                const authorName = highlight.user.display_name || highlight.user.username
                const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div
                    key={highlight.id}
                    className="p-4 relative"
                    style={{
                      backgroundColor: 'var(--color-grove)',
                      border: '1px solid var(--color-rim)',
                      borderLeft: `3px solid ${isMe ? 'var(--color-accent)' : 'var(--color-success)'}`,
                      borderRadius: '12px 10px 11px 13px',
                    }}
                  >
                    {/* Author row */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                        style={{
                          backgroundColor: isMe ? 'var(--color-accent)' : 'var(--color-success)',
                          color: isMe ? 'var(--color-accent-on)' : 'var(--color-canvas)',
                        }}
                      >
                        {isMe ? 'You' : authorInitials}
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: isMe ? 'var(--color-accent)' : 'var(--color-success)' }}>
                        {isMe ? 'You' : authorName}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: 'var(--color-lit-3)' }}>
                        {new Date(highlight.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Highlighted passage */}
                    <blockquote
                      className="font-serif text-sm italic leading-relaxed"
                      style={{ color: 'var(--color-lit)' }}
                    >
                      &ldquo;{highlight.highlighted_text}&rdquo;
                    </blockquote>

                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Message list + composer (shared between desktop column and mobile tab)
  const DiscussionContent = ({ compact }: { compact?: boolean }) => (
    <div className={`flex flex-col ${compact ? 'h-full' : 'flex-1 min-h-0 overflow-hidden'}`}>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--color-grove)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-lit-3)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
              {isActive ? 'No messages yet — say something about the book!' : 'Chat unlocks once both of you are in.'}
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user?.id
            const initials = isMe ? null : (
              msg.user.display_name
                ? msg.user.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                : msg.user.username.slice(0, 2).toUpperCase()
            )
            return (
              <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe ? (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-canvas)' }}
                  >
                    {initials}
                  </div>
                ) : (
                  <div className="w-7 flex-shrink-0" />
                )}
                <div style={{ maxWidth: '72%' }}>
                  {!isMe && (
                    <p className="text-[11px] font-bold mb-1 ml-1" style={{ color: 'var(--color-success)' }}>
                      {msg.user.display_name || msg.user.username}
                      <span className="font-normal ml-2" style={{ color: 'var(--color-lit-3)' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  )}
                  <div
                    className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                      isMe ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
                    }`}
                    style={{
                      backgroundColor: isMe ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: isMe ? 'var(--color-accent-on)' : 'var(--color-lit)',
                      border: isMe ? 'none' : '1px solid var(--color-rim)',
                    }}
                  >
                    {msg.content}
                  </div>
                  {isMe && (
                    <p className="text-[10px] mt-1 text-right mr-1" style={{ color: 'var(--color-lit-3)' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isActive && (
        <div className="flex-none px-4 py-3" style={{ borderTop: '1px solid var(--color-rim)' }}>
          <div
            className="flex items-end gap-3 px-3 py-2 transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              borderRadius: '20px 18px 20px 22px',
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
              style={{ color: 'var(--color-lit)', maxHeight: 128, lineHeight: 1.5 }}
              onInput={e => {
                const t = e.currentTarget; t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="flex-none w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* ── Banners (pending / closed) ────────────────────────────────── */
  const StatusBanner = () => {
    if (isPending && isInvited) return (
      <div
        className="p-5 space-y-4 flex-none"
        style={{ borderBottom: '1px solid var(--color-rim)' }}
      >
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-accent)',
            boxShadow: '0 0 32px rgba(201,168,76,0.06)',
          }}
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 flex-none mt-0.5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="font-bold text-lit">
                {session.initiator.display_name || session.initiator.username} wants to read this with you
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>
                You&apos;ll be able to track each other&apos;s progress and chat as you read.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)', borderRadius: '14px 12px 13px 15px' }}
            >
              {actionLoading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Accept Invite
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)', borderRadius: '14px 12px 13px 15px' }}
            >
              {actionLoading === 'decline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Decline
            </button>
          </div>
        </div>
      </div>
    )

    if (isPending && !isInvited) return (
      <div className="px-5 pt-4 pb-2 flex-none">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}>
          <Clock className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
            Waiting for {partnerName} to respond&hellip;
          </p>
        </div>
      </div>
    )

    if (isClosed) return (
      <div className="px-5 pt-4 pb-2 flex-none">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
          <AlertTriangle className="w-4 h-4 flex-none" style={{ color: 'var(--color-lit-3)' }} />
          <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
            {session.status === 'declined' ? 'This invite was declined.' : 'This session ended as Did Not Finish.'}
          </p>
        </div>
      </div>
    )

    return null
  }

  /* ─────────────────────────────────────────────────────────────────
     RENDER
     Desktop: 3-column grid (sidebar | highlights | discussion)
     Mobile:  single column with tab bar
  ───────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Status banners (pending / closed) — shown above grid ── */}
      <StatusBanner />

      {/* ── Main 3-column grid ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 hidden lg:grid gap-4 p-4" style={{ gridTemplateColumns: '400px 1fr 1fr', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-y-auto gap-5 p-5"
        >
          {/* Book cover + meta side by side */}
          <div className="flex items-start gap-4">
            <Link href={`/books/${session.book.id}`} className="flex-none group">
              <div
                className="overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
                style={{
                  width: 100,
                  aspectRatio: '2/3',
                  borderRadius: '8px 4px 4px 8px',
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

            {/* Book title + author */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-serif text-lg font-semibold leading-snug" style={{ color: 'var(--color-lit)' }}>
                {session.book.title}
              </h1>
              {session.book.author_name && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>{session.book.author_name}</p>
              )}
            </div>
          </div>

          {/* Progress label */}
          <p
            className="text-[11px] font-bold uppercase tracking-widest -mb-2"
            style={{ color: 'var(--color-lit-3)' }}
          >
            Reading Progress
          </p>

          {/* Progress cards */}
          <div className="flex flex-col gap-3">
            <ProgressCard
              label="Your progress"
              initials="You"
              pages={myPages}
              pct={myPct}
              variant="self"
              isYou
            />
            <ProgressCard
              label={partnerName}
              initials={partnerInitials}
              pages={partnerPages}
              pct={partnerPct}
              variant="partner"
            />
          </div>

        </aside>

        {/* ── CENTER — HIGHLIGHTS ──────────────────────────────── */}
        <main
          className="flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-rim)',
            borderRadius: '20px 18px 20px 22px',
          }}
        >
          {/* Panel header */}
          <div
            className="flex-none flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--color-rim)' }}
          >
            <div className="flex items-center gap-2.5 font-serif text-base font-medium" style={{ color: 'var(--color-lit)' }}>
              <Pencil className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              Highlights
            </div>
            {isActive && (
              <button
                onClick={() => setShowHighlightModal(true)}
                className="text-xs font-bold tracking-wide transition-colors hover:opacity-70 flex items-center gap-1"
                style={{ color: 'var(--color-accent)' }}
              >
                <Pencil className="w-3 h-3" />
                Add highlight
              </button>
            )}
          </div>

          {/* Highlights feed */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <HighlightsContent />
          </div>
        </main>

        {/* ── RIGHT — DISCUSSION ──────────────────────────────── */}
        <aside
          className="flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-rim)',
            borderRadius: '20px 18px 20px 22px',
          }}
        >
          {/* Panel header */}
          <div
            className="flex-none flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-rim)' }}
          >
            <div className="flex items-center gap-2.5 font-serif text-base font-medium" style={{ color: 'var(--color-lit)' }}>
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
              Discussion
            </div>
            {messages.length > 0 && (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}
              >
                {messages.length}
              </span>
            )}
          </div>

          <DiscussionContent />
        </aside>
      </div>

      {/* ── Mobile layout (< lg) ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">

        {/* Mobile tab bar */}
        <div
          className="flex-none flex"
          style={{ borderBottom: '1px solid var(--color-rim)' }}
        >
          {(
            [
              { key: 'progress',    icon: <BookOpen size={13} />,    label: 'Progress' },
              { key: 'highlights',  icon: <Highlighter size={13} />, label: 'Highlights' },
              { key: 'discussion',  icon: <MessageCircle size={13} />, label: 'Discussion' },
            ] as { key: MobileTab; icon: React.ReactNode; label: string }[]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors"
              style={{
                color: mobileTab === tab.key ? 'var(--color-accent)' : 'var(--color-lit-3)',
                backgroundColor: mobileTab === tab.key ? 'var(--color-accent-subtle)' : 'transparent',
                borderBottom: mobileTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {mobileTab === 'progress' && (
            <div className="h-full overflow-y-auto px-5 py-5 space-y-4">
              {/* Compact book header on mobile */}
              <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--color-rim)' }}>
                <Link href={`/books/${session.book.id}`} className="flex-none">
                  <div className="w-11 rounded-lg overflow-hidden" style={{ aspectRatio: '2/3', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                    <BookCoverImage src={session.book.cover_image_url} title={session.book.title} author={session.book.author_name ?? undefined} size="small" className="w-full h-full object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <h1 className="font-serif text-base font-semibold truncate" style={{ color: 'var(--color-lit)' }}>{session.book.title}</h1>
                  {session.book.author_name && <p className="text-xs truncate" style={{ color: 'var(--color-lit-3)' }}>{session.book.author_name}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-none">
                  <Avatar src={partner.avatar_url ?? undefined} name={partnerName} size="xs" />
                  <span className="text-xs" style={{ color: 'var(--color-lit-3)' }}>with {partnerName}</span>
                </div>
              </div>
              <ProgressCard label="Your progress" initials="You" pages={myPages} pct={myPct} variant="self" isYou />
              <ProgressCard label={partnerName} initials={partnerInitials} pages={partnerPages} pct={partnerPct} variant="partner" />
            </div>
          )}

          {mobileTab === 'highlights' && (
            <div className="h-full overflow-y-auto">
              {isActive && highlights.length > 0 && (
                <div className="flex justify-end px-5 pt-4 pb-1">
                  <button
                    onClick={() => setShowHighlightModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-accent-on)',
                      borderRadius: '10px 8px 9px 11px',
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Add highlight
                  </button>
                </div>
              )}
              <HighlightsContent />
            </div>
          )}

          {mobileTab === 'discussion' && (
            <div className="h-full flex flex-col overflow-hidden">
              <DiscussionContent compact />
            </div>
          )}
        </div>
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

      {/* ── DNF Confirm Modal ────────────────────────────────────── */}
      {showDnfConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDnfConfirm(false) }}
        >
          <div
            className="w-full max-w-sm p-6 space-y-4"
            style={{
              backgroundColor: 'var(--color-canvas)',
              border: '1px solid var(--color-rim)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              borderRadius: '24px 20px 22px 26px',
            }}
          >
            <h3 className="font-serif text-xl font-bold text-lit">Mark as Did Not Finish?</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-3)' }}>
              This closes the session. Your chat history stays intact and either of you can see it anytime.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDnfConfirm(false)}
                className="flex-1 py-3 font-bold text-sm"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)', borderRadius: '14px 12px 13px 15px' }}
              >
                Keep Reading
              </button>
              <button
                onClick={handleDnf}
                disabled={actionLoading === 'dnf'}
                className="flex-1 py-3 font-bold text-sm transition-all disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)', borderRadius: '14px 12px 13px 15px' }}
              >
                {actionLoading === 'dnf' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'DNF it'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
