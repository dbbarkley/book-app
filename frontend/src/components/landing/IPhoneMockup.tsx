'use client'

import { motion } from 'framer-motion'
import { BookOpen, Check, XCircle, Lock, Search, Home, User, Bell } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   IPhoneMockup — A pure CSS iPhone 15 Pro frame with a live
   Libraio app screen rendered inside. No images, no screenshots
   — the entire UI is built with markup so it stays crisp at
   any scale and matches the app's real design language.

   The frame uses the double-bezel technique (outer shell +
   inner screen) from the high-end-visual-design skill.
   ───────────────────────────────────────────────────────────── */

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Mini book covers for the "Currently Reading" row
const READING_NOW = [
  { title: 'Dune', color: '#2a1a5e' },
  { title: 'The Midnight Library', color: '#1a3a2a' },
  { title: 'Atomic Habits', color: '#3a2a1a' },
]

// Shelf summary data
const SHELVES = [
  { label: 'Currently Reading', count: 3, icon: BookOpen, color: 'var(--color-accent)' },
  { label: 'To Read', count: 14, icon: BookOpen, color: 'var(--color-lit-3)' },
  { label: 'Completed', count: 62, icon: Check, color: 'var(--color-success)' },
  { label: 'Did Not Finish', count: 8, icon: XCircle, color: 'var(--color-lit-3)' },
  { label: 'Private', count: 5, icon: Lock, color: 'var(--color-accent)', isPrivate: true },
]

export default function IPhoneMockup() {
  return (
    <motion.div
      className="flex justify-center"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
    >
      {/* ── Outer shell (the titanium frame) ──────────────── */}
      <div
        className="relative rounded-[52px] p-[6px]"
        style={{
          background: 'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 50%, #2c2c2e 100%)',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
          width: 300,
        }}
      >
        {/* ── Inner screen bezel ───────────────────────────── */}
        <div
          className="relative rounded-[46px] overflow-hidden"
          style={{
            backgroundColor: 'var(--color-canvas)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)',
          }}
        >
          {/* ── Dynamic Island ─────────────────────────────── */}
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="rounded-full"
              style={{
                width: 100,
                height: 28,
                backgroundColor: '#000',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
              }}
            />
          </div>

          {/* ── Status bar ─────────────────────────────────── */}
          <div className="flex items-center justify-between px-7 py-1">
            <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--color-lit)' }}>
              9:41
            </span>
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <div className="flex items-end gap-[2px]">
                {[5, 7, 9, 11].map((h, i) => (
                  <div
                    key={i}
                    className="rounded-[1px]"
                    style={{
                      width: 3,
                      height: h,
                      backgroundColor: 'var(--color-lit)',
                      opacity: i < 3 ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
              {/* WiFi */}
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M6 9a1 1 0 100-2 1 1 0 000 2z" fill="var(--color-lit)" />
                <path d="M3.5 6.5a3.5 3.5 0 015 0" stroke="var(--color-lit)" strokeWidth="1" strokeLinecap="round" />
                <path d="M1.5 4.5a6 6 0 019 0" stroke="var(--color-lit)" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[2px]">
                <div
                  className="rounded-sm relative"
                  style={{
                    width: 20,
                    height: 9,
                    border: '1px solid var(--color-lit)',
                    opacity: 0.8,
                    padding: 1,
                  }}
                >
                  <div
                    className="rounded-[1px] h-full"
                    style={{ width: '70%', backgroundColor: 'var(--color-lit)' }}
                  />
                </div>
                <div
                  className="rounded-r-sm"
                  style={{
                    width: 2,
                    height: 4,
                    backgroundColor: 'var(--color-lit)',
                    opacity: 0.4,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── App header ─────────────────────────────────── */}
          <div className="px-5 pt-3 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p
                className="font-serif text-lg font-bold"
                style={{ color: 'var(--color-lit)' }}
              >
                My Library
              </p>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  border: '1px solid var(--color-rim-accent)',
                }}
              >
                <Search size={12} style={{ color: 'var(--color-accent)' }} />
              </div>
            </div>

            {/* Reading streak pill */}
            <div
              className="rounded-full px-3 py-1.5 flex items-center gap-2 w-fit mb-4"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-rim-accent)',
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-accent)' }}>
                12-day reading streak
              </span>
            </div>
          </div>

          {/* ── Currently reading covers ───────────────────── */}
          <div className="px-5 mb-3">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Currently Reading
            </p>
            <div className="flex gap-2">
              {READING_NOW.map((book) => (
                <div
                  key={book.title}
                  className="rounded-lg overflow-hidden"
                  style={{
                    width: 52,
                    height: 76,
                    backgroundColor: book.color,
                    border: '1px solid var(--color-rim)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Mini book spine detail */}
                  <div
                    className="h-full"
                    style={{
                      borderLeft: '2px solid rgba(255,255,255,0.08)',
                      padding: '6px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      className="text-[6px] font-bold leading-tight"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {book.title}
                    </span>
                  </div>
                </div>
              ))}
              {/* "See all" ghost card */}
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  width: 52,
                  height: 76,
                  border: '1px dashed var(--color-rim)',
                }}
              >
                <span className="text-[9px]" style={{ color: 'var(--color-lit-3)' }}>+11</span>
              </div>
            </div>
          </div>

          {/* ── Shelf list ─────────────────────────────────── */}
          <div className="px-5 pb-2">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-lit-3)' }}
            >
              Shelves
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-rim)',
              }}
            >
              {SHELVES.map((shelf, i) => {
                const Icon = shelf.icon
                return (
                  <div
                    key={shelf.label}
                    className="flex items-center gap-2.5 px-3 py-2.5"
                    style={{
                      borderBottom: i < SHELVES.length - 1 ? '1px solid var(--color-rim)' : undefined,
                      backgroundColor: shelf.isPrivate ? 'var(--color-accent-subtle)' : undefined,
                    }}
                  >
                    <Icon size={11} style={{ color: shelf.color, flexShrink: 0 }} />
                    <span
                      className="flex-1 text-[11px] font-medium"
                      style={{ color: shelf.isPrivate ? 'var(--color-accent)' : 'var(--color-lit)' }}
                    >
                      {shelf.label}
                    </span>
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ color: shelf.isPrivate ? 'var(--color-accent)' : 'var(--color-lit-3)' }}
                    >
                      {shelf.count}
                    </span>
                    {shelf.isPrivate && (
                      <span
                        className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-on)',
                        }}
                      >
                        Only you
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Bottom tab bar ─────────────────────────────── */}
          <div
            className="flex items-center justify-around px-4 py-2.5 mt-1"
            style={{
              borderTop: '1px solid var(--color-rim)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            {[
              { icon: Home, label: 'Home', active: false },
              { icon: Search, label: 'Discover', active: false },
              { icon: BookOpen, label: 'Library', active: true },
              { icon: Bell, label: 'Activity', active: false },
              { icon: User, label: 'Profile', active: false },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <div key={tab.label} className="flex flex-col items-center gap-0.5">
                  <Icon
                    size={16}
                    style={{
                      color: tab.active ? 'var(--color-accent)' : 'var(--color-lit-3)',
                    }}
                  />
                  <span
                    className="text-[8px] font-medium"
                    style={{
                      color: tab.active ? 'var(--color-accent)' : 'var(--color-lit-3)',
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Home indicator ─────────────────────────────── */}
          <div className="flex justify-center py-2">
            <div
              className="rounded-full"
              style={{
                width: 120,
                height: 4,
                backgroundColor: 'var(--color-lit)',
                opacity: 0.2,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
