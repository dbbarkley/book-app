'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@book-app/shared'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
  BookOpen, Search, Users, Lock, XCircle, MessageCircle, Bookmark, Send,
  Check, ArrowRight, Quote, Twitter, Instagram, Mail,
} from 'lucide-react'
import BookCurtain from '@/components/BookCurtain'

// ── Book cover mosaic — Open Library public covers ──────────────────────────
const COVERS = [
  { isbn: '9780439023481', bg: '#1a0a0a', title: 'The Hunger Games',          author: 'Suzanne Collins'       },
  { isbn: '9780735224292', bg: '#0a0a1a', title: 'Atomic Habits',              author: 'James Clear'           },
  { isbn: '9780525559474', bg: '#0a1a1a', title: 'The Midnight Library',       author: 'Matt Haig'             },
  { isbn: '9780062315007', bg: '#1a1200', title: 'The Alchemist',              author: 'Paulo Coelho'          },
  { isbn: '9780441013593', bg: '#0a0a2a', title: 'Dune',                       author: 'Frank Herbert'         },
  { isbn: '9781501156700', bg: '#1a0a1a', title: 'Educated',                   author: 'Tara Westover'         },
  { isbn: '9780385545990', bg: '#1a0000', title: "The Handmaid's Tale",        author: 'Margaret Atwood'       },
  { isbn: '9781250301697', bg: '#001a0a', title: 'Where the Crawdads Sing',   author: 'Delia Owens'           },
  { isbn: '9780571334650', bg: '#0a1a00', title: 'Normal People',              author: 'Sally Rooney'          },
]

function BookCover({ isbn, bg, title, author, rotate = 0 }: {
  isbn: string; bg: string; title: string; author: string; rotate?: number
}) {
  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 shadow-xl"
      style={{ aspectRatio: '2/3', transform: `rotate(${rotate}deg)`, backgroundColor: bg }}
    >
      <img
        src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
        alt={`${title} by ${author}`}
        className="w-full h-full object-cover"
        loading="eager"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// ── Scroll-triggered animation helpers ──────────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function FadeUp({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-72px' }}
      variants={{
        hidden:  { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut', delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-72px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

// ── Reusable eyebrow pill ────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: 'var(--color-accent-subtle)',
        color: 'var(--color-accent)',
        border: '1px solid var(--color-rim-accent)',
      }}
    >
      {children}
    </span>
  )
}

// ── Ghost button shared style helpers ───────────────────────────────────────
const ghostStyle = {
  border: '1.5px solid var(--color-rim-accent)',
  color: 'var(--color-lit)',
} as const

function ghostHover(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.borderColor = 'var(--color-accent)'
  e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)'
}
function ghostLeave(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.borderColor = 'var(--color-rim-accent)'
  e.currentTarget.style.backgroundColor = 'transparent'
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
            <Icon size={15} style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit-3)', flexShrink: 0 }} />
            <span className="flex-1 text-sm font-medium" style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit)' }}>
              {shelf.label}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: shelf.locked ? 'var(--color-accent)' : 'var(--color-lit-3)' }}>
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

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(237,224,196,0.07)', backgroundColor: 'transparent' }}>
      <div className="container-mobile py-14 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-serif text-xl font-bold mb-3" style={{ color: 'var(--color-lit)' }}>Libraio</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-lit-2)' }}>
              A home for every book you read — and the ones you stopped.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter,   label: 'Twitter',   href: 'https://twitter.com/libraio' },
                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/libraio' },
                { icon: Mail,      label: 'Email',     href: 'mailto:hello@libraio.app' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--color-lit-3)', border: '1px solid var(--color-rim)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-rim-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-lit-3)'; e.currentTarget.style.borderColor = 'var(--color-rim)' }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-lit-3)' }}>Product</p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['Browse Books', '/search'],
                ['Get Started', '/signup'],
                ['Log In',       '/login'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-colors hover:underline" style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-lit-3)' }}>Company</p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['About',    '/about'],
                ['Blog',     '/blog'],
                ['Contact',  '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-colors hover:underline" style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-lit-3)' }}>Legal</p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['Privacy Policy',   '/privacy'],
                ['Terms of Service', '/terms'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-colors hover:underline" style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid var(--color-rim)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
            © {new Date().getFullYear()} Libraio. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
            Made for readers, not algorithms.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── Hero headline — word-by-word ink reveal ──────────────────────────────────
// Each word slides up and fades in with a quick stagger, like ink blooming
// onto a page. The <br /> between "library" and "you" is preserved.
const HEADLINE_LINE_1 = ['The', 'library']
const HEADLINE_LINE_2 = ['you', 'always', 'wanted']

function HeroHeadline() {
  return (
    <h1
      className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] mb-6"
      style={{ color: 'var(--color-lit)' }}
    >
      {/* Line 1 */}
      {HEADLINE_LINE_1.map((word, i) => (
        <motion.span
          key={`h1-${word}`}
          style={{ display: 'inline-block', marginRight: i < HEADLINE_LINE_1.length - 1 ? '0.28em' : 0 }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1 + i * 0.09,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}

      <br />

      {/* Line 2 */}
      {HEADLINE_LINE_2.map((word, i) => (
        <motion.span
          key={`h2-${word}`}
          style={{ display: 'inline-block', marginRight: i < HEADLINE_LINE_2.length - 1 ? '0.28em' : 0 }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1 + (HEADLINE_LINE_1.length + i) * 0.09,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Scroll-linked parallax for the book covers grid
  const { scrollY } = useScroll()
  const coversY = useTransform(scrollY, [0, 600], [0, -55])

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

      {/* ── FIRST-VISIT CINEMATIC INTRO ───────────────────────────────── */}
      <BookCurtain />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="container-mobile pt-12 pb-16 sm:pt-16 sm:pb-24">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Eyebrow>Your reading life, elevated</Eyebrow>
            </motion.div>

            {/* Word-by-word ink reveal headline */}
            <HeroHeadline />

            <motion.p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--color-lit-2)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.55, ease: 'easeOut' }}
            >
              Track every book you read, including the ones just for you. Discover new reads. Connect with readers who actually get it.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.5, ease: 'easeOut' }}
            >
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
                style={ghostStyle}
                onMouseEnter={ghostHover}
                onMouseLeave={ghostLeave}
              >
                <Search size={17} />
                Browse Books
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — book cover mosaic with scroll parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="hidden lg:block relative"
          >
            {/*
              useTransform gives a smooth parallax: as the user scrolls down,
              the covers drift upward slightly, creating a sense of depth
              between the hero text (which scrolls normally) and the covers.
            */}
            <motion.div
              style={{ y: coversY }}
              className="grid grid-cols-3 gap-3 relative"
            >
              {COVERS.map((cover, i) => (
                <BookCover
                  key={cover.isbn}
                  isbn={cover.isbn}
                  bg={cover.bg}
                  title={cover.title}
                  author={cover.author}
                  rotate={i % 3 === 1 ? -1.5 : i % 3 === 2 ? 1 : 0}
                />
              ))}
              {/* Gradient fade at bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--color-canvas), transparent)' }}
              />
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ── FEATURES — Everything your reading life needs ─────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-14">
            <Eyebrow>Everything you need</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
              Everything your reading life needs
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-lit-2)' }}>
              Simple, focused tools built for readers — not for algorithms.
            </p>
          </FadeUp>

          {/* Hero card — Private Shelf */}
          <FadeUp className="mb-5">
            <div
              className="rounded-[28px] p-8 sm:p-10 grid lg:grid-cols-2 gap-10 items-center"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                >
                  <Lock size={18} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
                  Your Private shelf
                </h3>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>
                  Some books are just for you. Track anything privately — completely invisible to everyone else. No judgement, no audience. Full stop.
                </p>
              </div>
              <div>
                <ShelfPreview />
              </div>
            </div>
          </FadeUp>

          {/* Three supporting feature cards */}
          <StaggerGrid className="grid md:grid-cols-3 gap-5">
            {/* DNF Shelf */}
            <motion.div
              variants={fadeUp}
              className="rounded-[28px] p-7 flex flex-col gap-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(237,224,196,0.06)' }}
              >
                <XCircle size={18} style={{ color: 'var(--color-lit-3)' }} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>DNF shelf</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-lit-2)' }}>
                  Stop guilt-free. Track where you left off and move on.
                </p>
              </div>
              <div
                className="rounded-xl p-3 mt-auto flex flex-col gap-0"
                style={{ backgroundColor: 'var(--color-grove)' }}
              >
                {[
                  { title: 'Ulysses', page: 'p. 34' },
                  { title: 'Infinite Jest', page: 'p. 211' },
                ].map((book, i) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-2.5 py-2"
                    style={{ borderTop: i > 0 ? '1px solid var(--color-rim)' : undefined }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--color-lit)' }}>{book.title}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--color-lit-3)' }}>{book.page}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Suggest a Book */}
            <motion.div
              variants={fadeUp}
              className="rounded-[28px] p-7 flex flex-col gap-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-success-light)' }}
              >
                <Send size={18} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>Suggest a book</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-lit-2)' }}>
                  Send a recommendation to a friend with a personal note about why they&apos;ll love it.
                </p>
              </div>
              <div
                className="rounded-xl p-3 mt-auto flex flex-col gap-2.5"
                style={{ backgroundColor: 'var(--color-grove)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-10 rounded flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-rim-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-lit)' }}>Project Hail Mary</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--color-lit-3)' }}>Andy Weir</p>
                  </div>
                  <Send size={11} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                </div>
                <div
                  className="rounded-lg p-2.5 text-[11px] italic leading-relaxed"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
                >
                  &ldquo;You loved The Martian, this one&apos;s even better. Trust me.&rdquo;
                </div>
              </div>
            </motion.div>

            {/* My Next Book */}
            <motion.div
              variants={fadeUp}
              className="rounded-[28px] p-7 flex flex-col gap-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent-subtle)' }}
              >
                <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--color-lit)' }}>My next book</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-lit-2)' }}>
                  Personalised picks based on your shelves and reading history.
                </p>
              </div>
              <div
                className="rounded-xl p-4 mt-auto flex flex-col items-center gap-2"
                style={{ backgroundColor: 'var(--color-grove)' }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-9 rounded-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-rim-accent)', transform: 'rotate(-5deg)' }} />
                  <div className="w-6 h-9 rounded-sm -mt-1" style={{ backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent)', opacity: 0.7 }} />
                  <div className="w-6 h-9 rounded-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-rim-accent)', transform: 'rotate(5deg)' }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>Based on your taste</span>
              </div>
            </motion.div>
          </StaggerGrid>
        </div>
      </section>

      {/* ── READING BUDDIES SPOTLIGHT ────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
              Reading is better with a friend
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-lit-2)' }}>
              Pick a book, invite a friend, and share the journey — page by page.
            </p>
          </FadeUp>

          <FadeUp>
          <div
            className="rounded-[28px] overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            {/* Top — passage + discussion */}
            <div className="grid lg:grid-cols-2">
              {/* Passage side */}
              <div className="p-8 sm:p-10" style={{ borderRight: '1px solid var(--color-rim)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <Image
                    src="https://covers.openlibrary.org/b/isbn/9798840903377-M.jpg"
                    alt="Carl's Doomsday Scenario"
                    width={32}
                    height={48}
                    className="rounded flex-shrink-0"
                    style={{ objectFit: 'cover' }}
                  />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-lit)' }}>Carl&apos;s Doomsday Scenario</p>
                    <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>Dungeon Crawler Carl #2 · Matt Dinniman</p>
                  </div>
                </div>

                <div
                  className="rounded-xl p-5 mb-4"
                  style={{ backgroundColor: 'var(--color-grove)', borderLeft: '3px solid var(--color-accent)' }}
                >
                  <p className="font-serif text-sm leading-relaxed italic" style={{ color: 'var(--color-lit-2)' }}>
                    &ldquo;The universe had rules. Those rules could be{' '}
                    <span className="px-1 rounded" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-lit)' }}>
                      gamed, exploited, and broken
                    </span>
                    . And if there was one thing Carl excelled at, it was finding ways to break things that weren&apos;t supposed to be broken.&rdquo;
                  </p>
                  <p className="text-xs mt-3" style={{ color: 'var(--color-lit-3)' }}>Floor 3 · p. 142</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
                  >
                    <Bookmark size={10} /> Highlighted by Jamie
                  </span>
                  <span
                    className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
                  >
                    <Bookmark size={10} /> You bookmarked this too
                  </span>
                </div>
              </div>

              {/* Discussion side */}
              <div className="p-8 sm:p-10">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2"
                  style={{ color: 'var(--color-lit-3)' }}
                >
                  <MessageCircle size={12} /> Discussion
                </p>

                <div className="flex flex-col gap-4">
                  {/* Jamie's message */}
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-surface)' }}
                    >
                      JK
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-success)' }}>Jamie K.</p>
                      <div
                        className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                        style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)' }}
                      >
                        This is such a Carl line. He&apos;s completely outmatched and his plan is just &ldquo;cool, let me find the exploit.&rdquo; I love this man.
                      </div>
                    </div>
                  </div>

                  {/* Your message */}
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                    >
                      You
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-accent)' }}>You</p>
                      <div
                        className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                        style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-lit-2)' }}
                      >
                        Floor 3 is where it really clicks. The first two floors were the tutorial — now the actual game starts. Princess Donut&apos;s reaction had me on the floor.
                      </div>
                    </div>
                  </div>

                  {/* Jamie's reply */}
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-surface)' }}
                    >
                      JK
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-success)' }}>Jamie K.</p>
                      <div
                        className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                        style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)' }}
                      >
                        Donut is carrying this entire series and she knows it. Okay this is easily a 5-star read, no question.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom — progress bars */}
            <div
              className="px-8 sm:px-10 py-5 grid grid-cols-2 gap-4"
              style={{ borderTop: '1px solid var(--color-rim)' }}
            >
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-grove)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    You
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-lit-3)' }}>Your progress</span>
                </div>
                <div className="w-full h-1 rounded-full mb-1.5" style={{ backgroundColor: 'var(--color-rim)' }}>
                  <div className="h-full rounded-full" style={{ width: '71%', backgroundColor: 'var(--color-accent)' }} />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>71%</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-grove)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                    style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-surface)' }}
                  >
                    JK
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-lit-3)' }}>Jamie&apos;s progress</span>
                </div>
                <div className="w-full h-1 rounded-full mb-1.5" style={{ backgroundColor: 'var(--color-rim)' }}>
                  <div className="h-full rounded-full" style={{ width: '67%', backgroundColor: 'var(--color-success)' }} />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>67%</p>
              </div>
            </div>
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-12">
            <Eyebrow>Readers love it</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-lit)' }}>
              Built for real readers
            </h2>
          </FadeUp>
          <StaggerGrid className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="rounded-[28px] p-7 flex flex-col gap-5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
              >
                <Quote size={20} style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
                <p className="text-sm leading-relaxed flex-1 italic" style={{ color: 'var(--color-lit)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-lit)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{t.detail}</p>
                </div>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="container-mobile py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
          <div
            className="rounded-[32px] px-8 py-16 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(201,168,76,0.08) 100%)',
              border: '1px solid var(--color-rim-accent)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            }}
          >
            <Eyebrow>Join Libraio</Eyebrow>
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
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all"
                style={ghostStyle}
                onMouseEnter={ghostHover}
                onMouseLeave={ghostLeave}
              >
                Browse Books
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: 'var(--color-lit-3)' }}>
              Free forever · No credit card required
            </p>
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <Footer />

    </div>
  )
}
