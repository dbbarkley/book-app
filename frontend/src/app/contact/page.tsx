'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Bug, Lock, MessageSquare } from 'lucide-react'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

const CONTACTS = [
  {
    icon: MessageSquare,
    label: 'General',
    heading: 'Say hello.',
    body: 'Questions about the app, feedback, or just want to talk books.',
    email: 'hello@getwellread.com',
  },
  {
    icon: Bug,
    label: 'Bug Report',
    heading: 'Found a bug?',
    body: 'Tell us what broke, what you expected to happen, and what device you were on.',
    email: 'bugs@getwellread.com',
  },
  {
    icon: Lock,
    label: 'Privacy',
    heading: 'Data & privacy.',
    body: 'Data export, account deletion, GDPR requests, or anything about how we handle your information.',
    email: 'privacy@getwellread.com',
  },
  {
    icon: Mail,
    label: 'Press',
    heading: 'Working on a story?',
    body: 'Press enquiries, partnerships, or anything else that doesn\'t fit the above.',
    email: 'press@getwellread.com',
  },
]

export default function ContactPage() {
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
                We're real people
              </span>
            </div>

            <h1
              className="font-serif font-bold leading-[1.03] tracking-tight mb-6"
              style={{ color: 'var(--color-ink)', fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              Get in{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>touch.</em>
            </h1>

            <p className="text-xl leading-relaxed max-w-xl" style={{ color: 'var(--color-ink-2)' }}>
              No support ticket system. No chatbot. Just email — pick the right
              address below and a human will read it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT CARDS ────────────────────────────────────────── */}
      <section style={{ borderBottom: '2px solid var(--color-ink)' }}>
        <div className="container-mobile py-16 sm:py-24">
          <div className="grid sm:grid-cols-2 gap-6">
            {CONTACTS.map(({ icon: Icon, label, heading, body, email }, i) => (
              <motion.a
                key={email}
                href={`mailto:${email}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE_OUT_STRONG, delay: i * 0.07 }}
                style={{
                  display: 'block',
                  padding: '28px 32px',
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 14,
                  boxShadow: '5px 5px 0px var(--color-ink)',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.12s, transform 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '5px 5px 0px var(--color-accent)'
                  e.currentTarget.style.transform = 'translate(-1px, -1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '5px 5px 0px var(--color-ink)'
                  e.currentTarget.style.transform = 'translate(0, 0)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: 'var(--color-accent)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} style={{ color: '#fff' }} />
                  </div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-ink-3)' }}
                  >
                    {label}
                  </span>
                </div>

                <p
                  className="font-serif font-bold text-xl mb-2"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {heading}
                </p>
                <p
                  className="text-[14px] leading-relaxed mb-5"
                  style={{ color: 'var(--color-ink-2)' }}
                >
                  {body}
                </p>

                <span
                  className="text-[13px] font-bold"
                  style={{
                    color: 'var(--color-accent)',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--color-accent)',
                    textUnderlineOffset: 3,
                  }}
                >
                  {email}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <section>
        <div className="container-mobile py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT_STRONG }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
              We aim to reply within 2 business days.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/privacy"
                className="text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-ink)' }}
              >
                Privacy Policy →
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
