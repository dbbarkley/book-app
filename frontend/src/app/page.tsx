'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@book-app/shared'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
  BookOpen, Search, Lock, XCircle, MessageCircle, Bookmark, Send,
  Check, ArrowRight, Quote, Twitter, Instagram, Mail,
} from 'lucide-react'
import BookCurtain from '@/components/BookCurtain'
import ScrollSpine from '@/components/landing/ScrollSpine'
import ClipRevealSection from '@/components/landing/ClipRevealSection'
import ChapterHeading from '@/components/landing/ChapterHeading'
import InteractiveShelf from '@/components/landing/InteractiveShelf'

/* ═══════════════════════════════════════════════════════════════
   LIBRAIO LANDING PAGE — Scroll-Triggered Storytelling

   Structure (breaks the standard Hero → Features → Social → CTA):
     Prologue  — Cinematic book curtain + 3D hero
     Chapter I — "The problem" (why tracking sucks)
     Chapter II — "Your library, your way" (Private shelf, DNF, organise)
     Chapter III — "Better together" (Reading Buddies spotlight)
     Chapter IV — "What to read next" (Recommendations + social proof)
     Epilogue  — Climax CTA

   Animation toolkit:
     • Scroll-driven SVG spine connecting chapters
     • Clip-path reveals per section
     • 3D mouse-tracking book hero
     • Spring-physics word reveals
     • Interactive shelf demo
   ═══════════════════════════════════════════════════════════════ */

// ── Custom easing curves (from emil-design-eng skill) ───────
const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

// ── Book cover mosaic — Open Library public covers ──────────
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

// ── Scroll-triggered animation helpers ──────────────────────
function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.65,
        ease: EASE_OUT_STRONG,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT_STRONG },
  },
}

function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
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

// ── Reusable eyebrow pill ───────────────────────────────────
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

// ── Ghost button style helpers ──────────────────────────────
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

// ── Hero headline — word-by-word spring reveal ──────────────
const HEADLINE_LINE_1 = ['The', 'library']
const HEADLINE_LINE_2 = ['you', 'always', 'wanted']

const WORD_SPRING = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 16,
  mass: 0.6,
}

function HeroHeadline() {
  return (
    <h1
      className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6 tracking-tight"
      style={{ color: 'var(--color-lit)' }}
    >
      {HEADLINE_LINE_1.map((word, i) => (
        <motion.span
          key={`h1-${word}`}
          className="inline-block"
          style={{ marginRight: i < HEADLINE_LINE_1.length - 1 ? '0.28em' : 0 }}
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            ...WORD_SPRING,
            delay: 0.12 + i * 0.08,
          }}
        >
          {word}
        </motion.span>
      ))}
      <br />
      {HEADLINE_LINE_2.map((word, i) => (
        <motion.span
          key={`h2-${word}`}
          className="inline-block"
          style={{ marginRight: i < HEADLINE_LINE_2.length - 1 ? '0.28em' : 0 }}
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            ...WORD_SPRING,
            delay: 0.12 + (HEADLINE_LINE_1.length + i) * 0.08,
          }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  )
}

// ── Testimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:
      'I finally have somewhere to track everything I actually read, not just the books I feel like talking about.',
    name: 'Sarah M.',
    detail: 'Reader since 2024',
  },
  {
    quote:
      "The DNF shelf is such a small thing but it changed how I read. I stop books guilt-free now and still have a record of everything I tried.",
    name: 'James K.',
    detail: '112 books tracked',
  },
  {
    quote:
      "It just feels like it was made for readers, not for metrics. I actually want to open it every day.",
    name: 'Priya R.',
    detail: 'Avid reader',
  },
]

// ── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(237,224,196,0.07)',
        backgroundColor: 'transparent',
      }}
    >
      <div className="container-mobile py-14 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p
              className="font-serif text-xl font-bold mb-3"
              style={{ color: 'var(--color-lit)' }}
            >
              Libraio
            </p>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: 'var(--color-lit-2)' }}
            >
              A home for every book you read — and the ones you stopped.
            </p>
            <div className="flex items-center gap-3">
              {[
                {
                  icon: Twitter,
                  label: 'Twitter',
                  href: 'https://twitter.com/libraio',
                },
                {
                  icon: Instagram,
                  label: 'Instagram',
                  href: 'https://instagram.com/libraio',
                },
                {
                  icon: Mail,
                  label: 'Email',
                  href: 'mailto:hello@libraio.app',
                },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  style={{
                    color: 'var(--color-lit-3)',
                    border: '1px solid var(--color-rim)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-accent)'
                    e.currentTarget.style.borderColor =
                      'var(--color-rim-accent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-lit-3)'
                    e.currentTarget.style.borderColor = 'var(--color-rim)'
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Product
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['Browse Books', '/search'],
                ['Get Started', '/signup'],
                ['Log In', '/login'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:underline cursor-pointer"
                    style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit-2)')
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Company
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['About', '/about'],
                ['Blog', '/blog'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:underline cursor-pointer"
                    style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit-2)')
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Legal
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:underline cursor-pointer"
                    style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--color-lit-2)')
                    }
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
            &copy; {new Date().getFullYear()} Libraio. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
            Made with love for people who read.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: 'var(--color-accent)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      {/* ── PROLOGUE — Cinematic intro ─────────────────────────── */}
      <BookCurtain />

      {/* ── Scroll spine — SVG path drawing on scroll ──────────── */}
      <ScrollSpine />

      {/* ═══════════════════════════════════════════════════════════
          HERO — Asymmetric split with book cover mosaic
          Left: copy (left-aligned per design-taste skill)
          Right: 3x3 book cover grid with scroll parallax
          ═══════════════════════════════════════════════════════════ */}
      <section className="container-mobile pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pb-36">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_STRONG }}
            >
              <Eyebrow>Your reading life, elevated</Eyebrow>
            </motion.div>

            <HeroHeadline />

            <motion.p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--color-lit-2)' }}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: 0.55,
                duration: 0.6,
                ease: EASE_OUT_STRONG,
              }}
            >
              Track every book you read, including the ones just for you.
              Discover new reads. Connect with readers who actually get it.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5, ease: EASE_OUT_STRONG }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold shadow-lg cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-on)',
                  transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 200ms',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--color-accent-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--color-accent)')
                }
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = 'scale(0.97)')
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold cursor-pointer"
                style={{
                  ...ghostStyle,
                  transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), border-color 200ms, background-color 200ms',
                }}
                onMouseEnter={ghostHover}
                onMouseLeave={ghostLeave}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = 'scale(0.97)')
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                <Search size={17} />
                Browse Books
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — book cover mosaic with staggered entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_STRONG }}
            className="hidden lg:block relative"
          >
            <div className="grid grid-cols-3 gap-3 relative">
              {COVERS.map((cover, i) => (
                <motion.div
                  key={cover.isbn}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.06,
                    duration: 0.5,
                    ease: EASE_OUT_STRONG,
                  }}
                >
                  <BookCover
                    isbn={cover.isbn}
                    bg={cover.bg}
                    title={cover.title}
                    author={cover.author}
                    rotate={i % 3 === 1 ? -1.5 : i % 3 === 2 ? 1 : 0}
                  />
                </motion.div>
              ))}
              {/* Gradient fade at bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--color-canvas), transparent)' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Mobile — smaller cover row */}
        <motion.div
          className="lg:hidden mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="flex gap-3">
            {COVERS.slice(0, 3).map((book, i) => (
              <div
                key={book.isbn}
                className="rounded-lg overflow-hidden shadow-xl"
                style={{
                  width: 90,
                  height: 135,
                  transform: `rotate(${[-4, 0, 4][i]}deg)`,
                }}
              >
                <img
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                  alt={`${book.title} by ${book.author}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CHAPTER I — Your Library
          Interactive shelf demo + library feature highlights.
          Clip-path curtain reveal.
          ═══════════════════════════════════════════════════════════ */}
      <ClipRevealSection direction="curtain" className="relative" speed={0.6}>
        <section className="container-mobile py-24 sm:py-32 lg:py-40">
          <div className="max-w-7xl mx-auto">
            <ChapterHeading
              number="I"
              title="A home for how you actually read"
              subtitle="You read in ways that are messy, honest, and completely yours. Libraio was built to keep up."
            />

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
              {/* Left — Interactive shelf demo */}
              <FadeUp>
                <InteractiveShelf />
              </FadeUp>

              {/* Right — Library feature highlights (staggered) */}
              <StaggerGrid className="flex flex-col gap-5 lg:pt-4">
                {/* Private shelf */}
                <motion.div
                  variants={staggerChild}
                  className="rounded-[24px] p-6 sm:p-7"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim-accent)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                    >
                      <Lock
                        size={18}
                        style={{ color: 'var(--color-accent)' }}
                      />
                    </div>
                    <div>
                      <h3
                        className="font-serif text-lg font-bold mb-1"
                        style={{ color: 'var(--color-lit)' }}
                      >
                        Private shelf
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-lit-2)' }}
                      >
                        Some books are just for you. Track anything
                        privately — completely invisible to everyone else. Your
                        library, your boundaries.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* DNF shelf */}
                <motion.div
                  variants={staggerChild}
                  className="rounded-[24px] p-6 sm:p-7"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(237,224,196,0.06)' }}
                    >
                      <XCircle
                        size={18}
                        style={{ color: 'var(--color-lit-3)' }}
                      />
                    </div>
                    <div>
                      <h3
                        className="font-serif text-lg font-bold mb-1"
                        style={{ color: 'var(--color-lit)' }}
                      >
                        Guilt-free DNFs
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-lit-2)' }}
                      >
                        Put a book down and keep a record of it. Track where you
                        stopped, why you moved on, and what you tried — your
                        reading history stays complete.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Flexible shelves */}
                <motion.div
                  variants={staggerChild}
                  className="rounded-[24px] p-6 sm:p-7"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(237,224,196,0.06)' }}
                    >
                      <BookOpen
                        size={18}
                        style={{ color: 'var(--color-lit-3)' }}
                      />
                    </div>
                    <div>
                      <h3
                        className="font-serif text-lg font-bold mb-1"
                        style={{ color: 'var(--color-lit)' }}
                      >
                        Organize your way
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-lit-2)' }}
                      >
                        Currently reading, to-read, completed — the
                        classics are built in. Drag books between shelves and
                        watch your library take shape.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerGrid>
            </div>
          </div>
        </section>
      </ClipRevealSection>

      {/* ═══════════════════════════════════════════════════════════
          CHAPTER II — Discover & Share
          Private notes, suggest a book, and the Discover page.
          Clip-path up reveal.
          ═══════════════════════════════════════════════════════════ */}
      <ClipRevealSection direction="up" speed={0.55}>
        <section className="container-mobile py-24 sm:py-32 lg:py-40">
          <div className="max-w-7xl mx-auto">
            <ChapterHeading
              number="II"
              title="Beyond the shelf"
              subtitle="Your library is just the beginning. Add your thoughts, share what you love, and find your next favorite book."
            />

            {/* Feature cards — asymmetric layout */}
            <div className="grid md:grid-cols-5 gap-5">
              {/* Private notes — wide card */}
              <FadeUp className="md:col-span-3">
                <div
                  className="rounded-[24px] p-7 sm:p-8 h-full flex flex-col gap-4 cursor-default"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim-accent)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    transition: 'transform 300ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow =
                      '0 20px 60px rgba(0,0,0,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 12px 40px rgba(0,0,0,0.35)'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                  >
                    <Bookmark size={18} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h3
                    className="font-serif text-xl font-bold"
                    style={{ color: 'var(--color-lit)' }}
                  >
                    Private notes on every book
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-lit-2)' }}
                  >
                    Jot down your thoughts as you read — a favourite passage, a
                    question, a feeling you don&apos;t want to forget. Notes are
                    private by default and tied to each book, so you can revisit
                    them whenever you want.
                  </p>
                </div>
              </FadeUp>

              {/* Suggest to a friend — narrower card */}
              <FadeUp delay={0.1} className="md:col-span-2">
                <div
                  className="rounded-[24px] p-7 sm:p-8 h-full flex flex-col gap-4 cursor-default"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    transition: 'transform 300ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow =
                      '0 20px 60px rgba(0,0,0,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 12px 40px rgba(0,0,0,0.35)'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-success-light)' }}
                  >
                    <Send size={18} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <h3
                    className="font-serif text-xl font-bold"
                    style={{ color: 'var(--color-lit)' }}
                  >
                    Suggest a book
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-lit-2)' }}
                  >
                    Send a recommendation to a friend with a personal note about
                    why they&apos;ll love it. Better than a screenshot — they
                    can add it to their shelf in one tap.
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Discover page — full-width card */}
            <FadeUp delay={0.2} className="mt-5">
              <div
                className="rounded-[24px] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-rim)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  transition: 'transform 300ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow =
                    '0 20px 60px rgba(0,0,0,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow =
                    '0 12px 40px rgba(0,0,0,0.35)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(237,224,196,0.06)' }}
                >
                  <Search size={18} style={{ color: 'var(--color-lit-3)' }} />
                </div>
                <div>
                  <h3
                    className="font-serif text-xl font-bold mb-1"
                    style={{ color: 'var(--color-lit)' }}
                  >
                    Discover your next read
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-lit-2)' }}
                  >
                    Browse curated picks, see what friends are reading, and
                    explore new books tailored to your taste. Your next
                    favourite is closer than you think.
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </ClipRevealSection>

      {/* ═══════════════════════════════════════════════════════════
          CHAPTER III — Better Together
          Reading Buddies spotlight. Full-width immersive card.
          Clip-path iris reveal for dramatic entrance.
          ═══════════════════════════════════════════════════════════ */}
      <ClipRevealSection direction="iris" speed={0.55}>
        <section className="container-mobile py-24 sm:py-32 lg:py-40">
          <div className="max-w-7xl mx-auto">
            <ChapterHeading
              number="III"
              title="Reading is better with a friend"
              subtitle="Pick a book, invite a friend, and share the journey — page by page, highlight by highlight."
              align="center"
            />

            <FadeUp>
              <div
                className="rounded-[28px] overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-rim)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                {/* Top — passage + discussion */}
                <div className="grid lg:grid-cols-2">
                  {/* Passage side */}
                  <div
                    className="p-8 sm:p-10"
                    style={{ borderRight: '1px solid var(--color-rim)' }}
                  >
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
                        <p
                          className="text-sm font-bold"
                          style={{ color: 'var(--color-lit)' }}
                        >
                          Carl&apos;s Doomsday Scenario
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--color-lit-3)' }}
                        >
                          Dungeon Crawler Carl #2 · Matt Dinniman
                        </p>
                      </div>
                    </div>

                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        backgroundColor: 'var(--color-grove)',
                        borderLeft: '3px solid var(--color-accent)',
                      }}
                    >
                      <p
                        className="font-serif text-sm leading-relaxed italic"
                        style={{ color: 'var(--color-lit-2)' }}
                      >
                        &ldquo;The universe had rules. Those rules could be{' '}
                        <span
                          className="px-1 rounded"
                          style={{
                            backgroundColor: 'var(--color-accent-subtle)',
                            color: 'var(--color-lit)',
                          }}
                        >
                          gamed, exploited, and broken
                        </span>
                        . And if there was one thing Carl excelled at, it was
                        finding ways to break things that weren&apos;t supposed
                        to be broken.&rdquo;
                      </p>
                      <p
                        className="text-xs mt-3"
                        style={{ color: 'var(--color-lit-3)' }}
                      >
                        Floor 3 · p. 142
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--color-success-light)',
                          color: 'var(--color-success)',
                        }}
                      >
                        <Bookmark size={10} /> Highlighted by Jamie
                      </span>
                      <span
                        className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
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
                          style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'var(--color-surface)',
                          }}
                        >
                          JK
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] font-bold mb-1"
                            style={{ color: 'var(--color-success)' }}
                          >
                            Jamie K.
                          </p>
                          <div
                            className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                            style={{
                              backgroundColor: 'var(--color-grove)',
                              color: 'var(--color-lit-2)',
                            }}
                          >
                            This is such a Carl line. He&apos;s completely
                            outmatched and his plan is just &ldquo;cool, let me
                            find the exploit.&rdquo; I love this man.
                          </div>
                        </div>
                      </div>

                      {/* Your message */}
                      <div className="flex gap-3 items-start">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-accent-on)',
                          }}
                        >
                          You
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] font-bold mb-1"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            You
                          </p>
                          <div
                            className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                            style={{
                              backgroundColor: 'var(--color-accent-subtle)',
                              color: 'var(--color-lit-2)',
                            }}
                          >
                            Floor 3 is where it really clicks. The first two
                            floors were the tutorial — now the actual game
                            starts. Princess Donut&apos;s reaction had me on the
                            floor.
                          </div>
                        </div>
                      </div>

                      {/* Jamie's reply */}
                      <div className="flex gap-3 items-start">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                          style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'var(--color-surface)',
                          }}
                        >
                          JK
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] font-bold mb-1"
                            style={{ color: 'var(--color-success)' }}
                          >
                            Jamie K.
                          </p>
                          <div
                            className="rounded-xl rounded-tl-sm p-3 text-[13px] leading-relaxed"
                            style={{
                              backgroundColor: 'var(--color-grove)',
                              color: 'var(--color-lit-2)',
                            }}
                          >
                            Donut is carrying this entire series and she knows
                            it. Okay this is easily a 5-star read, no question.
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
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--color-grove)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-on)',
                        }}
                      >
                        You
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-lit-3)' }}
                      >
                        Your progress
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full mb-1.5"
                      style={{ backgroundColor: 'var(--color-rim)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                        initial={{ width: '0%' }}
                        whileInView={{ width: '71%' }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.3,
                          duration: 1.2,
                          ease: EASE_DRAWER,
                        }}
                      />
                    </div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      71%
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--color-grove)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                        style={{
                          backgroundColor: 'var(--color-success)',
                          color: 'var(--color-surface)',
                        }}
                      >
                        JK
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-lit-3)' }}
                      >
                        Jamie&apos;s progress
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full mb-1.5"
                      style={{ backgroundColor: 'var(--color-rim)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--color-success)' }}
                        initial={{ width: '0%' }}
                        whileInView={{ width: '67%' }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.5,
                          duration: 1.2,
                          ease: EASE_DRAWER,
                        }}
                      />
                    </div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: 'var(--color-success)' }}
                    >
                      67%
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </ClipRevealSection>

      {/* ═══════════════════════════════════════════════════════════
          CHAPTER IV — What to Read Next
          Social proof woven into the narrative, not a separate section.
          Testimonials feel like part of the story.
          ═══════════════════════════════════════════════════════════ */}
      <section className="container-mobile py-24 sm:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto">
          <ChapterHeading
            number="IV"
            title="Built for real readers"
            subtitle="People who read because they love it — and want a space that loves it back."
            align="center"
          />

          {/* Testimonials — asymmetric layout, not 3 equal cards */}
          <div className="grid md:grid-cols-5 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp
                key={t.name}
                delay={i * 0.1}
                className={i === 0 ? 'md:col-span-3' : i === 1 ? 'md:col-span-2' : 'md:col-span-5'}
              >
                <div
                  className="rounded-[24px] p-7 sm:p-8 flex flex-col gap-4 h-full"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-rim)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  <Quote
                    size={20}
                    style={{ color: 'var(--color-accent)', opacity: 0.6 }}
                  />
                  <p
                    className="text-sm sm:text-base leading-relaxed flex-1 italic"
                    style={{ color: 'var(--color-lit)' }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--color-rim)' }}>
                    {/* Avatar initial */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                        border: '1px solid var(--color-rim-accent)',
                      }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: 'var(--color-lit)' }}
                      >
                        {t.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--color-lit-3)' }}
                      >
                        {t.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          EPILOGUE — Climax CTA
          The final push. Not a copy-paste of the hero — a genuine
          narrative conclusion with a different emotional hook.
          ═══════════════════════════════════════════════════════════ */}
      <ClipRevealSection direction="curtain" speed={0.5}>
        <section className="container-mobile py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div
                className="rounded-[32px] px-8 py-16 sm:py-20 text-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(145deg, var(--color-surface) 0%, rgba(201,168,76,0.1) 50%, var(--color-surface) 100%)',
                  border: '1px solid var(--color-rim-accent)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                {/* Decorative elements */}
                <div
                  className="absolute top-6 left-6 w-16 h-16 rounded-full opacity-20 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
                  }}
                />
                <div
                  className="absolute bottom-8 right-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
                  }}
                />

                <div className="relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
                  >
                    <Eyebrow>The story starts here</Eyebrow>
                  </motion.div>

                  <h2
                    className="font-serif text-3xl sm:text-5xl font-bold mb-5 tracking-tight"
                    style={{ color: 'var(--color-lit)' }}
                  >
                    Your next chapter awaits
                  </h2>
                  <p
                    className="text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed"
                    style={{ color: 'var(--color-lit-2)' }}
                  >
                    Join readers who track honestly — every book, every shelf,
                    every page. The library you always wanted is one click away.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-bold shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-accent-on)',
                        transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 200ms',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'var(--color-accent-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'var(--color-accent)')
                      }
                      onMouseDown={(e) =>
                        (e.currentTarget.style.transform = 'scale(0.97)')
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.transform = 'scale(1)')
                      }
                    >
                      Get Started Free
                      <ArrowRight size={18} />
                    </Link>
                    <Link
                      href="/search"
                      className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold cursor-pointer"
                      style={{
                        ...ghostStyle,
                        transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), border-color 200ms, background-color 200ms',
                      }}
                      onMouseEnter={ghostHover}
                      onMouseLeave={ghostLeave}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.transform = 'scale(0.97)')
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.transform = 'scale(1)')
                      }
                    >
                      Browse Books
                    </Link>
                  </div>
                  <p
                    className="mt-6 text-xs"
                    style={{ color: 'var(--color-lit-3)' }}
                  >
                    Free forever · No credit card required
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </ClipRevealSection>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
