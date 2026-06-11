'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ArrowRight } from 'lucide-react'

interface GoalSettingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (goal: number) => Promise<void>
  onRemove?: () => Promise<void>
  isLoading?: boolean
  currentGoal?: number | null
  completedThisYear?: number
  lastYearCount?: number
}

const YEAR = new Date().getFullYear()

// ── Shelf drawing ──────────────────────────────────────────────────────────────

const SPINE_COLORS = ['#D5582E', '#234A5A', '#F1C75B', '#2D6A4F', '#1A1A1A']
const SPINE_ROTATIONS = [
  -1.5, 1.0, -0.8, 1.3, -1.1, 0.7, -1.4, 0.9,
  -0.6, 1.5, -1.0, 0.8, -1.2, 1.1, -0.7, 1.4,
  -0.9, 0.6, -1.6, 1.2, -0.5, 1.0, -1.3, 0.8,
  -1.1, 1.5, -0.7, 1.2, -1.4, 0.6, -1.0, 1.3,
  -0.9, 1.1, -1.5, 0.7,
]
const MAX_PER_ROW = 18
const MAX_DISPLAY  = MAX_PER_ROW * 2

function BookSpine({ filled, color, rotation }: { filled: boolean; color?: string; rotation: number }) {
  return (
    <div
      style={{
        width: 24, height: 76, flexShrink: 0,
        border: '2px solid var(--color-ink)',
        borderRadius: 4,
        backgroundColor: filled ? color : 'var(--color-canvas)',
        transform: `rotate(${rotation}deg)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 5, left: 3, right: 3, height: 1.5, borderRadius: 1,
        backgroundColor: filled ? 'rgba(255,255,255,0.28)' : 'rgba(26,26,26,0.18)' }} />
      {filled && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.75)' }} />
      )}
      <div style={{ position: 'absolute', bottom: 5, left: 3, right: 3, height: 1.5, borderRadius: 1,
        backgroundColor: filled ? 'rgba(255,255,255,0.28)' : 'rgba(26,26,26,0.18)' }} />
    </div>
  )
}

function ShelfDrawing({ goal, completed }: { goal: number; completed: number }) {
  const totalDisplay  = Math.min(goal, MAX_DISPLAY)
  const row1Count     = Math.min(totalDisplay, MAX_PER_ROW)
  const row2Count     = Math.max(0, totalDisplay - MAX_PER_ROW)
  const filledCount   = Math.min(completed, totalDisplay)

  function renderRow(startIdx: number, count: number) {
    return Array.from({ length: count }, (_, i) => {
      const gi = startIdx + i
      return (
        <BookSpine
          key={gi}
          filled={gi < filledCount}
          color={gi < filledCount ? SPINE_COLORS[gi % SPINE_COLORS.length] : undefined}
          rotation={SPINE_ROTATIONS[gi % SPINE_ROTATIONS.length]}
        />
      )
    })
  }

  return (
    <div
      style={{
        border: '2px solid var(--color-ink)',
        borderRadius: 12,
        backgroundColor: 'var(--color-surface)',
        padding: '14px 12px 10px',
      }}
    >
      <div style={{ display: 'flex', gap: 2, marginBottom: row2Count > 0 ? 6 : 8 }}>
        {renderRow(0, row1Count)}
      </div>
      {row2Count > 0 && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
          {renderRow(MAX_PER_ROW, row2Count)}
        </div>
      )}
      <div style={{ height: 3, backgroundColor: 'var(--color-ink)', borderRadius: 2 }} />
    </div>
  )
}

// ── Celebration screen ─────────────────────────────────────────────────────────

const CONFETTI_PIECES = [
  { dx: -108, dy: -82, size: 16, color: '#D5582E', rotate: 12  },
  { dx: -94,  dy: -18, size: 10, color: '#2D6A4F', rotate: -25 },
  { dx: -78,  dy:  78, size: 12, color: '#2D6A4F', rotate: 30  },
  { dx:  92,  dy: -88, size: 14, color: '#234A5A', rotate: -15 },
  { dx: 102,  dy:  -8, size: 11, color: '#F1C75B', rotate: 20  },
  { dx:  85,  dy:  80, size: 12, color: '#F1C75B', rotate: -8  },
]

function CelebrationScreen({ goal, onClose }: { goal: number; onClose: () => void }) {
  const stampText = `SIGNED · SEALED · ${YEAR} · PROMISED · SIGNED · SEALED · ${YEAR} · PROMISED · `
  return (
    <motion.div
      key="celebration"
      className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center px-8 py-8 scrollbar-hide"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >

      {/* Stamp + confetti wrapper */}
      <div style={{ position: 'relative', width: 240, height: 240, flexShrink: 0 }}>
        {/* Confetti */}
        {CONFETTI_PIECES.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: c.size, height: c.size,
              left: 120 + c.dx - c.size / 2,
              top:  120 + c.dy - c.size / 2,
              backgroundColor: c.color,
              border: '1.5px solid rgba(0,0,0,0.25)',
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}

        {/* SVG stamp */}
        <svg
          viewBox="0 0 180 180"
          width="180" height="180"
          style={{ position: 'absolute', left: 30, top: 30 }}
        >
          <defs>
            {/* Full clockwise circle starting at top-center */}
            <path
              id="stamp-ring-path"
              d="M 90 12 A 78 78 0 0 1 90 168 A 78 78 0 0 1 90 12"
            />
          </defs>
          {/* Yellow fill */}
          <circle cx="90" cy="90" r="84" fill="var(--color-accent-yellow)" stroke="var(--color-ink)" strokeWidth="2.5" />
          {/* Inner ring */}
          <circle cx="90" cy="90" r="68" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
          {/* Circular text */}
          <text
            fontSize="7.5"
            fontWeight="700"
            letterSpacing="2.8"
            fill="var(--color-ink)"
            fontFamily="Inter, sans-serif"
            textAnchor="start"
          >
            <textPath href="#stamp-ring-path" startOffset="0">
              {stampText}
            </textPath>
          </text>
        </svg>

        {/* Number + orange bar — centered on stamp */}
        <div style={{
          position: 'absolute', left: 30, top: 30,
          width: 180, height: 180,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span
            className="font-serif font-black"
            style={{ fontSize: 72, lineHeight: 1, color: 'var(--color-ink)' }}
          >
            {goal}
          </span>
          <div style={{ width: 48, height: 3, backgroundColor: 'var(--color-accent)', borderRadius: 2, marginTop: 8 }} />
        </div>
      </div>

      {/* PACT SIGNED sticker */}
      <div
        className="text-[11px] font-bold uppercase tracking-[0.22em] px-4 py-2 mt-4"
        style={{
          border: '2px solid var(--color-accent)',
          borderRadius: 6,
          color: 'var(--color-accent)',
          display: 'inline-block',
          transform: 'rotate(-2deg)',
        }}
      >
        Pact Signed
      </div>

      {/* Headline */}
      <h2
        className="font-serif font-bold mt-5 leading-[1.05]"
        style={{ fontSize: 'clamp(2rem, 6vw, 2.6rem)', color: 'var(--color-ink)' }}
      >
        Goal set.
      </h2>
      <h2
        className="font-serif font-bold italic leading-[1.05]"
        style={{ fontSize: 'clamp(2rem, 6vw, 2.6rem)', color: 'var(--color-accent)' }}
      >
        Let&apos;s go read.
      </h2>

      {/* Body */}
      <p className="text-[15px] leading-relaxed mt-4 max-w-xs" style={{ color: 'var(--color-ink-2)' }}>
        <strong style={{ color: 'var(--color-ink)' }}>{goal}</strong> books in {YEAR}.
        {' '}We&apos;ll show your pace on the library, never on a feed.
        {' '}You can change it whenever life changes.
      </p>

      {/* Button */}
      <button
        onClick={onClose}
        className="mt-8 flex items-center gap-2 font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-85"
        style={{
          backgroundColor: 'var(--color-ink)',
          color: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          borderRadius: 999,
          padding: '16px 32px',
          fontSize: 13,
          boxShadow: '4px 4px 0px var(--color-accent)',
        }}
      >
        Back To My Shelf <ArrowRight size={15} strokeWidth={2.5} />
      </button>

    </motion.div>
  )
}

// ── Pace presets ───────────────────────────────────────────────────────────────

const PACE_PRESETS = [
  { label: 'One a month',  count: 12  },
  { label: 'Two a month',  count: 24  },
  { label: 'One a week',   count: 52  },
]

function perMonth(goal: number)    { return (goal / 12).toFixed(1) }
function daysPerBook(goal: number) { return Math.round(365 / goal) }

export default function GoalSettingModal({
  isOpen,
  onClose,
  onSave,
  onRemove,
  isLoading,
  currentGoal,
  completedThisYear = 0,
  lastYearCount,
}: GoalSettingModalProps) {
  const [goal, setGoal] = useState(currentGoal || 12)
  const [showCelebration, setShowCelebration] = useState(false)
  const hasGoal = !!(currentGoal && currentGoal > 0)

  useEffect(() => {
    if (isOpen) {
      setGoal(currentGoal || 12)
      setShowCelebration(false)
    }
  }, [isOpen, currentGoal])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const increment = () => setGoal(p => p + 1)
  const decrement = () => setGoal(p => Math.max(1, p - 1))

  const vsLastYear = lastYearCount != null ? goal - lastYearCount : null

  const handleSave = async () => {
    const isNew = !hasGoal
    await onSave(goal)
    if (isNew) {
      setShowCelebration(true)
    } else {
      onClose()
    }
  }

  const handleRemove = async () => {
    if (onRemove) {
      await onRemove()
      onClose()
    }
  }

  // Build pace presets, adding "Match last year" if we have the data
  const pacePresets = lastYearCount != null && lastYearCount > 0
    ? [...PACE_PRESETS, { label: 'Match last year', count: lastYearCount }]
    : PACE_PRESETS

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="goal-backdrop"
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="goal-panel"
              className="pointer-events-auto w-full flex flex-col"
              style={{
                maxWidth: 580,
                maxHeight: '92dvh',
                backgroundColor: 'var(--color-canvas)',
                border: '2px solid var(--color-ink)',
                borderRadius: 20,
                boxShadow: '6px 6px 0px var(--color-ink)',
                overflow: 'hidden',
              }}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <AnimatePresence mode="wait">
                {showCelebration ? (
                  <CelebrationScreen key="celebration" goal={goal} onClose={onClose} />
                ) : (
                  <motion.div
                    key="form"
                    className="flex flex-col"
                    style={{ flex: 1, minHeight: 0 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >

              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="relative px-6 pt-5 pb-5 overflow-hidden">
                {/* Yellow circle decoration */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -60, right: -60,
                    width: 180, height: 180,
                    borderRadius: '50%',
                    border: '2px solid var(--color-ink)',
                    backgroundColor: 'var(--color-accent-yellow)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Dev-only celebration preview toggle */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => setShowCelebration(s => !s)}
                    className="absolute bottom-2 right-5 z-10 text-[9px] font-bold uppercase tracking-widest opacity-30 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    [preview celebration]
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 flex items-center justify-center z-10 transition-opacity hover:opacity-70"
                  style={{
                    width: 36, height: 36,
                    border: '2px solid var(--color-ink)',
                    borderRadius: 10,
                    backgroundColor: 'var(--color-canvas)',
                    color: 'var(--color-ink)',
                  }}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                {/* Eyebrow row */}
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5"
                    style={{
                      backgroundColor: 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 6,
                      color: 'var(--color-ink)',
                    }}
                  >
                    The Pact
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Annual Reading Pledge
                  </span>
                </div>

                {/* Headline */}
                <h2
                  className="font-serif font-bold leading-[1.05] tracking-tight mb-2 relative z-10"
                  style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: 'var(--color-ink)' }}
                >
                  Your{' '}
                  <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>{YEAR}</em>
                  {' '}goal.
                </h2>

                {/* Contextual message */}
                <p className="text-[14px] leading-snug relative z-10" style={{ color: 'var(--color-ink-2)' }}>
                  {hasGoal
                    ? <>You&apos;re <strong style={{ color: 'var(--color-ink)' }}>{completedThisYear}</strong> books in. Adjust if life looks different now — no penalty.</>
                    : 'How many books for the year? Loose number is fine. No streak counters.'
                  }
                </p>
              </div>

              {/* Dotted divider */}
              <div style={{ borderTop: '2px dashed var(--color-ink)' }} />

              {/* ── Scrollable body ──────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-5">

                {/* Number picker */}
                <div
                  className="flex items-center justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 16,
                    boxShadow: '4px 4px 0px var(--color-accent)',
                    padding: '24px 20px',
                  }}
                >
                  {/* Minus */}
                  <button
                    onClick={decrement}
                    className="flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70 active:scale-95"
                    style={{
                      width: 52, height: 52, borderRadius: 12,
                      border: '2px solid var(--color-ink)',
                      backgroundColor: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    <Minus size={22} strokeWidth={2.5} />
                  </button>

                  {/* Number */}
                  <div className="text-center flex-1">
                    <motion.span
                      key={goal}
                      initial={{ scale: 0.85, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="font-serif font-black block"
                      style={{ fontSize: 'clamp(4rem, 12vw, 6rem)', color: 'var(--color-ink)', lineHeight: 1 }}
                    >
                      {goal}
                    </motion.span>
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em] mt-1"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      Books in {YEAR}
                    </p>
                  </div>

                  {/* Plus */}
                  <button
                    onClick={increment}
                    className="flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 active:scale-95"
                    style={{
                      width: 52, height: 52, borderRadius: 12,
                      border: '2px solid var(--color-ink)',
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-canvas)',
                    }}
                  >
                    <Plus size={22} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Pacing stats */}
                <div
                  style={{
                    border: '2px solid var(--color-ink)',
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div className="grid grid-cols-3 divide-x-2" style={{ borderColor: 'var(--color-ink)' }}>
                    {[
                      { label: 'Per Month',    color: 'var(--color-accent)',      value: perMonth(goal),    sub: 'books' },
                      { label: 'Per Book',     color: 'var(--color-accent-teal)', value: daysPerBook(goal), sub: 'days'  },
                      ...(vsLastYear != null
                        ? [{ label: 'Vs Last Year', color: '#2D6A4F', value: `${vsLastYear >= 0 ? '+' : ''}${vsLastYear}`, sub: vsLastYear >= 0 ? 'more than last year' : 'fewer than last year' }]
                        : [{ label: 'Per Week', color: '#5B7FA6', value: (goal / 52).toFixed(1), sub: 'books' }]
                      ),
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col items-center justify-center py-4 px-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: stat.color }}>
                          {stat.label}
                        </p>
                        <p
                          className="font-serif font-black leading-none mb-1"
                          style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: 'var(--color-ink)' }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--color-ink-3)' }}>{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* The Shelf, Drawn */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                        The Shelf, Drawn
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--color-ink)' }}>
                        <span style={{ width: 10, height: 10, backgroundColor: 'var(--color-accent)', border: '1.5px solid var(--color-ink)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                        {completedThisYear} read
                      </span>
                      <span style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>·</span>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--color-ink-2)' }}>
                        <span style={{ width: 10, height: 10, backgroundColor: 'transparent', border: '1.5px solid var(--color-ink)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                        {Math.max(0, goal - completedThisYear)} to go
                      </span>
                    </div>
                  </div>
                  <ShelfDrawing goal={goal} completed={completedThisYear} />
                </div>

                {/* Pace presets */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                      Or Pick a Pace
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {pacePresets.map((preset) => {
                      const active = goal === preset.count
                      return (
                        <button
                          key={preset.count}
                          onClick={() => setGoal(preset.count)}
                          className="text-left transition-all"
                          style={{
                            padding: '14px 16px',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 12,
                            backgroundColor: active ? 'var(--color-ink)' : 'var(--color-canvas)',
                            color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
                          }}
                        >
                          <p className="font-serif font-bold leading-snug" style={{ fontSize: 16 }}>
                            {preset.label}
                          </p>
                          <p
                            className="text-[11px] font-bold uppercase tracking-[0.12em] mt-0.5"
                            style={{ color: active ? 'rgba(250,246,235,0.55)' : 'var(--color-ink-3)' }}
                          >
                            {preset.count} / year
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* ── Footer ────────────────────────────────────────────────── */}
              <div
                className="flex items-center gap-2 px-6 py-4"
                style={{ borderTop: '2px solid var(--color-ink)' }}
              >
                {hasGoal && onRemove && (
                  <button
                    onClick={handleRemove}
                    disabled={isLoading}
                    className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 disabled:opacity-40 flex-shrink-0"
                    style={{
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '12px 14px',
                      color: 'var(--color-ink)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Remove Goal
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 flex-shrink-0"
                  style={{
                    border: '2px solid var(--color-ink)',
                    borderRadius: 999,
                    padding: '12px 14px',
                    color: 'var(--color-ink)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Maybe Later
                </button>

                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-85 disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-ink)',
                    color: 'var(--color-canvas)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 999,
                    padding: '14px 20px',
                    fontSize: 13,
                  }}
                >
                  {isLoading ? 'Saving…' : (
                    <>Update the Pact <ArrowRight size={14} strokeWidth={2.5} /></>
                  )}
                </button>
              </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
