'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { BookOpen, Lock, XCircle, Check, GripVertical } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   InteractiveShelf — A draggable shelf demo that lets visitors
   reorder books between shelves. They experience the core
   product interaction directly on the landing page.

   Uses Framer Motion Reorder for native drag-and-drop with
   layout animations and spring physics.
   ───────────────────────────────────────────────────────────── */

interface DemoBook {
  id: string
  title: string
  author: string
  cover: string
  shelf: string
}

const INITIAL_BOOKS: DemoBook[] = [
  { id: '1', title: 'Dune', author: 'Frank Herbert', cover: '#2a1a5e', shelf: 'reading' },
  { id: '2', title: 'The Midnight Library', author: 'Matt Haig', cover: '#1a3a2a', shelf: 'reading' },
  { id: '3', title: 'Atomic Habits', author: 'James Clear', cover: '#3a2a1a', shelf: 'toread' },
  { id: '4', title: 'Project Hail Mary', author: 'Andy Weir', cover: '#1a2a3a', shelf: 'toread' },
  { id: '5', title: 'Educated', author: 'Tara Westover', cover: '#2a0a1a', shelf: 'completed' },
]

const SHELVES = [
  { id: 'reading', label: 'Currently Reading', icon: BookOpen, color: 'var(--color-accent)' },
  { id: 'toread', label: 'To Read', icon: BookOpen, color: 'var(--color-lit-3)' },
  { id: 'completed', label: 'Completed', icon: Check, color: 'var(--color-success)' },
  { id: 'dnf', label: 'Did Not Finish', icon: XCircle, color: 'var(--color-error)' },
  { id: 'private', label: 'Private', icon: Lock, color: 'var(--color-accent)' },
] as const

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 28 }

export default function InteractiveShelf() {
  const [books, setBooks] = useState(INITIAL_BOOKS)
  const [draggedBook, setDraggedBook] = useState<string | null>(null)
  const [hoveredShelf, setHoveredShelf] = useState<string | null>(null)

  function moveBook(bookId: string, newShelf: string) {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, shelf: newShelf } : b)),
    )
    setDraggedBook(null)
    setHoveredShelf(null)
  }

  return (
    <div
      className="rounded-[24px] overflow-hidden w-full max-w-md mx-auto"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-rim)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
          Try it — drag a book to a shelf
        </span>
        <motion.span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-rim-accent)',
          }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          Interactive
        </motion.span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {SHELVES.map((shelf) => {
          const Icon = shelf.icon
          const shelfBooks = books.filter((b) => b.shelf === shelf.id)
          const isHovered = hoveredShelf === shelf.id

          return (
            <motion.div
              key={shelf.id}
              className="rounded-xl transition-colors"
              style={{
                backgroundColor: isHovered
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-grove)',
                border: isHovered
                  ? '1px solid var(--color-rim-accent)'
                  : '1px solid transparent',
                padding: '10px 12px',
              }}
              layout
              transition={SPRING}
              onDragOver={(e) => {
                e.preventDefault()
                setHoveredShelf(shelf.id)
              }}
              onDragLeave={() => setHoveredShelf(null)}
              onDrop={() => {
                if (draggedBook) moveBook(draggedBook, shelf.id)
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={12} style={{ color: shelf.color, flexShrink: 0 }} />
                <span className="text-[11px] font-bold" style={{ color: shelf.color }}>
                  {shelf.label}
                </span>
                <span
                  className="text-[10px] ml-auto tabular-nums font-bold"
                  style={{ color: 'var(--color-lit-3)' }}
                >
                  {shelfBooks.length}
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {shelfBooks.map((book) => (
                  <motion.div
                    key={book.id}
                    draggable
                    onDragStart={() => setDraggedBook(book.id)}
                    onDragEnd={() => {
                      setDraggedBook(null)
                      setHoveredShelf(null)
                    }}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={SPRING}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-grab active:cursor-grabbing group"
                    style={{
                      backgroundColor: draggedBook === book.id
                        ? 'var(--color-accent-subtle)'
                        : 'transparent',
                    }}
                    whileHover={{ backgroundColor: 'rgba(237,224,196,0.05)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <GripVertical
                      size={10}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--color-lit-3)', flexShrink: 0 }}
                    />
                    <div
                      className="w-5 h-7 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: book.cover, border: '1px solid var(--color-rim)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold truncate" style={{ color: 'var(--color-lit)' }}>
                        {book.title}
                      </p>
                      <p className="text-[8px] truncate" style={{ color: 'var(--color-lit-3)' }}>
                        {book.author}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {shelfBooks.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9px] italic py-1.5 px-2"
                  style={{ color: 'var(--color-lit-3)' }}
                >
                  Drop a book here...
                </motion.p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
