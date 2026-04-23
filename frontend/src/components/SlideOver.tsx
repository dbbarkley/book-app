'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * SlideOver — responsive sheet/dialog.
 *
 * Mobile  (< 640 px): bottom sheet that slides up from the screen edge.
 *                      Grab handle is visible; drag down to dismiss.
 * Desktop (≥ 640 px): centered dialog with a subtle scale-in animation.
 *                      Click the backdrop or the × button to close.
 */
export default function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  // Detect viewport so we can use different motion configs.
  // Default to true (mobile-first) to avoid a layout flash on hydration.
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Spread drag props only on mobile — desktop dialogs should not be draggable
  const dragProps = isMobile
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0.05, bottom: 0.7 },
        onDragEnd: (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose()
        },
      }
    : {}

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="slide-over-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
          />

          {/* ── Panel ────────────────────────────────────────────────────── */}
          {/*
            The panel sits directly in the stacking context as a sibling to the
            backdrop. On mobile it's anchored to the bottom of the viewport; on
            desktop it's centred using the CSS translate trick (Framer Motion
            applies its own transforms on top of translate, so we use a wrapper
            div to handle centering and let Framer Motion handle the animation
            on the inner element).
          */}
          {isMobile ? (
            /* ── Mobile: bottom sheet ── */
            <motion.div
              key="slide-over-panel-mobile"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              {...dragProps}
              className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col overflow-hidden rounded-t-[28px]"
              style={{
                maxHeight: '92dvh',
                backgroundColor: 'var(--color-cave)',
                borderTop: '1px solid var(--color-rim-dark)',
                borderLeft: '1px solid var(--color-rim-dark)',
                borderRight: '1px solid var(--color-rim-dark)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              }}
            >
              <SheetContent title={title} onClose={onClose} isMobile>
                {children}
              </SheetContent>
            </motion.div>
          ) : (
            /* ── Desktop: centred dialog ── */
            /* Wrapper div handles the centering; Framer Motion animates the inner div */
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="slide-over-panel-desktop"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto w-full flex flex-col overflow-hidden rounded-[24px]"
                style={{
                  maxWidth: 520,
                  maxHeight: '88dvh',
                  backgroundColor: 'var(--color-cave)',
                  border: '1px solid var(--color-rim-dark)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <SheetContent title={title} onClose={onClose}>
                  {children}
                </SheetContent>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

// ── Shared sheet interior ──────────────────────────────────────────────────────

function SheetContent({
  title,
  onClose,
  isMobile = false,
  children,
}: {
  title?: string
  onClose: () => void
  isMobile?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      {/* Grab handle — mobile only */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--color-rim-dark)' }}
          />
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--color-rim-dark)' }}
      >
        {title && (
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-lit)', fontFamily: 'var(--font-serif, serif)' }}>
            {title}
          </h2>
        )}
        <button
          onClick={onClose}
          className="ml-auto p-2 rounded-full transition-colors"
          style={{ color: 'var(--color-lit-3)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        {children}
      </div>
    </>
  )
}
