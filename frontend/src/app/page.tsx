'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@book-app/shared'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen, Search, Users, Lock, XCircle,
  ChevronRight, Check, ArrowRight, Quote,
} from 'lucide-react'

// ── Book cover mosaic — Open Library public covers ──────────────────────────
const COVERS = [
  { isbn: '9780439023481', bg: '#1a0a0a' }, // Hunger Games
  { isbn: '9780735224292', bg: '#0a0a1a' }, // Atomic Habits
  { isbn: '9780525559474', bg: '#0a1a1a' }, // Midnight Library
  { isbn: '9780062315007', bg: '#1a1200' }, // The Alchemist
  { isbn: '9780441013593', bg: '#0a0a2a' }, // Dune
  { isbn: '9781501156700', bg: '#1a0a1a' }, // Educated
  { isbn: '9780385545990', bg: '#1a0000' }, // Handmaid's Tale
  { isbn: '9781250301697', bg: '#001a0a' }, // Where Crawdads Sing
  { isbn: '9780571334650', bg: '#0a1a00' }, // Normal People
]

function BookCover({ isbn, bg, rotate = 0 }: { isbn: string; bg: string; rotate?: number }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 shadow-xl"
      style={{ aspectRatio: '2/3', transform: `rotate(${rotate}deg)`, backgroundColor: bg }}
    >
      <img
        src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
        alt=""
        className="w-full h-full object-cover"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// ── Shelf preview component ──────────────────────────────────────────────────
const SHELVES = [
  { label: 'Currently Reading', count: '3',   icon: BookOpen, accent: false, locked: false },
  { label: 'To Read',           count: '14',  icon: BookOpen, accent: false, locked: false },
  { label: 'Completed',         count: '62',  icon: Check,    accent: false, locked: false },
  { label: 'Did Not Finish',    count: '8',   icon: XCircle,  accent: false, locked: false },
  { label: 'Private',           count: '···', icon: Lock,     accent: true,  locked: true  },
]

function ShelfPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full max-w-xs mx-auto"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>My Library</p>
      </div>
      {SHELVES.map((shelf, i) => {
        const Icon = shelf.icon
        return (
          <div
            key={shelf.label}
            className="flex items-center gap-3 px-4 py-3 transition-colors"
            style={{
              borderBottom: i < SHELVES.length - 1 ? '1px solid var(--color-rim)' : undefined,
              backgroundColor: shelf.locked ? 'var(--color-accent-subtle)' : undefined,
            }}
          >
            <Icon
              size={15}
              style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit-3)', flexShrink: 0 }}
            />
            <span
              className="flex-1 text-sm font-medium"
              style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit)' }}
            >
              {shelf.label}
            </span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit-3)' }}
            >
              {shelf.count}
            </span>
            {shelf.locked && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
              >
                Only you
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I finally have somewhere to track everything I actually read, not just the books I feel like talking about.",
    name: 'Sarah M.',
    detail: 'Reader since 2024',
  },
  {
    quote: "The DNF shelf is such a small thing but it changed how I read. I stop books guilt-free now and still have a record of everything I tried.",
    name: 'James K.',
    detail: '112 books tracked',
  },
  {
    quote: "It just feels like it was made for readers, not for metrics. I actually want to open it every day.",
    name: 'Priya R.',
    detail: 'Avid reader',
  },
]

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="container-mobile pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.25em] mb-6 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', border: '1px solid var(--color-rim-accent)' }}
            >
              Your reading life, elevated
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] mb-6" style={{ color: 'var(--color-lit)' }}>
              The library<br />you always<br />wanted
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg" style={{ color: 'var(--color-lit-2)' }}>
              Track every book you read, including the ones just for you. Discover new reads. Connect with readers who actually get it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all shadow-lg"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all"
                style={{ border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-rim-accent)'; e.currentTarget.style.color = 'var(--color-lit)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-lit-2)' }}
              >
                <Search size={17} />
                Browse Books
              </Link>
            </div>
          </motion.div>

          {/* Right — book cover mosaic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="hidden lg:grid grid-cols-3 gap-3 relative"
          >
            {COVERS.map((cover, i) => (
              <BookCover
                key={cover.isbn}
                isbn={cover.isbn}
                bg={cover.bg}
                rotate={i % 3 === 1 ? -1.5 : i % 3 === 2 ? 1 : 0}
              />
            ))}
            {/* Gradient fade at bottom */}
            <div
              className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{ background: 'linear-gradient(to top, var(--color-canvas), transparent)' }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── DIFFERENTIATOR — Private shelf ───────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-[32px] p-8 sm:p-14 grid lg:grid-cols-2 gap-12 items-center"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            {/* Copy */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Lock size={16} style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
                  What sets us apart
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5" style={{ color: 'var(--color-lit)' }}>
                Read freely.<br />Track everything.<br />Share only what you want.
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-lit-2)' }}>
                Some books are just for you. A personal read, a sensitive topic, something you're not ready to talk about yet — whatever the reason, it's yours.
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-lit-2)' }}>
                Libraio's <strong style={{ color: 'var(--color-lit)' }}>Private shelf</strong> is completely invisible to everyone else. Add any book and it stays between you and your reading list — full stop.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  'Books you\'re not ready to talk about',
                  'Personal or sensitive topics',
                  'Guilty pleasures — no judgement',
                  'Anything you just want to track quietly',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                    >
                      <Check size={11} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-lit-2)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shelf visual */}
            <div>
              <ShelfPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── DIFFERENTIATOR — DNF shelf ───────────────────────────────────── */}
      <section className="container-mobile pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-[32px] p-8 sm:p-14 grid lg:grid-cols-2 gap-12 items-center"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
          >
            {/* Visual — DNF card */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div
                className="rounded-2xl p-6 w-full max-w-xs"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <XCircle size={16} style={{ color: 'var(--color-lit-3)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--color-lit)' }}>Did Not Finish</span>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>8 books</span>
                </div>
                {[
                  { title: 'Ulysses', author: 'James Joyce', page: 'p. 34' },
                  { title: 'Infinite Jest', author: 'David Foster Wallace', page: 'p. 211' },
                  { title: 'War and Peace', author: 'Leo Tolstoy', page: 'p. 89' },
                ].map(book => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: '1px solid var(--color-rim)' }}
                  >
                    <div className="w-8 h-11 rounded flex-shrink-0" style={{ backgroundColor: 'var(--color-grove)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--color-lit)' }}>{book.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-lit-3)' }}>{book.author}</p>
                    </div>
                    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--color-lit-3)' }}>{book.page}</span>
                  </div>
                ))}
                <p className="text-[11px] text-center mt-3 italic" style={{ color: 'var(--color-lit-3)' }}>
                  Stopped, not forgotten.
                </p>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-5">
                <XCircle size={16} style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
                  DNF Shelf
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5" style={{ color: 'var(--color-lit)' }}>
                It's okay to stop reading a book
              </h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-lit-2)' }}>
                Not every book is for every reader, and that's perfectly fine. Life's too short to push through something that isn't working for you.
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>
                Libraio has a dedicated <strong style={{ color: 'var(--color-lit)' }}>Did Not Finish</strong> shelf. Track where you stopped, keep a record, and move on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
              Everything your reading life needs
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-lit-2)' }}>
              Simple, focused tools built for readers — not for algorithms.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Track your shelves',
                desc: 'Organise every book into Reading, To Read, Completed, DNF, or Private. Your full reading life in one place.',
              },
              {
                icon: Search,
                title: 'Discover new reads',
                desc: 'Search millions of books, explore genres, and find your next favourite.',
              },
              {
                icon: Users,
                title: 'Connect with readers',
                desc: 'Follow other readers, see what they\'re reading, and discover books through people with real taste.',
              },
            ].map(feature => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-[28px] p-8 flex flex-col gap-5"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>{feature.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-lit)' }}>
              Up and running in minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{ backgroundColor: 'var(--color-rim)' }}
            />
            {[
              { step: '1', title: 'Search any book', desc: 'Find any title from our catalog of millions of books.' },
              { step: '2', title: 'Add it to a shelf', desc: 'Reading, To Read, Completed, DNF, or Private.' },
              { step: '3', title: 'Track your progress', desc: 'Update page counts, leave notes, and watch your library grow.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold font-serif relative z-10"
                  style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-rim-accent)', color: 'var(--color-accent)' }}
                >
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-lit)' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="rounded-[28px] p-7 flex flex-col gap-5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
              >
                <Quote size={20} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
                <p className="text-sm leading-relaxed flex-1 italic" style={{ color: 'var(--color-lit)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-lit)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-[32px] px-8 py-16 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(201,168,76,0.08) 100%)',
              border: '1px solid var(--color-rim-accent)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            }}
          >
            <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
              Start your reading journey
            </h2>
            <p className="text-base sm:text-lg mb-10 max-w-lg mx-auto" style={{ color: 'var(--color-lit-2)' }}>
              Join readers who track honestly, every book, every shelf, every page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold transition-all shadow-lg"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
              >
                Create a free account
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all"
                style={{ border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-rim-accent)'; e.currentTarget.style.color = 'var(--color-lit)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-lit-2)' }}
              >
                Browse books first
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: 'var(--color-lit-3)' }}>
              Free forever · No credit card required
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
