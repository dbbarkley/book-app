'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

const SECTIONS = [
  {
    num: '01',
    heading: 'What we collect',
    body: [
      'When you create an account: your email address, display name, and username. Your password is hashed.',
      'When you use the app: the books you add to your shelf, your reading progress, ratings, notes, and any reviews you write. You chose to put this here; it stays here.',
      'Technical logs: standard server logs (IP address, request timestamps, browser type) that help us keep the service running. These are retained for 30 days and then deleted.',
    ],
  },
  {
    num: '02',
    heading: 'What we do with it',
    body: [
      'We use your email to send you account-related messages (password resets, security notices). That\'s it. No marketing emails unless you explicitly opt in.',
      'We use your shelf data to power the features you asked for: tracking your reading, showing your friends what you\'re reading, and surfacing books you might like based on your shelves.',
      'We use aggregate, anonymised data (e.g. "1,200 people read this book") to improve the app. This is never tied back to individual accounts.',
    ],
  },
  {
    num: '03',
    heading: 'What we never do',
    body: [
      'We do not sell your data. Not to advertisers, not to data brokers, not to anyone.',
      'We do not train AI or machine-learning models on your data. Your reading habits are not a training set.',
      'We do not share your personal data with third parties except where required to run the service (e.g. our hosting provider) or comply with law.',
      'We do not build advertising profiles on you. There are no ads on WellRead.',
    ],
  },
  {
    num: '04',
    heading: 'Third-party services',
    body: [
      'Google — if you sign up or log in with Google, we receive your name and email address from Google to create or identify your account. Google\'s privacy policy governs what they collect on their end.',
      'Facebook — if you sign up or log in with Facebook, we receive your name and email address from Facebook for the same purpose. Facebook\'s privacy policy governs their side.',
      'Google Books API — used to search for and display book metadata (titles, covers, descriptions). Your search query is sent to Google; no account or personal data is included.',
      'Book data APIs — we use OpenLibrary, Hardcover, and ISBNdb server-side to power recommendations and upcoming releases. Only book identifiers (titles, ISBNs) are sent — never your account details or shelf contents.',
      'Hosting & infrastructure — the app runs on standard cloud infrastructure. Our hosting providers process data only as instructed by us and have signed data-processing agreements.',
      'We don\'t use analytics trackers, ad networks, or any third-party JavaScript that phones home.',
    ],
  },
  {
    num: '05',
    heading: 'Your rights',
    body: [
      'Export: email privacy@getwellread.com to request a full export of your data. We\'ll send it within 30 days.',
      'Deletion: email privacy@getwellread.com to delete your account. This permanently removes your profile, shelf, notes, and all personal data within 30 days. (Self-service deletion is coming to Settings.)',
      'Correction: if any of your data is wrong, you can update most of it directly in Settings, or contact us for anything you can\'t change yourself.',
      'If you\'re in the EU/UK, you have additional rights under GDPR/UK GDPR: access, portability, restriction, and the right to object. Email privacy@getwellread.com to exercise any of these.',
    ],
  },
  {
    num: '06',
    heading: 'Data retention',
    body: [
      'Active accounts: we keep your data for as long as your account is open.',
      'Deleted accounts: personal data is purged within 30 days of deletion. Aggregate statistics derived from your data (e.g. a book\'s overall rating) may persist in anonymised form.',
      'Server logs: deleted after 30 days.',
    ],
  },
  {
    num: '07',
    heading: 'Changes to this policy',
    body: [
      'If we make material changes to how we handle your data, we\'ll notify you by email and post the updated policy here at least 14 days before it takes effect. The date at the top of this page shows when it was last updated.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--color-accent)' }}
              >
                Last updated May 2026
              </span>
            </div>

            <h1
              className="font-serif font-bold leading-[1.03] tracking-tight mb-6"
              style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              Privacy{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Policy.</em>
            </h1>

            <p className="text-xl leading-relaxed max-w-2xl" style={{ color: 'var(--color-ink-2)' }}>
              The short version: your reading data is yours. We collect only what we need to
              run the app, we don't sell it, and we don't train AI on it.
              The long version is below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SECTIONS ─────────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-16 sm:py-24">
          <div className="max-w-2xl flex flex-col" style={{ gap: 0 }}>
            {SECTIONS.map(({ num, heading, body }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE_OUT_STRONG, delay: i * 0.04 }}
                style={{
                  borderBottom: i < SECTIONS.length - 1 ? '1.5px dashed var(--color-rim)' : 'none',
                  paddingTop: 32,
                  paddingBottom: 32,
                }}
              >
                <div className="flex gap-5">
                  <span
                    className="font-serif font-black flex-shrink-0"
                    style={{ fontSize: 12, color: 'var(--color-accent)', letterSpacing: '0.05em', paddingTop: 4 }}
                  >
                    {num}
                  </span>
                  <div>
                    <h2
                      className="font-serif font-bold text-2xl mb-4"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {heading}
                    </h2>
                    <ul className="flex flex-col gap-3">
                      {body.map((point, j) => (
                        <li
                          key={j}
                          className="text-[15px] leading-relaxed flex gap-3"
                          style={{ color: 'var(--color-ink-2)' }}
                        >
                          <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }}>—</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────── */}
      <section>
        <div className="container-mobile py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT_STRONG }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <p
                className="font-serif font-bold mb-1"
                style={{ color: 'var(--color-ink)', fontSize: '1.3rem' }}
              >
                Questions about your data?
              </p>
              <p className="text-[14px]" style={{ color: 'var(--color-ink-2)' }}>
                Email us at{' '}
                <a
                  href="mailto:privacy@getwellread.com"
                  className="font-bold transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 3 }}
                >
                  privacy@getwellread.com
                </a>
              </p>
            </div>

            <div className="flex items-center gap-5 flex-shrink-0">
              <Link
                href="/manifesto"
                className="text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-ink)' }}
              >
                Read the Manifesto →
              </Link>
              <Link
                href="/"
                className="text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-ink-2)' }}
              >
                Back home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
