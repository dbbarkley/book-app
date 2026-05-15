'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────
   ClipRevealSection — Reveals its children via an animated
   clip-path tied to scroll progress.

   Directions:
     'up'      → content reveals from bottom to top
     'down'    → top to bottom
     'curtain' → splits from centre outward (book opening feel)
     'iris'    → circular reveal from centre

   Performance: clip-path is GPU-composited in modern browsers.
   Uses useScroll with target for per-section triggering.
   ───────────────────────────────────────────────────────────── */

type RevealDirection = 'up' | 'down' | 'curtain' | 'iris'

interface ClipRevealSectionProps {
  children: React.ReactNode
  direction?: RevealDirection
  className?: string
  /** 0-1: how far through the scroll range before reveal completes */
  speed?: number
}

export default function ClipRevealSection({
  children,
  direction = 'up',
  className,
  speed = 0.5,
}: ClipRevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })

  const progress = useSpring(
    useTransform(scrollYProgress, [0, speed], [0, 1]),
    { stiffness: 80, damping: 25 },
  )

  // Build the clip-path based on direction
  const clipPath = (() => {
    switch (direction) {
      case 'up':
        // inset(bottom) shrinks from bottom; we reveal upward
        return useTransform(progress, (p: number) => {
          const insetBottom = 100 - p * 100
          return `inset(0 0 ${insetBottom}% 0)`
        })
      case 'down':
        return useTransform(progress, (p: number) => {
          const insetTop = 100 - p * 100
          return `inset(${insetTop}% 0 0 0)`
        })
      case 'curtain':
        // Both sides close in, then open outward — like parting a book
        return useTransform(progress, (p: number) => {
          const insetSide = 50 - p * 50
          return `inset(0 ${insetSide}% 0 ${insetSide}%)`
        })
      case 'iris':
        return useTransform(progress, (p: number) => {
          const radius = p * 72
          return `circle(${radius}% at 50% 50%)`
        })
      default:
        return useTransform(progress, (p: number) => {
          const insetBottom = 100 - p * 100
          return `inset(0 0 ${insetBottom}% 0)`
        })
    }
  })()

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ clipPath }}>{children}</motion.div>
    </div>
  )
}
