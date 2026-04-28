'use client'

/**
 * LoginTransitionCurtain
 *
 * Three-phase login transition:
 *
 *   covering →
 *     Phase 1 (0–300ms):    Book icon + pulsing rings fade in at center
 *     Phase 2 (0–550ms):    Gold lines extend from book spine to viewport edges
 *     Phase 3 (520–1000ms): Canvas panels sweep outward from center, covering the screen
 *
 *   opening  → Panels split left/right (BOOK_EASE snap, same as BookCurtain)
 *   dismiss  → Whole curtain fades out on auth error
 *
 * The lines + panels animate together from the spine outward — like a book
 * spreading its covers, then snapping them shut over the screen.
 *
 * Respects prefers-reduced-motion: rings suppressed via CSS media query;
 * framer-motion skips animations when reduced-motion is active.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useCurtain } from '@/context/CurtainContext'

// Shared sharp ease for the panel snap (brand-consistent with BookCurtain)
const BOOK_EASE = [0.76, 0, 0.24, 1] as const

// Line grow: smooth accelerate-decelerate
const LINE_EASE = [0.4, 0, 0.2, 1] as const
const LINE_DUR  = 0.90   // seconds for gold lines to reach top/bottom edges

// Panels start just before lines finish so the handoff feels continuous
const PANEL_DELAY = 0.82
const PANEL_DUR   = 0.48

// CSS-animated pulse rings — reduced-motion handled by media query
const PULSE_STYLES = `
@keyframes loginRingPulse {
  0%   { transform: scale(0.85); opacity: 0.55; }
  100% { transform: scale(2.1);  opacity: 0; }
}
.login-ring   { animation: loginRingPulse 1.8s ease-out infinite; }
.login-ring-2 { animation: loginRingPulse 1.8s ease-out 0.75s infinite; }
@media (prefers-reduced-motion: reduce) {
  .login-ring, .login-ring-2 { display: none; }
}
`

export default function LoginTransitionCurtain() {
  const { state } = useCurtain()
  const visible   = state === 'covering' || state === 'opening'
  const isOpening = state === 'opening'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PULSE_STYLES }} />

      <AnimatePresence>
        {visible && (
          <motion.div
            key="login-transition-curtain"
            aria-hidden="true"
            style={{
              position:      'fixed',
              inset:         0,
              zIndex:        9999,
              pointerEvents: isOpening ? 'none' : 'all',
              // Canvas background hides the login form immediately (before
              // panels sweep in).  Cleared to transparent when opening so the
              // dashboard shows through as the panels slide apart.
              backgroundColor: isOpening ? 'transparent' : 'var(--color-canvas)',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >

            {/* ── Left panel — sweeps outward from spine to left edge ── */}
            {/*
              scaleX 0→1 with transformOrigin 'right center':
              the panel's right edge stays pinned at x=50% (spine),
              while its left edge expands toward x=0 (screen edge).

              On opening: slides the fully-expanded panel off-screen left.
            */}
            <motion.div
              style={{
                position:        'absolute',
                right:           '50%',
                top:             0,
                bottom:          0,
                width:           '50%',
                backgroundColor: 'var(--color-canvas)',
                transformOrigin: 'right center',
              }}
              initial={{ scaleX: 0 }}
              animate={
                isOpening
                  ? { scaleX: 1, x: '-100%' }
                  : { scaleX: 1, x: 0 }
              }
              transition={
                isOpening
                  ? { duration: 0.75, ease: BOOK_EASE }
                  : { duration: PANEL_DUR, ease: BOOK_EASE, delay: PANEL_DELAY }
              }
            />

            {/* ── Right panel — sweeps outward from spine to right edge ── */}
            <motion.div
              style={{
                position:        'absolute',
                left:            '50%',
                top:             0,
                bottom:          0,
                width:           '50%',
                backgroundColor: 'var(--color-canvas)',
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              animate={
                isOpening
                  ? { scaleX: 1, x: '100%' }
                  : { scaleX: 1, x: 0 }
              }
              transition={
                isOpening
                  ? { duration: 0.75, ease: BOOK_EASE }
                  : { duration: PANEL_DUR, ease: BOOK_EASE, delay: PANEL_DELAY }
              }
            />

            {/* ── Gold lines — extend from book spine to screen edges ── */}
            {/*
              Both lines sit above the panels (zIndex 1) so they stay visible
              as the panels sweep outward.  Together they form a continuous
              vertical gold line — the book spine stretching to fill the screen.
            */}

            {/* Upper line: grows upward from center */}
            <motion.div
              style={{
                position:        'absolute',
                left:            'calc(50% - 2px)',
                bottom:          '50%',
                width:           4,
                transformOrigin: 'bottom center',
                backgroundColor: 'var(--color-accent)',
                zIndex:          1,
              }}
              initial={{ height: 0 }}
              animate={{
                height:  isOpening ? 0 : '50vh',
                opacity: isOpening ? 0 : 1,
              }}
              transition={
                isOpening
                  ? { duration: 0.15 }
                  : { duration: LINE_DUR, ease: LINE_EASE }
              }
            />

            {/* Lower line: grows downward from center */}
            <motion.div
              style={{
                position:        'absolute',
                left:            'calc(50% - 2px)',
                top:             '50%',
                width:           4,
                transformOrigin: 'top center',
                backgroundColor: 'var(--color-accent)',
                zIndex:          1,
              }}
              initial={{ height: 0 }}
              animate={{
                height:  isOpening ? 0 : '50vh',
                opacity: isOpening ? 0 : 1,
              }}
              transition={
                isOpening
                  ? { duration: 0.15 }
                  : { duration: LINE_DUR, ease: LINE_EASE }
              }
            />

            {/* ── Book icon + pulsing rings ─────────────────────────── */}
            {/*
              Sits above panels and lines (zIndex 2).
              Fades in immediately when covering starts; fades out the instant
              opening begins so the panel split is the only thing moving.
            */}
            <motion.div
              style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            18,
                pointerEvents:  'none',
                zIndex:         2,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpening ? 0 : 1 }}
              transition={{ duration: 0.25 }}
            >
              {/* Rings + icon container */}
              <div style={{
                position:       'relative',
                width:          56,
                height:         56,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                {/* Pulse ring 1 */}
                <div
                  className="login-ring"
                  style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: '50%',
                    border:       '1.5px solid var(--color-accent)',
                  }}
                />
                {/* Pulse ring 2 (offset 0.75s) */}
                <div
                  className="login-ring-2"
                  style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: '50%',
                    border:       '1.5px solid var(--color-accent)',
                  }}
                />

                {/* Book SVG */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 52 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Left cover */}
                    <path
                      d="M5 7 L5 45 L26 45 L26 7 Z"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinejoin="round"
                    />
                    {/* Right cover */}
                    <path
                      d="M26 7 L26 45 L47 45 L47 7 Z"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinejoin="round"
                    />
                    {/* Spine */}
                    <line
                      x1="26" y1="7" x2="26" y2="45"
                      stroke="var(--color-accent)"
                      strokeWidth="2"
                    />
                    {/* Text lines on left page */}
                    {[14, 19, 24, 29, 34, 39].map((y, i) => (
                      <line
                        key={y}
                        x1="9"
                        y1={y}
                        x2={i % 3 === 2 ? 20 : 23}
                        y2={y}
                        stroke="var(--color-accent)"
                        strokeWidth="0.9"
                        strokeOpacity="0.4"
                      />
                    ))}
                  </svg>
                </motion.div>
              </div>

              {/* Wordmark */}
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
                style={{
                  fontFamily:    'var(--font-playfair), Georgia, serif',
                  fontSize:      '18px',
                  fontWeight:    700,
                  color:         'var(--color-accent)',
                  letterSpacing: '0.18em',
                }}
              >
                LIBRAIO
              </motion.span>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
