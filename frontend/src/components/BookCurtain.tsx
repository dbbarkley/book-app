'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const SESSION_KEY = 'libraio_intro_v1'

// Cubic bezier for a sharp, book-cover snap
const BOOK_EASE = [0.76, 0, 0.24, 1] as const

export default function BookCurtain() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
      // Unmount after the animation fully exits
      setTimeout(() => setVisible(false), 2200)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="book-curtain"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            pointerEvents: 'all',
          }}
        >
          {/* ── Left panel ─────────────────────────────────── */}
          <motion.div
            style={{
              flex: 1,
              backgroundColor: 'var(--color-canvas)',
              position: 'relative',
            }}
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{ delay: 1.05, duration: 0.8, ease: BOOK_EASE }}
          >
            {/* Spine edge — glows on the right side of the left panel */}
            <motion.div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: 'var(--color-accent)',
                transformOrigin: 'center top',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{
                scaleY: [0, 1, 1, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                times: [0, 0.25, 0.75, 1],
                duration: 1.4,
                delay: 0.1,
                ease: 'easeOut',
              }}
            />
          </motion.div>

          {/* ── Right panel ────────────────────────────────── */}
          <motion.div
            style={{
              flex: 1,
              backgroundColor: 'var(--color-canvas)',
            }}
            initial={{ x: 0 }}
            animate={{ x: '100%' }}
            transition={{ delay: 1.05, duration: 0.8, ease: BOOK_EASE }}
          />

          {/* ── Centre — book mark + wordmark ──────────────── */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              times: [0, 0.12, 0.62, 0.82],
              duration: 1.8,
              ease: 'easeInOut',
            }}
          >
            {/* Animated book SVG */}
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Spine line — first to draw */}
              <motion.line
                x1="26" y1="7" x2="26" y2="45"
                stroke="var(--color-accent)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.08, duration: 0.28, ease: 'easeOut' }}
              />
              {/* Left cover */}
              <motion.path
                d="M5 7 L5 45 L26 45 L26 7 Z"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2, duration: 0.42, ease: 'easeOut' }}
              />
              {/* Right cover */}
              <motion.path
                d="M26 7 L26 45 L47 45 L47 7 Z"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.36, duration: 0.42, ease: 'easeOut' }}
              />
              {/* Text lines on left page */}
              {[14, 19, 24, 29, 34, 39].map((y, i) => (
                <motion.line
                  key={y}
                  x1="9"
                  y1={y}
                  x2={i % 3 === 2 ? 20 : 23}
                  y2={y}
                  stroke="var(--color-accent)"
                  strokeWidth="0.9"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.54 + i * 0.04, duration: 0.16 }}
                />
              ))}
            </svg>

            {/* Wordmark */}
            <motion.span
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '21px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                letterSpacing: '0.18em',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.38, ease: 'easeOut' }}
            >
              LIBRAIO
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
