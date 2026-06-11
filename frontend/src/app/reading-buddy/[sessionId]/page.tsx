'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Clock, X, AlertTriangle, Loader2,
  Highlighter, Pencil, ArrowLeft, BookOpen, Bell,
  TrendingUp, Trophy, MessageCircle,
} from 'lucide-react'
import { useReadingBuddy, useAuth, apiClient } from '@book-app/shared'
import type { ReadingBuddyCableEvent, UserBook, ShelfStatus } from '@book-app/shared'
import { ActionCableSubscription, buildCableUrl } from '@/lib/actioncable'
import { BookCoverImage } from '@/components/BookCoverImage'
import QuickUpdateModal from '@/components/QuickUpdateModal'
import HighlightCaptureModal from '@/components/reading-buddy/HighlightCaptureModal'
import DiscussionPanel, { type DiscussionPanelProps } from '@/components/reading-buddy/DiscussionPanel'
import { parseMessage } from '@/components/reading-buddy/utils'

type MobileTab = 'pacing' | 'highlights' | 'discussion'

// ─── Palette ──────────────────────────────────────────────────────────────────
const DARK_BG      = '#1A1610'
const PANEL_BG     = '#232018'
const PANEL_BORDER = 'rgba(255,255,255,0.09)'
const CREAM        = '#FAF6EB'
const MUTED        = 'rgba(250,246,235,0.55)'
const DIM          = 'rgba(250,246,235,0.6)'
const MY_COLOR     = '#F1C75B'
const PTN_COLOR    = '#D5582E'

// ─── Shared panel styles ──────────────────────────────────────────────────────
const PANEL: React.CSSProperties = {
  backgroundColor: PANEL_BG,
  border: `1px solid ${PANEL_BORDER}`,
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}
const PANEL_HEADER: React.CSSProperties = {
  borderBottom: `1px solid ${PANEL_BORDER}`,
  padding: '13px 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 120, stroke = 9, trackColor = 'rgba(255,255,255,0.1)' }: {
  pct: number; color: string; size?: number; stroke?: number; trackColor?: string
}) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.32,0.72,0,1)' }} />
    </svg>
  )
}

// ─── HighlightCard ────────────────────────────────────────────────────────────
function HighlightCard({ text, pageNumber, authorName, isMe, date }: {
  text: string; pageNumber: number; authorName: string; isMe: boolean; date: string
}) {
  const color = isMe ? MY_COLOR : PTN_COLOR
  return (
    <div style={{
      borderRadius: 10,
      backgroundColor: isMe ? 'rgba(241,199,91,0.12)' : 'rgba(213,88,46,0.08)',
      border: `1.5px solid ${isMe ? 'rgba(241,199,91,0.3)' : 'rgba(213,88,46,0.25)'}`,
      padding: '14px 16px',
    }}>
      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 8 }}>
        <span className="font-bold uppercase" style={{
          fontSize: 9, letterSpacing: '0.18em', color,
          border: `1px solid ${isMe ? 'rgba(241,199,91,0.4)' : 'rgba(213,88,46,0.4)'}`,
          borderRadius: 3, padding: '1px 5px',
        }}>
          {isMe ? 'You' : authorName} · p. {pageNumber}
        </span>
        <span style={{ fontSize: 10, color: DIM, marginLeft: 'auto' }}>{date}</span>
      </div>
      <blockquote className="font-serif italic" style={{ fontSize: 13, lineHeight: 1.7, color: CREAM }}>
        &ldquo;{text}&rdquo;
      </blockquote>
    </div>
  )
}

// ─── MobileTabBar ─────────────────────────────────────────────────────────────
const MOBILE_TABS: { key: MobileTab; label: string }[] = [
  { key: 'pacing',     label: 'Pacing'     },
  { key: 'highlights', label: 'Highlights' },
  { key: 'discussion', label: 'Discussion' },
]
function MobileTabBar({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  return (
    <div className="flex gap-2 flex-wrap" style={{ marginBottom: 12 }}>
      {MOBILE_TABS.map(tab => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="font-bold uppercase transition-opacity hover:opacity-80"
            style={{
              fontSize: 11, letterSpacing: '0.12em',
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              padding: '7px 16px',
              backgroundColor: isActive ? 'var(--color-ink)' : 'transparent',
              color: isActive ? 'var(--color-canvas)' : 'var(--color-ink)',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── StatusBanner ─────────────────────────────────────────────────────────────
interface StatusBannerProps {
  isPending: boolean; isInvited: boolean; isClosed: boolean
  sessionStatus: string; initiatorName: string; partnerName: string
  actionLoading: string | null
  onAccept: () => void; onDecline: () => void
}
function StatusBanner({ isPending, isInvited, isClosed, sessionStatus, initiatorName, partnerName, actionLoading, onAccept, onDecline }: StatusBannerProps) {
  if (isPending && isInvited) return (
    <div className="zine-card shadow-zine-ink p-5 mb-3"
      style={{ borderRadius: 14, backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent)' }}>
      <p className="font-serif text-base font-bold" style={{ color: 'var(--color-ink)', marginBottom: 4 }}>
        {initiatorName} wants to read with you
      </p>
      <div className="flex gap-2.5 mt-3">
        <button onClick={onAccept} disabled={actionLoading !== null}
          className="zine-btn zine-btn-primary flex-1 justify-center disabled:opacity-60">
          {actionLoading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
        </button>
        <button onClick={onDecline} disabled={actionLoading !== null}
          className="zine-btn zine-btn-ghost flex-1 justify-center disabled:opacity-60">
          {actionLoading === 'decline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Decline
        </button>
      </div>
    </div>
  )
  if (isPending && !isInvited) return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
      style={{ background: 'var(--color-surface)', border: '1.5px dashed var(--color-rim)' }}>
      <Clock className="w-4 h-4 flex-none" style={{ color: 'var(--color-ink-3)' }} />
      <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>Waiting for {partnerName} to respond…</p>
    </div>
  )
  if (isClosed) return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
      style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-rim)' }}>
      <AlertTriangle className="w-4 h-4 flex-none" style={{ color: 'var(--color-ink-3)' }} />
      <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>
        {sessionStatus === 'declined' ? 'This invite was declined.' : 'This session has ended.'}
      </p>
    </div>
  )
  return null
}

// ─── PacingContent (mobile) ───────────────────────────────────────────────────
interface PacingContentProps {
  myPct: number; myPages: number; myInitials: string
  partnerPct: number; partnerPages: number; partnerInitials: string; partnerName: string
  isActive: boolean
}
function PacingContent({ myPct, myPages, myInitials, partnerPct, partnerPages, partnerInitials, partnerName, isActive }: PacingContentProps) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="flex items-center justify-around gap-4">
        <div className="flex flex-col items-center gap-3">
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <ProgressRing pct={myPct} color={MY_COLOR} size={120} stroke={9} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-black tabular-nums" style={{ fontSize: 30, color: MY_COLOR, lineHeight: 1 }}>
                {myPct}<span style={{ fontSize: 14 }}>%</span>
              </span>
              {myPages > 0 && <span style={{ fontSize: 10, color: DIM, marginTop: 2 }}>p. {myPages}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0"
              style={{ fontSize: 9, backgroundColor: MY_COLOR, color: '#1A1A1A' }}>{myInitials}</div>
            <span className="font-bold" style={{ fontSize: 11, color: MY_COLOR }}>You</span>
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: PANEL_BORDER }} />
        <div className="flex flex-col items-center gap-3">
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <ProgressRing pct={partnerPct} color={PTN_COLOR} size={120} stroke={9} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-black tabular-nums" style={{ fontSize: 30, color: PTN_COLOR, lineHeight: 1 }}>
                {partnerPct}<span style={{ fontSize: 14 }}>%</span>
              </span>
              {partnerPages > 0 && <span style={{ fontSize: 10, color: DIM, marginTop: 2 }}>p. {partnerPages}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0"
              style={{ fontSize: 9, backgroundColor: PTN_COLOR, color: CREAM }}>{partnerInitials}</div>
            <span className="font-bold" style={{ fontSize: 11, color: PTN_COLOR }}>{partnerName.split(' ')[0]}</span>
          </div>
        </div>
      </div>
      {isActive && (myPct > 0 || partnerPct > 0) && (
        <div style={{ borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: `1px solid ${PANEL_BORDER}`, padding: '12px 14px' }}>
          {myPct > partnerPct ? (
            <p className="font-semibold italic" style={{ fontSize: 13, color: CREAM, lineHeight: 1.55 }}>
              You're ahead by <span style={{ color: MY_COLOR, fontWeight: 700 }}>{myPct - partnerPct}%</span>.
            </p>
          ) : partnerPct > myPct ? (
            <p className="font-semibold italic" style={{ fontSize: 13, color: CREAM, lineHeight: 1.55 }}>
              <span style={{ color: PTN_COLOR, fontWeight: 700 }}>{partnerName.split(' ')[0]}</span> is ahead by{' '}
              <span style={{ color: MY_COLOR, fontWeight: 700 }}>{partnerPct - myPct}%</span>.
            </p>
          ) : myPct > 0 ? (
            <p className="font-semibold italic" style={{ fontSize: 13, color: MUTED }}>You're at the same spot.</p>
          ) : (
            <p style={{ fontSize: 13, color: DIM }}>No progress logged yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── LeftSidebarContent ───────────────────────────────────────────────────────
interface LeftSidebarProps {
  myPct: number; myPages: number; myInitials: string
  partnerPct: number; partnerPages: number; partnerInitials: string; partnerName: string
  pagesPerWeek: number; partnerPagesPerWeek: number
  isActive: boolean
  nudgeSent: boolean; handleNudge: () => void
  setShowLogProgress: (v: boolean) => void; setShowDnfConfirm: (v: boolean) => void
}
function LeftSidebarContent({
  myPct, myPages, myInitials, partnerPct, partnerPages, partnerInitials, partnerName,
  pagesPerWeek, partnerPagesPerWeek,
  isActive, nudgeSent, handleNudge, setShowLogProgress, setShowDnfConfirm,
}: LeftSidebarProps) {
  return (
    <>
      {/* Pacing content */}
      <div style={{ padding: '18px 16px 16px' }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: 18 }}>
          <div style={{ width: 24, height: 2, backgroundColor: MY_COLOR, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', color: MY_COLOR, textTransform: 'uppercase' }}>Pacing</span>
        </div>

        <div className="flex items-center justify-around" style={{ marginBottom: 14 }}>
          {/* You */}
          <div className="flex flex-col items-center gap-2.5">
            <div style={{ position: 'relative', width: 96, height: 96 }}>
              <ProgressRing pct={myPct} color={MY_COLOR} size={96} stroke={8} trackColor="rgba(255,255,255,0.12)" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <span className="font-black tabular-nums" style={{ fontSize: 26, color: '#fff', lineHeight: 1 }}>{myPct}<span style={{ fontSize: 13 }}>%</span></span>
                {myPages > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)', fontWeight: 600 }}>p. {myPages}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: MY_COLOR, color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900 }}>{myInitials}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>You</span>
            </div>
          </div>
          {/* Partner */}
          <div className="flex flex-col items-center gap-2.5">
            <div style={{ position: 'relative', width: 96, height: 96 }}>
              <ProgressRing pct={partnerPct} color={PTN_COLOR} size={96} stroke={8} trackColor="rgba(255,255,255,0.12)" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <span className="font-black tabular-nums" style={{ fontSize: 26, color: '#fff', lineHeight: 1 }}>{partnerPct}<span style={{ fontSize: 13 }}>%</span></span>
                {partnerPages > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)', fontWeight: 600 }}>p. {partnerPages}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: PTN_COLOR, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900 }}>{partnerInitials}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{partnerName.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Who's ahead */}
        {(myPages > 0 || partnerPages > 0) && (
          <div style={{ borderRadius: 10, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', marginBottom: 12 }}>
            {myPages > partnerPages ? (
              <p className="font-serif italic" style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
                You're <span style={{ color: MY_COLOR, fontWeight: 700 }}>{myPages - partnerPages} pages ahead.</span>
              </p>
            ) : partnerPages > myPages ? (
              <p className="font-serif italic" style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
                {partnerName.split(' ')[0]} is <span style={{ color: MY_COLOR, fontWeight: 700 }}>{partnerPages - myPages} pages ahead.</span>
              </p>
            ) : myPages > 0 ? (
              <p className="font-serif italic" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>You're reading in sync.</p>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No progress logged yet.</p>
            )}
          </div>
        )}

        {/* This-week stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 10px 8px' }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 5 }}>You This Week</div>
            <div className="flex items-baseline gap-1">
              <span className="font-black tabular-nums" style={{ fontSize: 28, color: MY_COLOR, lineHeight: 1 }}>{pagesPerWeek || 0}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>pp</span>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 10px 8px' }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 5 }}>{partnerName.split(' ')[0]} This Week</div>
            <div className="flex items-baseline gap-1">
              <span className="font-black tabular-nums" style={{ fontSize: 28, color: PTN_COLOR, lineHeight: 1 }}>{partnerPagesPerWeek || 0}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>pp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Session controls */}
      {/* {isActive && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button onClick={() => setShowLogProgress(true)}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0px #1A1A1A' }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0px #1A1A1A' }}
            style={{ width: '100%', fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', border: '2px solid #1A1A1A', borderRadius: 999, padding: '9px 12px', backgroundColor: MY_COLOR, color: '#1A1A1A', boxShadow: '3px 3px 0px #1A1A1A', cursor: 'pointer' }}>
            + Log Progress
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleNudge} disabled={nudgeSent}
              className="flex items-center justify-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 5px', backgroundColor: 'transparent', color: nudgeSent ? '#4ADE80' : CREAM, cursor: 'pointer' }}>
              <Bell size={9} /> {nudgeSent ? 'Sent!' : 'Nudge'}
            </button>
            <button onClick={() => setShowDnfConfirm(true)}
              className="transition-opacity hover:opacity-60"
              style={{ flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '7px 5px', backgroundColor: 'transparent', color: DIM, cursor: 'pointer' }}>
              Leave
            </button>
          </div>
        </div>
      )} */}
    </>
  )
}

// ─── HighlightsSidebarContent ─────────────────────────────────────────────────
interface HighlightsSidebarProps {
  highlights: any[]
  isActive: boolean
  setShowHighlight: (v: boolean) => void
  userId: number | undefined
}
function HighlightsSidebarContent({ highlights, isActive, setShowHighlight, userId }: HighlightsSidebarProps) {
  const sorted = [...highlights].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>Highlights</span>
        </div>
        {highlights.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {highlights.length} Saved
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '0 12px', minHeight: 0 }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 gap-2">
            <Highlighter className="w-5 h-5" style={{ color: 'var(--color-ink-3)' }} />
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>No highlights yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
            {sorted.map((h: any, i: number) => {
              const isMe       = h.user.id === userId
              const name       = isMe ? 'You' : (h.user.display_name || h.user.username)
              const initials   = (h.user.display_name || h.user.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const isFirst    = i === 0
              const daysAgo    = Math.floor((Date.now() - new Date(h.created_at).getTime()) / 86400000)
              const daysStr    = daysAgo === 0 ? 'Today' : `${daysAgo}D`
              const avatarBg   = isMe ? 'var(--color-accent-teal)' : 'var(--color-accent)'
              const note       = (h as any).annotation || (h as any).note

              return (
                <div key={h.id} style={{
                  borderRadius: 12,
                  backgroundColor: isFirst ? 'var(--color-accent-yellow)' : 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: isFirst ? '3px 3px 0px var(--color-ink)' : '3px 3px 0px var(--color-accent-yellow)',
                  padding: '12px 14px',
                }}>
                  <div className="flex items-center justify-between gap-2" style={{ marginBottom: 8 }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, flexShrink: 0, border: '1.5px solid var(--color-ink)' }}>
                        {initials}
                      </div>
                      <span className="font-bold" style={{ fontSize: 13, color: 'var(--color-ink)' }}>{name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-ink-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      P. {h.page_number} &middot; {daysStr}
                    </span>
                  </div>
                  <blockquote className="font-serif italic" style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--color-ink)', marginBottom: note ? 8 : 0 }}>
                    &ldquo;{h.highlighted_text}&rdquo;
                  </blockquote>
                  {note && (
                    <p style={{ fontSize: 12, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 700 }}>note:</strong> {note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add highlight button */}
      {isActive && (
        <div style={{ padding: '10px 12px 12px', flexShrink: 0 }}>
          <button onClick={() => setShowHighlight(true)}
            className="w-full font-bold uppercase flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
            style={{ fontSize: 11, letterSpacing: '0.18em', border: '2px dashed var(--color-ink)', borderRadius: 999, padding: '12px 16px', backgroundColor: 'transparent', color: 'var(--color-ink)', cursor: 'pointer' }}>
            + Add a Highlight
          </button>
        </div>
      )}
    </div>
  )
}

// ─── NextMilestoneSidebarContent ─────────────────────────────────────────────
const MILESTONES = [
  { pct: 25,  label: 'Quarter point',       sub: 'Keep up the pace!' },
  { pct: 50,  label: 'Halfway point',       sub: 'Reach it this week to keep your shared streak.' },
  { pct: 75,  label: 'Three-quarter mark',  sub: 'The end is in sight!' },
  { pct: 100, label: 'The finish line',     sub: 'One final push — you\'ve got this.' },
]

interface NextMilestoneSidebarProps {
  myPct: number; myPages: number; totalPages: number
}
function NextMilestoneSidebarContent({ myPct, myPages, totalPages }: NextMilestoneSidebarProps) {
  const nextIdx = MILESTONES.findIndex(m => myPct < m.pct)

  if (nextIdx === -1) {
    return (
      <div style={{ padding: '18px 20px 20px' }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
          <div style={{ width: 24, height: 2, backgroundColor: MY_COLOR, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: MY_COLOR, textTransform: 'uppercase' }}>Milestone</span>
        </div>
        <p className="font-serif font-bold" style={{ fontSize: 26, color: '#fff', lineHeight: 1.1 }}>You finished!</p>
        <p className="font-serif italic" style={{ fontSize: 20, color: MY_COLOR, lineHeight: 1.2, marginTop: 4 }}>Amazing work.</p>
      </div>
    )
  }

  const next       = MILESTONES[nextIdx]
  const prevPct    = nextIdx > 0 ? MILESTONES[nextIdx - 1].pct : 0
  const targetPage = totalPages > 0 ? Math.round((next.pct  / 100) * totalPages) : 0
  const prevPage   = totalPages > 0 ? Math.round((prevPct   / 100) * totalPages) : 0
  const pagesAway  = totalPages > 0 ? Math.max(0, targetPage - myPages) : null
  const span       = targetPage - prevPage
  const progress   = span > 0 ? Math.min(1, Math.max(0, (myPages - prevPage) / span)) : 0

  return (
    <div style={{ padding: '18px 20px 20px' }}>
      {/* Eyebrow */}
      <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
        <div style={{ width: 24, height: 2, backgroundColor: MY_COLOR, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: MY_COLOR, textTransform: 'uppercase' }}>Next Milestone</span>
      </div>

      {/* Title */}
      <p className="font-serif font-bold" style={{ fontSize: 28, color: '#fff', lineHeight: 1.05, marginBottom: 4 }}>
        {next.label}
      </p>
      {targetPage > 0 && (
        <p className="font-serif italic" style={{ fontSize: 24, color: MY_COLOR, lineHeight: 1.1, marginBottom: 14 }}>
          at p. {targetPage}
        </p>
      )}

      {/* Body */}
      {pagesAway !== null && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 16 }}>
          You're <span style={{ color: MY_COLOR, fontWeight: 700 }}>{pagesAway} pages</span> away. {next.sub}
        </p>
      )}

      {/* Progress bar */}
      {targetPage > 0 && (
        <>
          <div style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.28)', marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              backgroundColor: MY_COLOR, borderRadius: 4,
              transition: 'width 1s cubic-bezier(0.32,0.72,0,1)',
            }} />
          </div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>
            {myPages} / {targetPage} PP &middot; {Math.round(progress * 100)}%
          </p>
        </>
      )}
    </div>
  )
}

// ─── ActivitySidebarContent ───────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}H AGO`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'YESTERDAY'
  if (days < 7)  return date.toLocaleDateString([], { weekday: 'short' }).toUpperCase()
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()
}

interface ActivitySidebarProps {
  highlights: any[]
  userId: number | undefined
  partnerName: string
  initiatorId: number
  createdAt: Date | null
}
function ActivitySidebarContent({ highlights, userId, partnerName, initiatorId, createdAt }: ActivitySidebarProps) {
  const pFirst = partnerName.split(' ')[0]

  type ActivityEvent = {
    id: string; isMe: boolean; name: string
    action: string; accent: string | null; accentColor: string; date: Date
  }

  const events: ActivityEvent[] = []

  if (createdAt) {
    const startedByMe = initiatorId === userId
    events.push({
      id: 'session-start', isMe: startedByMe,
      name: startedByMe ? 'You' : pFirst,
      action: 'started the session', accent: null, accentColor: '',
      date: createdAt,
    })
  }

  for (const h of highlights) {
    const isMe = h.user.id === userId
    events.push({
      id: `hl-${h.id}`, isMe,
      name: isMe ? 'You' : pFirst,
      action: 'highlighted',
      accent: `p. ${h.page_number}`,
      accentColor: isMe ? 'var(--color-accent-teal)' : PTN_COLOR,
      date: new Date(h.created_at),
    })
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Fixed header */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-teal)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent-teal)', textTransform: 'uppercase' }}>Activity</span>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '4px 16px 20px', minHeight: 0 }}>
        {events.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>No activity yet.</p>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 14, bottom: 14, width: 2, backgroundColor: 'var(--color-rim)', borderRadius: 2 }} />
            {events.map(ev => {
              const dotBg = ev.isMe ? 'var(--color-accent-teal)' : PTN_COLOR
              return (
                <div key={ev.id} style={{ display: 'flex', gap: 14, marginBottom: 18, position: 'relative' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: dotBg, border: '2.5px solid var(--color-canvas)',
                    zIndex: 1, position: 'relative',
                  }} />
                  <div style={{ paddingTop: 3, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.45 }}>
                      <strong style={{ fontWeight: 800 }}>{ev.name}</strong>
                      {' '}{ev.action}
                      {ev.accent && (
                        <> &middot; <span style={{ color: ev.accentColor, fontWeight: 700 }}>{ev.accent}</span></>
                      )}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-ink-3)', marginTop: 3 }}>
                      {timeAgo(ev.date)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HighlightsContent ────────────────────────────────────────────────────────
interface HighlightsContentProps {
  highlights: any[]; highlightsByPage: Record<number, any[]>; sortedPages: number[]
  isActive: boolean; setShowHighlight: (v: boolean) => void; userId: number | undefined
}
function HighlightsContent({ highlights, highlightsByPage, sortedPages, isActive, setShowHighlight, userId }: HighlightsContentProps) {
  if (highlights.length === 0) return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <Highlighter className="w-6 h-6 mb-3" style={{ color: DIM }} />
      <p className="font-serif font-semibold mb-1" style={{ color: CREAM }}>No highlights yet</p>
      <p className="text-sm leading-relaxed max-w-[200px] mb-5" style={{ color: MUTED }}>
        Capture passages as you read — they'll appear here.
      </p>
      {isActive && (
        <button onClick={() => setShowHighlight(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all hover:opacity-80"
          style={{ background: 'rgba(241,199,91,0.12)', color: MY_COLOR, border: `1px solid rgba(241,199,91,0.3)` }}>
          <Pencil className="w-3 h-3" /> Add first highlight
        </button>
      )}
    </div>
  )
  return (
    <div className="space-y-4 pb-4">
      {sortedPages.map(pageNum => (
        <div key={pageNum}>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="font-bold uppercase flex-none" style={{
              fontSize: 9, letterSpacing: '0.18em', color: DIM,
              background: 'rgba(0,0,0,0.2)', border: `1px solid ${PANEL_BORDER}`,
              borderRadius: 4, padding: '2px 7px',
            }}>Page {pageNum}</span>
            <div className="flex-1 h-px" style={{ background: PANEL_BORDER }} />
          </div>
          <div className="space-y-2">
            {highlightsByPage[pageNum].map((h: any) => (
              <HighlightCard
                key={h.id}
                text={h.highlighted_text}
                pageNumber={h.page_number}
                authorName={h.user.display_name || h.user.username}
                isMe={h.user.id === userId}
                date={new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── RightRailContent ─────────────────────────────────────────────────────────
interface RightRailProps {
  highlights: any[]; highlightsByPage: Record<number, any[]>; sortedPages: number[]
  isActive: boolean; setShowHighlight: (v: boolean) => void; userId: number | undefined
  myPct: number; myPages: number; partnerPct: number; partnerPages: number; partnerName: string
  messageCount: number; startedDate: string | null
}
function RightRailContent({ highlights, highlightsByPage, sortedPages, isActive, setShowHighlight, userId, myPct, myPages, partnerPct, partnerPages, partnerName, messageCount, startedDate }: RightRailProps) {
  const pName = partnerName.split(' ')[0]
  const timeline = [
    { icon: BookOpen,    label: 'Session started',       sub: startedDate ?? 'Day 1',          color: MY_COLOR  },
    messageCount > 0   ? { icon: MessageCircle, label: 'Conversation begun',   sub: `${messageCount} msgs so far`, color: MUTED     } : null,
    highlights.length > 0 ? { icon: Highlighter, label: 'First highlight shared', sub: `${highlights.length} total`,  color: MUTED     } : null,
    myPct >= 25        ? { icon: TrendingUp,  label: 'You hit 25%',           sub: `${myPages} pages in`,         color: MY_COLOR  } : null,
    myPct >= 50        ? { icon: TrendingUp,  label: 'Halfway through!',       sub: 'You hit 50%',                 color: MY_COLOR  } : null,
    (myPct >= 50 && partnerPct >= 50) ? { icon: Trophy, label: 'Both halfway!', sub: 'Neck and neck',              color: '#4ADE80' } : null,
    myPct >= 75        ? { icon: TrendingUp,  label: '75% done',               sub: 'Almost finished!',            color: MY_COLOR  } : null,
    myPct >= 100       ? { icon: Trophy,      label: 'You finished!',          sub: 'Amazing reader',              color: '#4ADE80' } : null,
    partnerPct >= 100  ? { icon: Trophy,      label: `${pName} finished!`,     sub: 'They crushed it!',            color: PTN_COLOR } : null,
  ].filter(Boolean) as Array<{ icon: any; label: string; sub: string; color: string }>

  return (
    <div>
      <div style={{ borderBottom: `1px solid ${PANEL_BORDER}`, padding: '9px 13px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.22em', color: DIM, textTransform: 'uppercase' }}>
            Highlights{highlights.length > 0 ? ` · ${highlights.length}` : ''}
          </span>
          {isActive && (
            <button onClick={() => setShowHighlight(true)} style={{ fontSize: 10, fontWeight: 700, color: MY_COLOR, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Pencil style={{ width: 10, height: 10 }} /> Add
            </button>
          )}
        </div>
        <div style={{ padding: '0 0 10px' }}>
          <HighlightsContent highlights={highlights} highlightsByPage={highlightsByPage} sortedPages={sortedPages} isActive={isActive} setShowHighlight={setShowHighlight} userId={userId} />
        </div>
      </div>
      <div>
        <div style={{ padding: '9px 13px 5px' }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.22em', color: DIM, textTransform: 'uppercase' }}>Milestones</span>
        </div>
        <div style={{ padding: '0 12px 12px' }}>
          {timeline.length === 0 ? (
            <p style={{ fontSize: 11, color: DIM, fontStyle: 'italic', textAlign: 'center', paddingTop: 14 }}>Milestones appear as you read.</p>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: 12, bottom: 0, width: 1, background: PANEL_BORDER }} />
              {timeline.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 13, position: 'relative' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${item.color}50`, zIndex: 1, position: 'relative' }}>
                      <Icon style={{ width: 10, height: 10, color: item.color }} />
                    </div>
                    <div style={{ paddingTop: 3, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: CREAM, lineHeight: 1.3 }}>{item.label}</p>
                      <p style={{ fontSize: 9, color: DIM, marginTop: 1 }}>{item.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
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

  const [messageText,       setMessageText]       = useState('')
  const [sending,           setSending]           = useState(false)
  const [actionLoading,     setActionLoading]     = useState<string | null>(null)
  const [showDnfConfirm,    setShowDnfConfirm]    = useState(false)
  const [mobileTab,         setMobileTab]         = useState<MobileTab>('pacing')
  const [showHighlight,     setShowHighlight]     = useState(false)
  const [showLogProgress,   setShowLogProgress]   = useState(false)
  const [nudgeSent,         setNudgeSent]         = useState(false)
  const [chapterFilter,     setChapterFilter]     = useState<number | null>(null)
  const [composerIsSpoiler, setComposerIsSpoiler] = useState(false)
  const [composerQuote,     setComposerQuote]     = useState<{ content: string; userName: string } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const cableRef  = useRef<ActionCableSubscription | null>(null)

  useEffect(() => {
    if (!isNaN(sessionId)) fetchSession(sessionId)
    return () => clearActiveSession()
  }, [sessionId])

  const sessionSettled = useRef(false)
  const settledMessageCount = useRef(0)
  useEffect(() => {
    if (!sessionSettled.current) {
      if (!sessionLoading && (activeSession || sessionError)) {
        sessionSettled.current = true
        settledMessageCount.current = messages.length
        // Scroll only the feed container, not the page — no visible jump for the user
        requestAnimationFrame(() => {
          const container = bottomRef.current?.parentElement
          if (container) container.scrollTop = container.scrollHeight
        })
      }
      return
    }
    if (messages.length > settledMessageCount.current) {
      const container = bottomRef.current?.parentElement
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      settledMessageCount.current = messages.length
    }
  }, [sessionLoading, messages.length])

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
    let fullContent = content
    if (composerIsSpoiler) fullContent = `[!SPOILER]${fullContent}`
    setMessageText('')
    setComposerIsSpoiler(false)
    setComposerQuote(null)
    try { await sendMessage(sessionId, fullContent) }
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

  const handleNudge = async () => {
    try { await (apiClient as any).post(`/reading_buddy/sessions/${sessionId}/nudge`) } catch { /* best-effort */ }
    setNudgeSent(true)
    setTimeout(() => setNudgeSent(false), 3000)
  }

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (sessionLoading) return (
    <div style={{ minHeight: 'calc(100vh - 82px)', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-ink-3)' }} />
    </div>
  )

  if (sessionError || !activeSession) return (
    <div style={{ minHeight: 'calc(100vh - 82px)', backgroundColor: 'var(--color-canvas)' }}>
      <div className="container-mobile py-24 text-center max-w-md mx-auto space-y-4">
        <BookOpen className="w-8 h-8 mx-auto" style={{ color: 'var(--color-ink-3)' }} />
        <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Session not found</h1>
        <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
          {sessionError || "This session doesn't exist or you're not a participant."}
        </p>
        <Link href="/reading-buddy" className="inline-flex items-center gap-1.5 text-sm font-bold mt-4" style={{ color: 'var(--color-accent)' }}>
          <ArrowLeft className="w-4 h-4" /> All sessions
        </Link>
      </div>
    </div>
  )

  // ── Derived state ────────────────────────────────────────────────────────────
  const session      = activeSession
  const partner      = session.initiator.id === user?.id ? session.invited   : session.initiator
  const me           = session.initiator.id === user?.id ? session.initiator : session.invited
  const isActive     = session.status === 'active'
  const isPending    = session.status === 'pending'
  const isClosed     = session.status === 'declined' || session.status === 'dnf'
  const isInvited    = session.invited.id === user?.id

  const myPct            = me.progress?.completion_percentage      ?? 0
  const myPages          = me.progress?.pages_read                 ?? 0
  const partnerPct       = partner.progress?.completion_percentage ?? 0
  const partnerPages     = partner.progress?.pages_read            ?? 0
  const partnerName      = partner.display_name || partner.username
  const partnerInitials  = partnerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const myInitials       = (me.display_name || me.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const createdAt        = (session as any).created_at ? new Date((session as any).created_at) : null
  const startedDate      = createdAt ? createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' }) : null
  const daysSince        = createdAt ? Math.max(1, (Date.now() - createdAt.getTime()) / 86400000) : 1
  const weekNumber       = Math.ceil(daysSince / 7)
  const pagesPerWeek        = myPages      > 0 ? Math.round((myPages      / daysSince) * 7 / 5) * 5 : 0
  const partnerPagesPerWeek = partnerPages > 0 ? Math.round((partnerPages / daysSince) * 7 / 5) * 5 : 0
  const totalPages       = (session.book as any).page_count ?? 0
  const chapterCount     = (session.book as any).chapter_count ??
    (totalPages > 0 ? Math.max(5, Math.min(12, Math.round(totalPages / 50))) : 8)

  const filteredMessages = chapterFilter === null
    ? messages
    : messages.filter(msg => {
        const { pageRef } = parseMessage(msg.content)
        if (!pageRef || !totalPages) return false
        const pct    = (parseInt(pageRef, 10) / totalPages) * 100
        const chStart = (chapterFilter / chapterCount) * 100
        const chEnd   = ((chapterFilter + 1) / chapterCount) * 100
        return pct >= chStart && pct < chEnd
      })

  const highlightsByPage = highlights.reduce<Record<number, typeof highlights>>((acc, h) => {
    if (!acc[h.page_number]) acc[h.page_number] = []
    acc[h.page_number].push(h)
    return acc
  }, {})
  const sortedPages = Object.keys(highlightsByPage).map(Number).sort((a, b) => a - b)

  const partnerLastActive = (() => {
    const ts = [
      ...messages.filter(m => m.user_id === partner.id).map(m => new Date(m.created_at).getTime()),
      ...highlights.filter(h => h.user.id === partner.id).map(h => new Date(h.created_at).getTime()),
    ]
    return ts.length > 0 ? new Date(Math.max(...ts)) : null
  })()

  // UserBook object for QuickUpdateModal — constructed from session participant data
  const myUserBook: UserBook = {
    id:                    me.user_book_id ?? 0,
    book_id:               session.book.id,
    book:                  { id: session.book.id, title: session.book.title, author_name: session.book.author_name, page_count: totalPages || null, cover_image_url: session.book.cover_image_url } as any,
    status:                ((me.progress?.status as ShelfStatus) ?? 'reading'),
    pages_read:            me.progress?.pages_read ?? 0,
    total_pages:           totalPages > 0 ? totalPages : undefined,
    completion_percentage: me.progress?.completion_percentage ?? 0,
    created_at:            (session as any).created_at ?? '',
    updated_at:            (session as any).updated_at ?? '',
  }

  // ── Shared props bundles ─────────────────────────────────────────────────────
  const pacingProps: PacingContentProps = { myPct, myPages, myInitials, partnerPct, partnerPages, partnerInitials, partnerName, isActive }

  const leftProps: LeftSidebarProps = {
    ...pacingProps,
    pagesPerWeek, partnerPagesPerWeek,
    nudgeSent, handleNudge, setShowLogProgress, setShowDnfConfirm,
  }

  const discussionProps: DiscussionPanelProps = {
    sessionId, filteredMessages, highlights, chapterFilter, setChapterFilter,
    chapterCount, totalPages, myPct, partnerPct,
    isActive, userId: user?.id,
    composerQuote, setComposerQuote,
    composerIsSpoiler, setComposerIsSpoiler, messageText, setMessageText,
    handleSend, handleKeyDown, sending, bottomRef, inputRef,
  }

  const highlightsProps: HighlightsContentProps = {
    highlights, highlightsByPage, sortedPages, isActive, setShowHighlight, userId: user?.id,
  }

  const rightProps: RightRailProps = {
    ...highlightsProps, myPct, myPages, partnerPct, partnerPages, partnerName,
    messageCount: messages.length, startedDate,
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: 'calc(100vh - 82px)', paddingBottom: 48 }}>
      <div className="container-mobile" style={{ paddingTop: 20 }}>

        {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap" style={{ marginBottom: 20 }}>
          <Link href="/reading-buddy"
            className="inline-flex items-center gap-2.5 font-bold transition-opacity hover:opacity-60"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            All Buddy Sessions
          </Link>
          <div className="hidden sm:flex items-center gap-1 font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--color-ink-3)' }}>
            <span>Buddies</span>
            <span style={{ padding: '0 4px' }}>/</span>
            <span style={{ textTransform: 'capitalize' }}>{session.status}</span>
            <span style={{ padding: '0 4px' }}>/</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 900 }}>
              {session.book.title.length > 20 ? session.book.title.slice(0, 18) + '…' : session.book.title}
            </span>
            <span style={{ padding: '0 6px' }}>·</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 900 }}>With {partnerName.split(' ')[0]}</span>
          </div>
        </div>

        {/* ── Hero strip ──────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: DARK_BG, border: '2px solid var(--color-ink)', boxShadow: '8px 8px 0px var(--color-accent)', borderRadius: 20, marginBottom: 16, paddingBottom: 24 }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: '65%', height: '100%', background: 'radial-gradient(ellipse at right center, rgba(170,60,10,0.65) 0%, transparent 62%)', pointerEvents: 'none' }} />

          <div style={{ padding: 'clamp(16px, 5vw, 28px) clamp(16px, 5vw, 32px) 0', display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
            {/* Cover */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: -4, right: -16, zIndex: 3, transform: 'rotate(8deg)', backgroundColor: MY_COLOR, color: '#1A1A1A', border: '1.5px solid #1A1A1A', borderRadius: 4, padding: '3px 7px', whiteSpace: 'nowrap', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block' }}>Buddy Read</span>
              </div>
              <Link href={`/books/${session.book.id}`} className="block transition-opacity hover:opacity-80">
                <div style={{ width: 108, aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '4px 5px 0px rgba(0,0,0,0.7)' }}>
                  <BookCoverImage src={session.book.cover_image_url} title={session.book.title} author={session.book.author_name ?? undefined} size="small" className="w-full h-full object-cover" />
                </div>
              </Link>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase' }}>
                  {startedDate ? `Started ${startedDate}` : 'Session'}&nbsp;&middot;&nbsp;Week {weekNumber}
                </span>
              </div>
              <h1 className="font-serif font-bold tracking-tight" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', color: CREAM, lineHeight: 1.05, marginBottom: 10 }}>
                {session.book.title}
              </h1>
              <p style={{ fontSize: 14, color: MUTED, marginBottom: 20, lineHeight: 1.4 }}>
                by <strong style={{ color: CREAM, fontWeight: 900 }}>{session.book.author_name ?? 'Unknown author'}</strong>
                {totalPages > 0 && <>&nbsp;&middot;&nbsp;{totalPages} pages</>}
              </p>
            </div>

            {/* Desktop action buttons */}
            {isActive && (
              <div className="hidden sm:flex flex-col gap-2 flex-none" style={{ paddingTop: 4}}>
                <button onClick={() => setShowLogProgress(true)}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0px #1A1A1A' }}
                  onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '4px 4px 0px #1A1A1A' }}
                  className="font-bold uppercase whitespace-nowrap"
                  style={{ fontSize: 13, letterSpacing: '0.18em', border: '2px solid #1A1A1A', borderRadius: 999, padding: '11px 22px', backgroundColor: MY_COLOR, color: '#1A1A1A', boxShadow: '4px 4px 0px var(--color-accent)', cursor: 'pointer' }}>
                  + Log Progress
                </button>
                <button onClick={() => setShowDnfConfirm(true)}
                  className="font-bold uppercase whitespace-nowrap transition-opacity hover:opacity-60"
                  style={{ fontSize: 12, letterSpacing: '0.18em', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 999, padding: '8px 12px', backgroundColor: 'transparent', color: DIM, cursor: 'pointer' }}>
                  Leave Session
                </button>
              </div>
            )}
          </div>

          {/* Reading with — full width pill */}
          <div style={{ padding: '0 clamp(16px, 5vw, 32px) 16px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '10px 16px' }}>
              <div style={{ position: 'relative', width: 46, height: 32, flexShrink: 0, paddingRight: 50 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: MY_COLOR, border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#1A1A1A', position: 'absolute', left: 0, zIndex: 2 }}>{myInitials}</div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: PTN_COLOR, border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: CREAM, position: 'absolute', left: 24, zIndex: 1 }}>{partnerInitials}</div>
              </div>
              <span style={{ fontSize: 14, color: '#afaeaa', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Reading with <strong style={{ fontWeight: 800, color: '#fff' }}>{partnerName.split(' ')[0]}</strong></span>
              <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#3f8b5c', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3f8b5c', flexShrink: 0, display: 'inline-block' }} />
                ACTIVE{partnerLastActive ? ` ${timeAgo(partnerLastActive)}` : ''}
              </span>
            </div>
          </div>

          {/* Mobile action buttons */}
          {isActive && (
            <div className="flex sm:hidden gap-2 px-4 pb-4">
              <button onClick={() => setShowLogProgress(true)}
                className="flex-1 font-bold uppercase text-center"
                style={{ fontSize: 10, letterSpacing: '0.16em', border: '2px solid #1A1A1A', borderRadius: 999, padding: '7px 10px', backgroundColor: MY_COLOR, color: '#1A1A1A', boxShadow: '2px 2px 0px #1A1A1A', cursor: 'pointer' }}>
                + Log Progress
              </button>
              <button onClick={handleNudge} disabled={nudgeSent}
                className="flex-1 font-bold uppercase text-center inline-flex items-center justify-center gap-1"
                style={{ fontSize: 10, letterSpacing: '0.16em', border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '7px 10px', backgroundColor: 'transparent', color: nudgeSent ? '#4ADE80' : CREAM, cursor: 'pointer' }}>
                <Bell size={10} /> {nudgeSent ? 'Sent' : 'Nudge'}
              </button>
              <button onClick={() => setShowDnfConfirm(true)}
                className="font-bold uppercase"
                style={{ fontSize: 10, letterSpacing: '0.16em', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '7px 10px', backgroundColor: 'transparent', color: DIM, cursor: 'pointer' }}>
                Leave
              </button>
            </div>
          )}
        </div>

        {/* ── Status banner (standalone, above the panels) ───────────────────── */}
        <StatusBanner
          isPending={isPending} isInvited={isInvited} isClosed={isClosed}
          sessionStatus={session.status}
          initiatorName={session.initiator.display_name || session.initiator.username}
          partnerName={partnerName}
          actionLoading={actionLoading}
          onAccept={handleAccept} onDecline={handleDecline}
        />

        {/* ── 3-panel body — panels float directly on canvas ──────────────────── */}
        {/* Desktop */}
        <div className="hidden lg:grid" style={{ gridTemplateColumns: '320px 1fr 320px', gap: 12, alignItems: 'start' }}>

          {/* Left column: pacing + milestone, stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ backgroundColor: 'var(--color-accent-teal)', borderRadius: 14, border: '2px solid var(--color-ink)', boxShadow: '6px 6px 0px var(--color-ink)', overflow: 'hidden' }}>
              <LeftSidebarContent {...leftProps} />
            </div>
            <div style={{ backgroundColor: 'var(--color-accent)', borderRadius: 14, border: '2px solid var(--color-ink)', boxShadow: '6px 6px 0px var(--color-ink)', overflow: 'hidden' }}>
              <NextMilestoneSidebarContent myPct={myPct} myPages={myPages} totalPages={totalPages} />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-canvas)', border: '2px solid var(--color-ink)', borderRadius: 14, boxShadow: '6px 6px 0px var(--color-ink)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'min(100vh, 1020px)' }}>
            {/* Center panel header */}
            <div style={{ padding: '16px 20px 14px', borderBottom: '2px solid var(--color-ink)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
                  <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>Discussion</span>
                </div>
                <p className="font-serif font-bold" style={{ fontSize: 24, color: 'var(--color-ink)', lineHeight: 1.1 }}>
                  With <em style={{ color: 'var(--color-accent)' }}>{partnerName.split(' ')[0]}</em>
                </p>
              </div>
              {isActive && (
                <div style={{ marginTop: 4, backgroundColor: '#3f8b5c', color: '#fff', borderRadius: 5, padding: '7px 11px', transform: 'rotate(-3deg)', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  SPOILER-SAFE
                </div>
              )}
            </div>
            <DiscussionPanel {...discussionProps} />
          </div>

          {/* Right column: highlights + activity, stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 14, border: '2px solid var(--color-ink)', boxShadow: '6px 6px 0px var(--color-accent-yellow)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'min(55vh, 600px)' }}>
              <HighlightsSidebarContent highlights={highlights} isActive={isActive} setShowHighlight={setShowHighlight} userId={user?.id} />
            </div>
            <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 14, border: '2px solid var(--color-ink)', boxShadow: '6px 6px 0px var(--color-accent-teal)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'min(44vh, 600px)' }}>
              <ActivitySidebarContent highlights={highlights} userId={user?.id} partnerName={partnerName} initiatorId={session.initiator.id} createdAt={createdAt} />
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <MobileTabBar active={mobileTab} onChange={setMobileTab} />
          <div style={{ paddingTop: 12 }}>
            <AnimatePresence mode="wait">
              <motion.div key={mobileTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                {mobileTab === 'pacing' && (
                  <div style={{ ...PANEL, minHeight: 360 }}>
                    <div style={PANEL_HEADER}>
                      <span className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: DIM }}>Pacing</span>
                    </div>
                    <PacingContent {...pacingProps} />
                  </div>
                )}
                {mobileTab === 'highlights' && (
                  <div style={{ ...PANEL, height: '65vh' }}>
                    <div style={PANEL_HEADER}>
                      <span className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: DIM }}>Highlights & Milestones</span>
                      {isActive && (
                        <button onClick={() => setShowHighlight(true)} className="font-bold text-xs flex items-center gap-1" style={{ color: MY_COLOR }}>
                          <Pencil className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                    <RightRailContent {...rightProps} />
                  </div>
                )}
                {mobileTab === 'discussion' && (
                  <div style={{ ...PANEL, height: '65vh' }}>
                    <div style={PANEL_HEADER}>
                      <span className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: DIM }}>Discussion</span>
                      {isActive && (
                        <span className="font-bold uppercase" style={{ fontSize: 8, letterSpacing: '0.16em', backgroundColor: '#2D6A4F', color: CREAM, borderRadius: 4, padding: '3px 7px' }}>
                          Spoiler-Safe
                        </span>
                      )}
                    </div>
                    <DiscussionPanel {...discussionProps} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Log Progress Modal ──────────────────────────────────────────────── */}
      <QuickUpdateModal
        userBook={myUserBook}
        isOpen={showLogProgress}
        onClose={() => setShowLogProgress(false)}
        onUpdate={() => fetchSession(sessionId)}
      />

      {/* ── Highlight Capture Modal ─────────────────────────────────────────── */}
      {showHighlight && (
        <HighlightCaptureModal
          sessionId={sessionId}
          bookTitle={session.book.title}
          bookAuthor={session.book.author_name ?? undefined}
          bookCoverUrl={(session.book as any).cover_image_url ?? undefined}
          pageCount={totalPages > 0 ? totalPages : undefined}
          chapterCount={chapterCount}
          partnerName={partnerName}
          partnerPages={partnerPages > 0 ? partnerPages : undefined}
          onClose={() => setShowHighlight(false)}
          onSave={async (payload) => {
            const highlight = await createHighlight(sessionId, payload)
            setShowHighlight(false)
            return highlight
          }}
        />
      )}

      {/* ── Leave Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDnfConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowDnfConfirm(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm p-6 space-y-4"
              style={{ backgroundColor: 'var(--color-canvas)', border: '2px solid var(--color-ink)', borderRadius: 20, boxShadow: '5px 5px 0px var(--color-ink)' }}>
              <h3 className="font-serif text-xl font-bold" style={{ color: 'var(--color-ink)' }}>Leave this session?</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-3)' }}>
                This closes the session. Your chat history and highlights stay intact.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowDnfConfirm(false)}
                  className="flex-1 py-3 font-bold text-sm rounded-2xl transition-all hover:opacity-80"
                  style={{ background: 'var(--color-surface)', border: '2px solid var(--color-ink)', color: 'var(--color-ink)' }}>
                  Keep reading
                </button>
                <button onClick={handleDnf} disabled={actionLoading === 'dnf'}
                  className="flex-1 py-3 font-bold text-sm rounded-2xl transition-all hover:opacity-80 disabled:opacity-60"
                  style={{ background: 'var(--color-ink)', color: 'var(--color-canvas)' }}>
                  {actionLoading === 'dnf' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Leave'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
