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
import ScrollSpine from '@/components/landing/ScrollSpine'
import ClipRevealSection from '@/components/landing/ClipRevealSection'
import ChapterHeading from '@/components/landing/ChapterHeading'
import InteractiveShelf from '@/components/landing/InteractiveShelf'
import SiteFooter from '@/components/SiteFooter'

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
  color: 'var(--color-ink)',
} as const

function ghostHover(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.borderColor = 'var(--color-accent)'
  e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)'
}
function ghostLeave(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.borderColor = 'var(--color-rim-accent)'
  e.currentTarget.style.backgroundColor = 'transparent'
}

// ── Hero headline ────────────────────────────────────────────
function HeroHeadline() {
  return (
    <h1
      className="font-serif text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.05] mb-6 tracking-tight"
      style={{ color: 'var(--color-ink)' }}
    >
      A quiet shelf
      <br />
      for a { ' '} <em style={{ color: 'var(--color-accent)', fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>loud</em>
      <br />
      <em style={{ color: 'var(--color-ink)', fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
        reading life
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', bottom: -14, left: 0, width: '100%', overflow: 'visible' }}
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
  )
}

// ── Reading Buddies chat mockup ─────────────────────────────
function BuddiesMockup() {
  return (
    <div
      style={{
        border: '2px solid var(--color-ink)',
        boxShadow: '5px 5px 0px var(--color-ink)',
        backgroundColor: 'var(--color-canvas)',
        maxWidth: 400,
        width: '100%',
      }}
    >
      <div style={{ borderBottom: '2px solid var(--color-ink)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'var(--color-surface)' }}>
        <div style={{ width: 30, height: 45, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.2)' }}>
          <img src="https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.2 }}>Tomorrow and Tomorrow</p>
          <p style={{ fontSize: 10, color: 'var(--color-ink-2)', marginTop: 2 }}>Chapter 18 · 2 readers synced</p>
        </div>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {[{ l: 'S', bg: 'var(--color-accent)' }, { l: 'J', bg: 'var(--color-accent-purple)', ml: -8 }].map(({ l, bg, ml }, i) => (
            <div key={l} style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: bg, border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', marginLeft: ml ?? 0 }}>{l}</div>
          ))}
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-rim)', padding: '8px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Progress</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-ink-3)' }}>68%</span>
        </div>
        <div style={{ height: 4, backgroundColor: 'var(--color-rim)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '68%', height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>S</div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Sarah</p>
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '8px 10px' }}>
              <p style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.4 }}>wait did you get to the end of ch17 yet?? 😭</p>
            </div>
          </div>
        </div>

        <div style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: 'var(--color-accent-subtle)', marginLeft: 34 }}>
          <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--color-ink-2)', lineHeight: 1.5 }}>"The only consolation in grief is getting to grieve."</p>
          <p style={{ fontSize: 9, color: 'var(--color-ink-3)', marginTop: 4, fontWeight: 700 }}>📍 p. 289 · Sarah highlighted this</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-accent-purple)', marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' as const, textAlign: 'right' as const }}>Jamie</p>
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '8px 10px' }}>
              <p style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.4 }}>YES. I had to put it down for a second</p>
            </div>
          </div>
          <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--color-accent-purple)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>J</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>S</div>
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '8px 10px' }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.4 }}>the way zevin writes about friendship... 🥲</p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '2px solid var(--color-ink)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 36, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <span style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>Message your buddy...</span>
        </div>
        <div style={{ width: 36, height: 36, backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={14} style={{ color: '#fff' }} />
        </div>
      </div>
    </div>
  )
}

// ── Library mockup ──────────────────────────────────────────
const LIBRARY_BOOKS = [
  { id: '1', title: 'Atomic Habits',       author: 'James Clear',     cover: '#1B2A6B', shelf: 'reading', badge: 'READING' },
  { id: '2', title: 'The Midnight Library',author: 'Matt Haig',       cover: '#1B3A2A', shelf: 'reading', badge: 'READING' },
  { id: '3', title: 'The Alchemist',       author: 'Paulo Coelho',    cover: '#3B2E1A', shelf: 'finished' },
  { id: '4', title: 'Dune',                author: 'Frank Herbert',   cover: '#1A1005', shelf: 'finished' },
  { id: '5', title: 'Educated',            author: 'Tara Westover',   cover: '#2A1A0A', shelf: 'finished' },
  { id: '6', title: "The Handmaid's Tale", author: 'Margaret Atwood', cover: '#5C1A1A', shelf: 'private', locked: true },
  { id: '7', title: 'Where the Crawdads Sing', author: 'Delia Owens', cover: '#1A3A3A', shelf: 'dnf', dnf: true },
  { id: '8', title: 'Normal People',       author: 'Sally Rooney',    cover: '#1A3A4A', shelf: 'finished' },
] as const

const SHELF_TABS = [
  { id: 'all',      label: 'All',      count: 8 },
  { id: 'reading',  label: 'Reading',  count: null },
  { id: 'finished', label: 'Finished', count: null },
  { id: 'dnf',      label: 'DNF',      count: null },
  { id: 'private',  label: 'Private',  count: null },
] as const

function LibraryMockup() {
  return (
    <div className="zine-card shadow-zine-ink p-6 overflow-hidden"
    >
      {/* Shelf tabs */}
      <div
        className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        {SHELF_TABS.map((tab, i) => (
          <button
            key={tab.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold whitespace-nowrap flex-shrink-0 transition-opacity"
            style={
              i === 0
                ? {
                    backgroundColor: 'var(--color-ink)',
                    color: 'var(--color-canvas)',
                    borderRadius: 999,
                    border: '1.5px solid var(--color-ink)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--color-ink)',
                    borderRadius: 999,
                    border: '1.5px solid var(--color-rim)',
                  }
            }
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className="text-[10px] font-bold px-1 rounded"
                style={
                  i === 0
                    ? { color: 'var(--color-accent-yellow)' }
                    : { color: 'var(--color-ink-3)' }
                }
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4×2 book grid */}
      <div className="grid grid-cols-4 gap-2.5 p-4">
        {LIBRARY_BOOKS.map((book) => (
          <div key={book.id} className="flex flex-col gap-1">
            {/* Book cover */}
            <div
              className="relative"
              style={{
                aspectRatio: '2/3',
                backgroundColor: book.cover,
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.25)',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Author at top */}
              <p
                className="absolute top-0 left-0 right-0 px-1.5 pt-1.5 text-[8px] font-bold uppercase tracking-[0.08em] leading-tight"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {book.author}
              </p>

              {/* Title at bottom */}
              <p
                className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 font-serif text-[11px] font-bold leading-tight"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {book.title}
              </p>

              {/* Spine highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 3,
                  height: '100%',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
                }}
              />

              {/* READING badge */}
              {'badge' in book && book.badge && (
                <div
                  className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[8px] font-bold tracking-[0.12em]"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                >
                  {book.badge}
                </div>
              )}

              {/* Lock icon */}
              {'locked' in book && book.locked && (
                <div
                  className="absolute top-1.5 right-1.5 flex items-center justify-center"
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: 'var(--color-accent-yellow)',
                    border: '1px solid var(--color-ink)',
                    borderRadius: 3,
                  }}
                >
                  <Lock size={9} style={{ color: 'var(--color-ink)' }} />
                </div>
              )}

              {/* DNF stamp */}
              {'dnf' in book && book.dnf && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
                >
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-widest"
                    style={{
                      border: '1.5px solid #fff',
                      color: '#fff',
                      borderRadius: 2,
                      backgroundColor: 'rgba(213,88,46,0.85)',
                    }}
                  >
                    DNF
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Reading Buddies chat mockup ──────────────────────────────
function BuddiesChatMockup() {
  return (
    <div className="zine-card shadow-zine-accent p-6 overflow-hidden"
    >
      {/* Header — dark navy */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: '#1B2A4A', borderBottom: '2px solid var(--color-ink)' }}
      >
        {/* Book cover thumbnail */}
        <div
          style={{
            width: 32,
            height: 48,
            flexShrink: 0,
            borderRadius: 3,
            backgroundColor: '#2A3F6B',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate" style={{ color: '#fff' }}>
            Tomorrow, and Tomorrow, and Tomorrow
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Gabrielle Zevin · with Alex
          </p>
        </div>
        {/* Chapter badge */}
        <span
          className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1"
          style={{
            backgroundColor: 'var(--color-accent-yellow)',
            color: 'var(--color-ink)',
            borderRadius: 999,
          }}
        >
          CH. 4
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 px-4 py-5">

        {/* Alex — left */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              border: '2px solid var(--color-ink)',
            }}
          >
            A
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>Alex</span>
            <div
              className="px-3 py-2.5 text-[13px] leading-relaxed"
              style={{
                border: '1.5px solid var(--color-rim)',
                borderRadius: '2px 12px 12px 12px',
                color: 'var(--color-ink)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              Sam and Sadie's first design session, this is going to be the relationship of the book and they don't even know it.
            </div>
          </div>
        </div>

        {/* You — right */}
        <div className="flex items-end gap-3 justify-end">
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>You</span>
            <div
              className="px-3 py-2.5 text-[13px] leading-relaxed"
              style={{
                border: '1.5px solid var(--color-rim)',
                borderRadius: '12px 2px 12px 12px',
                color: 'var(--color-ink)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              I'm calling it now Marx is going to break my heart.
            </div>
          </div>
          <div
            className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-teal)',
              color: '#fff',
              border: '2px solid var(--color-ink)',
            }}
          >
            Y
          </div>
        </div>

        {/* Alex — left again */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              border: '2px solid var(--color-ink)',
            }}
          >
            A
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>Alex</span>
            <div
              className="px-3 py-2.5 text-[13px] leading-relaxed"
              style={{
                border: '1.5px solid var(--color-rim)',
                borderRadius: '2px 12px 12px 12px',
                color: 'var(--color-ink)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              I'm not saying anything but you should buckle up.
            </div>
          </div>
        </div>
      </div>

      {/* Progress footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1.5px solid var(--color-rim)' }}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* You */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>You</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-ink-2)' }}>28%</span>
            </div>
            <div style={{ height: 5, backgroundColor: 'var(--color-rim)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '28%', height: '100%', backgroundColor: 'var(--color-ink)', borderRadius: 3 }} />
            </div>
          </div>
          {/* Alex */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>Alex</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-accent)' }}>34%</span>
            </div>
            <div style={{ height: 5, backgroundColor: 'var(--color-rim)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '34%', height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
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
      {/* ═══════════════════════════════════════════════════════════
          HERO — Asymmetric split with book cover mosaic
          Left: copy (left-aligned per design-taste skill)
          Right: 3x3 book cover grid with scroll parallax
          ═══════════════════════════════════════════════════════════ */}
      <section className="container-mobile pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pb-36">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
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
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5 px-3 py-1.5"
                style={{
                  borderRadius: 5,
                  border: '2px solid var(--color-ink)',
                  color: 'var(--color-ink)',
                  backgroundColor: 'var(--color-canvas)',
                  height: '36px',
                  width: 'fit-content',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  rotate: '-5deg',
                }}
              >
                By readers • For readers
              </span>
              {/* <Eyebrow>Your reading life, elevated</Eyebrow> */}
            </motion.div>

            <HeroHeadline />

            <motion.p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--color-ink-2)' }}
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
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-ink)',
                  color: 'var(--color-accent-on)',
                  boxShadow: '6px 6px 0px var(--color-accent)',
                  transition: 'transform 100ms ease, box-shadow 100ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = '2px 2px 0px var(--color-accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-accent)'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(4px, 4px)'
                  e.currentTarget.style.boxShadow = '0px 0px 0px var(--color-accent)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = '2px 2px 0px var(--color-accent)'
                }}
              >
                Get Started
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

          {/* Right — orange circle + stacked books */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT_STRONG }}
            className="hidden lg:block relative"
            style={{ minHeight: 480, overflow: 'visible' }}
          >
            {/* Orange circle */}
            <div
              className="absolute"
              style={{
                width: 720,
                height: 720,
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                border: '2px solid var(--color-ink)',
                right: -250,
                top: '70%',
                transform: 'translateY(-50%)',
              }}
            />

            {/* Yellow accent circle — top right of the orange circle */}
            <div
              className="absolute"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent-yellow)',
                border: '2px solid var(--color-ink)',
                right: -40,
                top: '30%',
                zIndex: 5,
              }}
            />

            {/* Now Reading card — above the yellow circle */}
            <motion.div
              className="absolute flex flex-col gap-2"
              style={{
                right: 50,
                top: '110%',
                width: 350,
                backgroundColor: 'var(--color-canvas)',
                border: '2px solid var(--color-ink)',
                boxShadow: '6px 6px 0px var(--color-ink)',
                padding: '10px 12px',
                zIndex: 10,
                borderRadius: 12,
              }}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT_STRONG }}
            >
              {/* Eyebrow */}
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                Now Reading
              </p>
              {/* Book row */}
              <div className="flex gap-2.5 items-center">
                <div style={{
                  width: 36, height: 54, flexShrink: 0, overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: 2,
                }}>
                  <img
                    src="https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg"
                    alt="Tomorrow, and Tomorrow, and Tomorrow"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                    Tomorrow and Tomorrow and Tomorrow
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--color-ink-2)' }}>Gabrielle Zevin</p>
                </div>
              </div>
              {/* Progress bar */}
              <div>
                <div style={{
                  width: '100%', height: 4, backgroundColor: 'var(--color-rim)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    width: '68%', height: '100%',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: 2,
                  }} />
                </div>
                <p style={{ fontSize: 9, color: 'var(--color-ink-2)', marginTop: 3, fontWeight: 600 }}>p. 284</p>
              </div>
            </motion.div>

            {/* Books scattered over the circle — spill left freely */}
            {[
              { isbn: '9781984822185', rotate: -8, right: 350, top: 60, w: 155, zIndex: 10 }, // normal people
              { isbn: '9781328879943', rotate: -4, right: 380, top:  280, w: 155, zIndex: 3 }, // the handmaids tale
              { isbn: '9780593321201', rotate:  -2, right: 110, top:  90, w: 155, zIndex: 2 }, // tomorrow and tomorrow and tomorrow 
              { isbn: '9780735224292', rotate:   14, right: 150, top:  300, w: 155, zIndex: 3 }, // little fires everywhere
              { isbn: '9780525559474', rotate:  6, right:  235, top: 170, w: 155, zIndex: 4 }, // midnight library
            ].map((book, i) => (
              <motion.div
                key={book.isbn}
                className="absolute"
                style={{
                  width: book.w,
                  height: book.w * 1.52,
                  right: book.right,
                  top: book.top,
                  zIndex: book.zIndex,
                  borderRadius: 4,
                  overflow: 'hidden',
                  borderTop: '1px solid rgba(0,0,0,0.15)',
                  borderLeft: '1px solid rgba(0,0,0,0.15)',
                  borderRight: '2px solid rgba(0,0,0,0.75)',
                  borderBottom: '2px solid rgba(0,0,0,0.75)',
                  boxShadow: '6px 8px 18px rgba(0,0,0,0.60), 2px 2px 0px rgba(0,0,0,0.60)',
                }}
                initial={{ opacity: 0, y: 40, rotate: book.rotate }}
                animate={{ opacity: 1, y: 0, rotate: book.rotate }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.55, ease: EASE_OUT_STRONG }}
              >
                <img
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {/* Spine shadow — left edge darkening */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 18%, transparent 40%)',
                  pointerEvents: 'none',
                }} />
                {/* Light gloss — top-left catch */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)',
                  pointerEvents: 'none',
                }} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile — orange circle + 3 books */}
        <motion.div
          className="lg:hidden mt-10 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="relative" style={{ width: 280, height: 240 }}>
            <div
              className="absolute"
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                right: 0,
                top: 20,
              }}
            />
            {[
              { isbn: '9780439023481', rotate: -14, x: 10,  y: 20 },
              { isbn: '9780735224292', rotate: 0,   x: 90,  y: 5  },
              { isbn: '9780525559474', rotate: 14,  x: 170, y: 20 },
            ].map((book, i) => (
              <div
                key={book.isbn}
                className="absolute overflow-hidden"
                style={{
                  width: 78,
                  height: 117,
                  left: book.x,
                  top: book.y,
                  transform: `rotate(${book.rotate}deg)`,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                }}
              >
                <img
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── MARQUEE BANNER ─────────────────────────────────────── */}
      <div
        style={{
          borderTop: '2px solid var(--color-ink)',
          borderBottom: '2px solid var(--color-ink)',
          backgroundColor: 'var(--color-accent-yellow)',
          overflow: 'hidden',
          marginTop: '100px',
          padding: '16px 0',
        }}
      >
        <div className="marquee-track">
          {[...Array(2)].map((_, copy) => (
            <div key={copy} className="marquee-copy">
              {['NO AI', 'NO ALGORITHM', 'NO TRACKING', 'JUST BOOKS', 'FOR READERS', 'NO PAYWALLS'].map((text, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span className="marquee-text">{text}</span>
                  <span className="marquee-dot">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO ──────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">
          <div className="grid lg:grid-cols-[30%_1fr] gap-12 lg:gap-16 items-center">

            {/* Left — NO AI stamp circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            >
              <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 400 }}>
                <defs>
                  {/* Left arc: 8 o'clock → 12 o'clock (clockwise, 120°) */}
                  <path id="ring-left" d="M 47.4,225 A 130,130 0 0,1 160,30" />
                  {/* Right arc: 12 o'clock → 4 o'clock (clockwise, 120°) */}
                  <path id="ring-right" d="M 160,30 A 130,130 0 0,1 272.6,225" />
                </defs>

                {/* Outer black border */}
                <circle cx="160" cy="160" r="152" fill="none" stroke="var(--color-ink)" strokeWidth="6" />
                {/* Yellow ring */}
                <circle cx="160" cy="160" r="130" fill="none" stroke="#F1C75B" strokeWidth="44" />
                {/* Inner black border */}
                <circle cx="160" cy="160" r="108" fill="none" stroke="var(--color-ink)" strokeWidth="2" />

                {/* Left phrase — centered on left arc */}
                <text fontSize="11" fontWeight="900" letterSpacing="6" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase' }}>
                  <textPath href="#ring-left" startOffset="50%" textAnchor="middle" dy="-4">
                    BUILT BY READERS
                  </textPath>
                </text>

                {/* Dot at 12 o'clock — ring center */}
                <text x="160" y="30" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="900" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>·</text>

                {/* Right phrase — centered on right arc */}
                <text fontSize="11" fontWeight="900" letterSpacing="6" fill="var(--color-ink)" style={{ fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase' }}>
                  <textPath href="#ring-right" startOffset="52%" textAnchor="middle" dy="-4">
                    BUILT FOR READERS
                  </textPath>
                </text>

                {/* Center — AI text */}
                <text
                  x="160"
                  y="182"
                  textAnchor="middle"
                  fontSize="88"
                  fontWeight="900"
                  fill="var(--color-ink)"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  AI
                </text>

                {/* Orange diagonal strikethrough */}
                <line
                  x1="78" y1="210"
                  x2="242" y2="112"
                  stroke="var(--color-accent)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Right — manifesto copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            >
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5 px-3 py-1.5"
                style={{
                  borderRadius: 5,
                  border: '3px solid var(--color-accent)',
                  color: 'var(--color-accent)',
                  backgroundColor: 'var(--color-canvas)',
                  fontWeight: '900',
                  rotate: '-5deg',
                }}
              >
                The Manifesto
              </span>
              <h2
                className="font-serif text-4xl sm:text-8xl font-bold leading-[1.05] tracking-tight mb-6"
                style={{ color: 'var(--color-ink)' }}
              >
                We will{' '}
                <em style={{ color: 'var(--color-accent)' }}>never </em>
                use AI
                <br />
                on{' '}
                <em style={{ color: 'var(--color-ink)', position: 'relative', display: 'inline-block' }}>
                  your data.
                  <svg
                    aria-hidden="true"
                    style={{ position: 'absolute', bottom: -14, left: 0, width: '100%', overflow: 'visible' }}
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
                {/* <br />Not AI. */}
              </h2>
              <p className="text-lg leading-relaxed mb-5" style={{ color: 'var(--color-ink-2)' }}>
                No recommendation algorithm telling you what to read next. No engagement metrics
                designed to keep you scrolling. No AI-generated reviews. Just honest book tracking,
                built by people who actually read.
              </p>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                Your reading data belongs to you. We don't sell it, we don't train on it.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LIBRARY SECTION — The Shelf
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left — headline + feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
              className="lg:sticky lg:top-28 min-w-0"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--color-accent)', fontWeight: '900' }}
                >
                  01 — The Shelf
                </span>
              </div>

              <h2
                className="font-serif font-bold leading-[1.03] tracking-tight mb-6"
                style={{ color: 'var(--color-ink)', fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
              >
                Every book.{' '}
                <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Including</em>{' '}
                the ones{' '}
                <br />
                you hide.
              </h2>

              <p
                className="text-lg leading-relaxed mb-10"
                style={{ color: 'var(--color-ink-2)', maxWidth: 460 }}
              >
                Currently reading, finished, DNF, and a private shelf only you can see —
                for the romance novel, the self-help book, the one your therapist said to try.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Private shelf card */}
                <div
                  className="zine-card shadow-zine-yellow-sm p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: 'var(--color-accent-yellow)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 8,
                      }}
                    >
                      <Lock size={16} style={{ color: '#fff' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                      Private shelf
                    </p>
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                    Hidden from your feed, stats, and friends.
                  </p>
                </div>

                {/* DNF card */}
                <div
                  className="zine-card shadow-zine-accent-sm p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: 'var(--color-accent)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 8,
                      }}
                    >
                      <XCircle size={16} style={{ color: '#fff' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                      Guilt-free DNF
                    </p>
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                    Stop a book. Save why. Keep the record.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right — library mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: EASE_OUT_STRONG, delay: 0.1 }}
              className="min-w-0"
            >
              <LibraryMockup />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          READING BUDDIES SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 lg:grid-rows-2 gap-12 lg:gap-x-16 lg:gap-y-8">

            {/* Left — chat mockup (spans 2 rows on desktop, order-2 on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: EASE_OUT_STRONG }}
              className="min-w-0 order-2 lg:order-1 lg:row-span-2 lg:self-start"
            >
              <BuddiesChatMockup />
            </motion.div>

            {/* Right top — headline + body (order-1 on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG, delay: 0.1 }}
              className="min-w-0 order-1 lg:order-2"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent-teal)' }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--color-accent-teal)', fontWeight: '900' }}
                >
                  02 — Buddies
                </span>
              </div>

              <h2
                className="font-serif font-bold leading-[1.03] tracking-tight mb-6"
                style={{ color: 'var(--color-ink)', fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
              >
                The{' '}
                <em style={{ color: 'var(--color-accent-teal)', fontStyle: 'italic' }}>group chat</em>
                <br />
                you actually
                <br />
                want.
              </h2>

              <p
                className="text-lg leading-relaxed"
                style={{ color: 'var(--color-ink-2)', maxWidth: 460 }}
              >
                Pick a book. Invite a friend (or three). Reactions thread by chapter
                and unlock as you both reach them — so no one accidentally spoils the twist.
              </p>
            </motion.div>

            {/* Right bottom — feature cards (order-3 on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG, delay: 0.15 }}
              className="min-w-0 order-3 lg:order-3"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Spoiler-safe */}
                <div className="zine-card shadow-zine-accent-sm p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: 'var(--color-accent)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 8,
                      }}
                    >
                      <MessageCircle size={16} style={{ color: '#fff' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                      Spoiler-safe
                    </p>
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                    Reactions unlock by chapter.
                  </p>
                </div>

                {/* Shared highlights */}
                <div className="zine-card shadow-zine-teal-sm p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: 'var(--color-accent-teal)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 8,
                      }}
                    >
                      <Bookmark size={16} style={{ color: '#fff' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                      Shared highlights
                    </p>
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                    Mark a passage. They see it.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          EVERYTHING ELSE SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-ink)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-ink)', fontWeight: '900' }}>
                03 — Everything Else
              </span>
            </div>
            <h2
              className="font-serif font-bold leading-[1.03] tracking-tight"
              style={{ color: 'var(--color-ink)', fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
            >
              Small features.{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Big rituals.</em>
            </h2>
          </motion.div>

          {/* 50/50 cards row */}
          <div className="grid lg:grid-cols-2 gap-5 mb-5">

            {/* Left — DNF card (dark bg) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE_OUT_STRONG }}
              className="zine-card shadow-zine-ink p-6 flex flex-col gap-5"
              style={{
                backgroundColor: '#161412'
              }}
            >
              {/* Book row */}
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: 52,
                    height: 76,
                    flexShrink: 0,
                    borderRadius: 4,
                    backgroundColor: '#3B2A6B',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 4px',
                    overflow: 'hidden',
                  }}
                >
                  <p style={{ fontSize: 6, fontWeight: 800, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patrick Rothfuss</p>
                  <p style={{ fontSize: 10, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginTop: 3, fontFamily: 'var(--font-playfair), Georgia, serif' }}>The Wise Man's Fear</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold mb-0.5" style={{ color: '#fff' }}>The Wise Man's Fear</p>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Patrick Rothfuss</p>
                </div>
                <div
                  className="flex-shrink-0 px-3 py-1.5 text-[12px] font-bold tracking-widest"
                  style={{
                    border: '2px solid var(--color-accent-yellow)',
                    color: 'var(--color-accent-yellow)',
                    borderRadius: 6,
                  }}
                >
                  DNF
                </div>
              </div>

              {/* Reason tags */}
              <div className="flex flex-wrap gap-2">
                {['Not for me', 'Wrong time', 'Pacing', 'Skipped ahead'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-[12px] font-bold"
                    style={
                      tag === 'Pacing'
                        ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderRadius: 999 }
                        : { border: '1.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 999 }
                    }
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Note */}
              <p className="text-[13px] leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.6)' }}>
                "Loved the first one, but at p. 320 of 994 the pacing just stopped working for me. Might come back."
              </p>

              {/* Footer */}
              <div
                className="flex items-center gap-2 pt-4 text-[12px] font-medium"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
              >
                <Check size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
                Saved to your DNF shelf. No guilt, just a record.
              </div>
            </motion.div>

            {/* Right — Suggest to friends (accent bg) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE_OUT_STRONG, delay: 0.08 }}
              className="zine-card shadow-zine-ink p-6 flex flex-col gap-5"
              style={{
                backgroundColor: 'var(--color-accent)'
              }}
            >
              {/* Book row */}
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: 52,
                    height: 76,
                    flexShrink: 0,
                    borderRadius: 4,
                    backgroundColor: '#1B3A3A',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 4px',
                    overflow: 'hidden',
                  }}
                >
                  <p style={{ fontSize: 6, fontWeight: 800, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sally Rooney</p>
                  <p style={{ fontSize: 10, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginTop: 3, fontFamily: 'var(--font-playfair), Georgia, serif' }}>Normal People</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold mb-0.5" style={{ color: '#fff' }}>Normal People</p>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>Sally Rooney</p>
                </div>
              </div>

              {/* Recommendation quote */}
              <div
                className="px-4 py-3"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.18)',
                  borderRadius: 10,
                }}
              >
                <p className="text-[13px] italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  "you're going to hate this and love this in equal measure. read it on a sunday."
                </p>
              </div>

              {/* To: friends + Send */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>To:</span>
                {['Mia', 'Priya', 'James'].map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1 text-[12px] font-bold"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      borderRadius: 999,
                    }}
                  >
                    {name}
                  </span>
                ))}
                <button
                  className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold"
                  style={{
                    backgroundColor: '#fff',
                    color: 'var(--color-ink)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 999,
                  }}
                >
                  SEND
                  <Send size={11} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Full-width — Notes card (yellow bg) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE_OUT_STRONG, delay: 0.12 }}
            className="zine-card shadow-zine-ink grid lg:grid-cols-2 gap-8 items-center p-8"
            style={{
              backgroundColor: 'var(--color-accent-yellow)',
            }}
          >
            {/* Left — copy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-ink)' }}>Notes</span>
              </div>
              <h3
                className="font-serif font-bold leading-[1.08] mb-4"
                style={{ color: 'var(--color-ink)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
              >
                Marginalia,
                <br />
                <em style={{ fontStyle: 'italic' }}>but searchable.</em>
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                Page-pinned, private, yours forever. Hidden
                <br />
                behind a lock — even from us.
              </p>
            </div>

            {/* Right — note card */}
            <div
              className="zine-card shadow-zine-ink p-5"
            >
              {/* Book header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  style={{
                    width: 32,
                    height: 46,
                    flexShrink: 0,
                    borderRadius: 3,
                    backgroundColor: '#1B3A2A',
                    border: '1px solid rgba(0,0,0,0.15)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>The Midnight Library</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-ink-3)' }}>Page 142</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Lock size={11} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-accent)' }}>Private</span>
                </div>
              </div>
              <p className="text-[14px] italic leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                "Nora's regrets are too specific to be coincidences. He's writing about the cat, isn't he? We all have a cat."
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WATCHLIST SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">

          {/* Header row — headline left, description right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-accent)', fontWeight: '900' }}>
                  04 — Watchlist
                </span>
              </div>
              <h2
                className="font-serif font-bold leading-[1.03] tracking-tight"
                style={{ color: 'var(--color-ink)', fontSize: 'clamp(2rem, 7vw, 4.2rem)' }}
              >
                Ring the bell.
                <br />
                <em style={{ fontStyle: 'italic' }}>We'll wake you up.</em>
              </h2>
            </div>
            <p
              className="text-[15px] leading-relaxed lg:max-w-[280px] lg:text-right lg:pb-1"
              style={{ color: 'var(--color-ink-2)' }}
            >
              Tap the bell on any upcoming release. We'll quietly remind you the day it comes out — once.
            </p>
          </motion.div>

          {/* book cards — 2 cols mobile, 5 cols desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 lg:max-w-7xl mx-auto">
            {[
              { title: 'The Tainted Cup',      author: 'Robert Jackson Bennett', cover: '#142D4A', days: 19, date: 'JUN 3',  rotate: -1.5, shadow: 'var(--color-accent)'        },
              { title: 'James',                author: 'Percival Everett',        cover: '#120E08', days: 33, date: 'JUN 17', rotate:  1,   shadow: '#1B2A4A', spine: '#C9A84C' },
              { title: 'The Ministry of Time', author: 'Kaliane Bradley',        cover: '#2E1040', days: 47, date: 'JUL 1',  rotate: -1,   shadow: 'var(--color-accent)'        },
              { title: 'Funny Story',          author: 'Emily Henry',             cover: '#241C0A', days: 60, date: 'JUL 14', rotate:  1.5, shadow: '#1B2A4A'                    },
              { title: 'All Fours',            author: 'Miranda July',            cover: '#3A1A2E', days: 74, date: 'JUL 28', rotate: -0.5, shadow: 'var(--color-accent)'        },
            ].map((book, i) => (
              <motion.div
                key={book.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE_OUT_STRONG, delay: i * 0.07 }}
                style={{ rotate: `${book.rotate}deg` }}
                className={i === 4 ? 'hidden lg:block' : ''}
              >
                <div
                  style={{
                    border: '2px solid var(--color-ink)',
                    boxShadow: `6px 6px 0px ${book.shadow}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-canvas)',
                  }}
                >
                  {/* Book cover */}
                  <div
                    style={{
                      aspectRatio: '2/3',
                      backgroundColor: book.cover,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Author */}
                    <p
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        right: 12,
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        lineHeight: 1.3,
                      }}
                    >
                      {book.author}
                    </p>
                    {/* Spine line */}
                    {'spine' in book && (
                      <div style={{ position: 'absolute', top: 0, left: '30%', width: 1, height: '100%', backgroundColor: book.spine as string, opacity: 0.6 }} />
                    )}
                    {/* Horizontal divide for Ministry of Time */}
                    {book.title === 'The Ministry of Time' && (
                      <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    )}
                    {/* Title on cover */}
                    <p
                      style={{
                        position: 'absolute',
                        bottom: 14,
                        left: 12,
                        right: 12,
                        fontFamily: 'var(--font-playfair), Georgia, serif',
                        fontSize: 18,
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1.15,
                      }}
                    >
                      {book.title}
                    </p>
                  </div>

                  {/* Card body */}
                  <div className="px-3 pt-2.5 pb-3">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: 'var(--color-ink)' }}>{book.title}</p>
                    <p className="text-[10px] mb-2" style={{ color: 'var(--color-ink-3)' }}>{book.author}</p>

                    {/* Dashed divider */}
                    <div style={{ borderTop: '1.5px dashed var(--color-rim)', marginBottom: 8 }} />

                    {/* Days + bell */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[18px] font-black leading-none" style={{ color: 'var(--color-accent)' }}>
                          {book.days}d
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-ink-3)' }}>
                          {book.date}
                        </p>
                      </div>
                      <button
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-accent-yellow)',
                          border: '1.5px solid var(--color-ink)',
                        }}
                        aria-label="Set reminder"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING SECTION
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            className="zine-card shadow-zine-accent relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center p-10 lg:p-14 overflow-hidden"
            style={{
              backgroundColor: '#161412',
            }}
          >
            {/* Faded circle — top right */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 380,
                height: 380,
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                opacity: 0.25,
                pointerEvents: 'none',
              }}
            />
            {/* Faded circle — bottom left */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: -90,
                left: -60,
                width: 300,
                height: 300,
                borderRadius: '50%',
                backgroundColor: '#4A3A10',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />

            {/* Left — copy */}
            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* PRICING badge */}
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em] px-3 py-1.5"
                style={{
                  border: '1.5px solid var(--color-accent-yellow)',
                  color: 'var(--color-accent-yellow)',
                  borderRadius: 6,
                  rotate: '-5deg',
                }}
              >
                Pricing
              </span>

              <h2
                className="font-serif font-bold leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(3.5rem, 7vw, 6rem)' }}
              >
                <span style={{ color: '#fff' }}>Free.</span>
                <br />
                <em style={{ color: 'var(--color-accent-yellow)', fontStyle: 'italic' }}>Forever.</em>
              </h2>

              <p
                className="text-[15px] leading-relaxed"
                style={{ color: '#c6c6c6', maxWidth: 380 }}
              >
                Funded by a small group of patron readers. No tiers, no trials, no
                surprise paywalls. If anything changes, what's already yours stays yours.
              </p>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-black uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-accent-yellow)',
                  color: 'var(--color-ink)',
                  borderRadius: 999,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '4px 4px 0px var(--color-accent)',
                }}
              >
                Get Started
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right — feature card */}
            <div
              className="zine-card shadow-zine-yellow-sm relative z-10 p-6"
            >
              <p
                className="font-serif font-bold mb-5"
                style={{ fontSize: '1.35rem', color: 'var(--color-ink)' }}
              >
                Everything's in.
              </p>

              <ul className="flex flex-col">
                {[
                  'Unlimited books across every shelf',
                  'Private shelf (hidden from everyone)',
                  'Reading Buddies (up to 4 per book)',
                  'Private notes, page-pinned',
                  'Upcoming-release alerts',
                  'Goodreads import',
                  'Zero AI · Zero tracking · Zero ads',
                ].map((feature, i, arr) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 py-3"
                    style={i < arr.length - 1 ? { borderBottom: '1.5px dashed var(--color-rim)' } : {}}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)',
                      }}
                    >
                      <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
