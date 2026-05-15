'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────
   ScrollSpine — A decorative SVG vine/spine that draws itself
   down the left margin as the user scrolls, connecting sections
   like chapters in a book.

   Performance rules:
   - Fixed position, pointer-events-none (no repaints on scroll)
   - Uses transform + opacity only
   - Hidden on mobile (< 1024px) to avoid clutter
   ───────────────────────────────────────────────────────────── */

export default function ScrollSpine() {
  const { scrollYProgress } = useScroll()

  // Draw the path as user scrolls
  const pathLength = useSpring(
    useTransform(scrollYProgress, [0, 0.95], [0, 1]),
    { stiffness: 60, damping: 30 },
  )

  // Fade in after a short scroll
  const opacity = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [0, 1, 1, 0])

  return (
    <div
      className="fixed left-8 top-0 bottom-0 w-12 pointer-events-none z-10 hidden lg:block"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Background track — faint ghost of the full path */}
        <path
          d="
            M 24 0
            L 24 120
            C 24 160, 8 180, 8 220
            C 8 260, 40 280, 40 320
            C 40 360, 12 380, 12 420
            L 12 480
            C 12 520, 36 540, 36 580
            C 36 620, 16 640, 16 680
            L 16 740
            C 16 780, 38 800, 38 840
            C 38 880, 20 900, 20 940
            L 20 1000
            C 20 1040, 30 1060, 24 1100
            L 24 1200
          "
          stroke="var(--color-rim)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Animated drawing path */}
        <motion.path
          d="
            M 24 0
            L 24 120
            C 24 160, 8 180, 8 220
            C 8 260, 40 280, 40 320
            C 40 360, 12 380, 12 420
            L 12 480
            C 12 520, 36 540, 36 580
            C 36 620, 16 640, 16 680
            L 16 740
            C 16 780, 38 800, 38 840
            C 38 880, 20 900, 20 940
            L 20 1000
            C 20 1040, 30 1060, 24 1100
            L 24 1200
          "
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength, opacity }}
        />

        {/* Chapter marker dots — appear as the path reaches them */}
        {[
          { cy: 120, label: 'I' },
          { cy: 420, label: 'II' },
          { cy: 680, label: 'III' },
          { cy: 940, label: 'IV' },
        ].map(({ cy, label }, i) => {
          const dotProgress = (cy / 1200) * 0.95
          return (
            <motion.g key={label}>
              <motion.circle
                cx="24"
                cy={cy}
                r="4"
                fill="var(--color-canvas)"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                style={{
                  opacity: useTransform(
                    scrollYProgress,
                    [dotProgress - 0.02, dotProgress + 0.01],
                    [0, 1],
                  ),
                }}
              />
              <motion.text
                x="24"
                y={cy + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--color-accent)"
                fontSize="5"
                fontWeight="700"
                fontFamily="var(--font-playfair), Georgia, serif"
                style={{
                  opacity: useTransform(
                    scrollYProgress,
                    [dotProgress - 0.02, dotProgress + 0.01],
                    [0, 1],
                  ),
                }}
              >
                {label}
              </motion.text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
