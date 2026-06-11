'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

export default function ManifestoPage() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        minHeight: '100vh',
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-6 px-3 py-1.5"
              style={{
                borderRadius: 5,
                border: '3px solid var(--color-accent)',
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-canvas)',
                fontWeight: '900',
                rotate: '-2deg',
                display: 'inline-block',
              }}
            >
              The Manifesto
            </span>

            <h1
              className="font-serif font-bold leading-[1.03] tracking-tight mb-6"
              style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}
            >
              We will{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>never</em>
              <br />
              use AI on{' '}
              <em style={{ color: 'var(--color-ink)', fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
                your data.
                <svg
                  aria-hidden="true"
                  style={{ position: 'absolute', bottom: -12, left: 0, width: '100%', overflow: 'visible' }}
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  height="10"
                >
                  <path
                    d="M0 8 Q50 2 100 8 Q150 14 200 8"
                    stroke="#F1C75B"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </em>
            </h1>

            <p className="text-xl leading-relaxed max-w-2xl" style={{ color: 'var(--color-ink-2)' }}>
              WellRead is a book tracker built by people who love reading. Not an engagement machine,
              not a data broker, not an AI playground. Just a quiet place to keep track of what you read.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STAMP + COPY ─────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-20 sm:py-28">
          <div className="grid lg:grid-cols-[30%_1fr] gap-16 items-center">

            {/* Left — NO AI stamp */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            >
              <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 360 }}>
                <defs>
                  <path id="m-ring-left" d="M 47.4,225 A 130,130 0 0,1 160,30" />
                  <path id="m-ring-right" d="M 160,30 A 130,130 0 0,1 272.6,225" />
                </defs>
                <circle cx="160" cy="160" r="152" fill="none" stroke="var(--color-ink)" strokeWidth="6" />
                <circle cx="160" cy="160" r="130" fill="none" stroke="#F1C75B" strokeWidth="44" />
                <circle cx="160" cy="160" r="108" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
                <text fontSize="11" fontWeight="900" letterSpacing="6" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase' }}>
                  <textPath href="#m-ring-left" startOffset="50%" textAnchor="middle" dy="-4">
                    BUILT BY READERS
                  </textPath>
                </text>
                <text x="160" y="30" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="900" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>·</text>
                <text fontSize="11" fontWeight="900" letterSpacing="6" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase' }}>
                  <textPath href="#m-ring-right" startOffset="52%" textAnchor="middle" dy="-4">
                    BUILT FOR READERS
                  </textPath>
                </text>
                <text
                  x="160" y="182"
                  textAnchor="middle"
                  fontSize="88"
                  fontWeight="900"
                  fill="var(--color-ink)"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  AI
                </text>
                <line
                  x1="78" y1="210" x2="242" y2="112"
                  stroke="var(--color-accent)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Right — principles */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
              className="flex flex-col gap-8"
            >
              {[
                {
                  num: '01',
                  heading: 'Your data is yours. Full stop.',
                  body: "Your shelf, your ratings, your notes, your reading history. None of it is sold, shared, or used to train anything.",
                },
                // {
                //   num: '02',
                //   heading: 'No engagement machine.',
                //   body: "We don't track time-in-app. We don't A/B test your feed to keep you scrolling. There are no push notifications designed to pull you back. Good books do that on their own.",
                // },
                {
                  num: '02',
                  heading: 'No AI-generated reviews, summaries, or recommendations.',
                  body: 'Recommendations come from people who share your taste.',
                },
                {
                  num: '03',
                  heading: 'Small team. Real people.',
                  body: "We're not a VC-backed platform with a growth mandate. There's no pressure to monetise your attention. The business model is simple: Readers don't pay anything. But, if you want to show you're support we'll accept a donation.",
                },
              ].map(({ num, heading, body }) => (
                <div key={num} className="flex gap-6">
                  <span
                    className="font-serif font-black flex-shrink-0"
                    style={{ fontSize: 13, color: 'var(--color-accent)', letterSpacing: '0.05em', paddingTop: 3 }}
                  >
                    {num}
                  </span>
                  <div>
                    <p className="font-serif font-bold text-xl mb-2" style={{ color: 'var(--color-ink)' }}>
                      {heading}
                    </p>
                    <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────── */}
      <section>
        <div className="container-mobile py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8"
          >
            <div>
              <p
                className="font-serif font-bold leading-tight mb-2"
                style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
              >
                Ready to just track your books?
              </p>
              <p className="text-[15px]" style={{ color: 'var(--color-ink-2)' }}>
                No algorithm required.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href="/signup"
                className="zine-btn zine-btn-primary"
              >
                <span>Start reading</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/"
                className="text-[13px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-ink)' }}
              >
                Back home →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
