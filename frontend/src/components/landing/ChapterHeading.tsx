'use client'

import { motion } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────
   ChapterHeading — Narrative chapter markers that reinforce the
   scroll-triggered storytelling structure. Each chapter has a
   roman numeral, a title, and a subtle decorative rule.

   Animation: staggered word reveal with spring physics.
   ───────────────────────────────────────────────────────────── */

interface ChapterHeadingProps {
  number: string       // 'I', 'II', 'III', 'IV'
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

const WORD_SPRING = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 18,
  mass: 0.6,
}

export default function ChapterHeading({
  number,
  title,
  subtitle,
  align = 'left',
}: ChapterHeadingProps) {
  const words = title.split(' ')
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  return (
    <motion.div
      className={`flex flex-col gap-4 mb-12 sm:mb-16 ${alignment}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {/* Chapter number + decorative rule */}
      <motion.div
        className={`flex items-center gap-4 ${align === 'center' ? 'justify-center' : ''}`}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
        }}
      >
        <div
          className="h-px flex-shrink-0"
          style={{
            width: 32,
            backgroundColor: 'var(--color-accent)',
            opacity: 0.5,
          }}
        />
        <span
          className="text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Chapter {number}
        </span>
        <div
          className="h-px flex-shrink-0"
          style={{
            width: 32,
            backgroundColor: 'var(--color-accent)',
            opacity: 0.5,
          }}
        />
      </motion.div>

      {/* Title — word-by-word spring reveal */}
      <h2
        className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight"
        style={{ color: 'var(--color-lit)' }}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            style={{ marginRight: i < words.length - 1 ? '0.25em' : 0 }}
            variants={{
              hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  ...WORD_SPRING,
                  delay: 0.15 + i * 0.06,
                },
              },
            }}
          >
            {word}
          </motion.span>
        ))}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="text-base sm:text-lg max-w-lg leading-relaxed"
          style={{ color: 'var(--color-lit-2)' }}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { delay: 0.4, duration: 0.6, ease: [0.23, 1, 0.32, 1] },
            },
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
