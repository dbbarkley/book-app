'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PenLine, Lock, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { useBookNotes } from '@book-app/shared/hooks'
import type { UserBook, BookNote } from '@book-app/shared/types'
import { BookCoverImage } from './BookCoverImage'

interface QuickNoteModalProps {
  userBook: UserBook
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export default function QuickNoteModal({ userBook, isOpen, onClose, onSaved }: QuickNoteModalProps) {
  const { notes, loading, fetchNotes, addNote, deleteNote } = useBookNotes()
  const [draft, setDraft] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && userBook?.id) {
      fetchNotes(userBook.id)
      setDraft('')
    }
  }, [isOpen, userBook?.id, fetchNotes])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleAdd = async () => {
    if (!draft.trim()) return
    await addNote(userBook.id, draft.trim())
    setDraft('')
    onSaved?.()
  }

  const handleDelete = async (note: BookNote) => {
    setDeletingId(note.id)
    try {
      await deleteNote(userBook.id, note.id)
      onSaved?.()
    } finally {
      setDeletingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
  }

  return (
    <>
      <style>{`
        .qnm-textarea { font-family: inherit; font-style: italic; resize: none; outline: none; width: 100%; background: transparent; }
        .qnm-textarea::placeholder { color: var(--color-ink-3); font-style: italic; }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="qnm-backdrop"
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="qnm-panel"
                className="pointer-events-auto w-full flex flex-col"
                style={{
                  maxWidth: 500,
                  maxHeight: '92dvh',
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 20,
                  boxShadow: '6px 6px 0px var(--color-ink)',
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--color-accent)' }}>
                        Marginalia
                      </p>
                      <h2 className="font-serif font-bold leading-[1.0]" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: 'var(--color-ink)' }}>
                        Your{' '}
                        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>notes.</em>
                      </h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center flex-shrink-0 mt-1 transition-opacity hover:opacity-70"
                      style={{ width: 36, height: 36, border: '2px solid var(--color-ink)', borderRadius: 10, backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' }}
                      aria-label="Close"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed var(--color-ink)', flexShrink: 0 }} />

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                  {/* Book card */}
                  {userBook.book && (
                    <div
                      className="relative overflow-hidden flex items-center gap-4"
                      style={{
                        backgroundColor: 'var(--color-accent-yellow)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 14,
                        padding: '14px 16px',
                      }}
                    >
                      <span
                        className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5"
                        style={{
                          backgroundColor: '#fff',
                          border: '2px solid var(--color-ink)',
                          borderRadius: 6,
                          color: 'var(--color-ink)',
                          transform: 'rotate(2deg)',
                          display: 'inline-block',
                          boxShadow: '2px 2px 0 var(--color-ink)',
                        }}
                      >
                        {formatToday()}
                      </span>
                      <div className="flex-shrink-0" style={{ transform: 'rotate(-3deg)', marginTop: 4 }}>
                        <div style={{ width: 52, aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', boxShadow: '3px 6px 14px rgba(0,0,0,0.45)', border: '1px solid rgba(0,0,0,0.2)' }}>
                          <BookCoverImage src={userBook.book.cover_image_url} title={userBook.book.title} size="small" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(26,26,26,0.55)' }}>The Book</p>
                        <p className="font-serif font-bold leading-snug" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', color: 'var(--color-ink)' }}>
                          {userBook.book.title}
                        </p>
                        {userBook.book.author_name && (
                          <p className="text-[12px] italic mt-0.5" style={{ color: 'rgba(26,26,26,0.6)' }}>by {userBook.book.author_name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add note form */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                        <PenLine size={12} style={{ color: 'var(--color-ink)' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                          Add a note
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock size={10} style={{ color: 'var(--color-ink-3)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-ink-3)' }}>Only you</span>
                      </div>
                    </div>

                    <div style={{ border: '2px solid var(--color-ink)', borderRadius: 12, backgroundColor: 'var(--color-canvas)', padding: '12px 14px' }}>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Thoughts, quotes, anything you want to remember…"
                        rows={3}
                        autoFocus
                        className="qnm-textarea"
                        style={{ color: 'var(--color-ink)', fontSize: 14, lineHeight: 1.7 }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>⌘ + Enter to save</span>
                      <button
                        onClick={handleAdd}
                        disabled={!draft.trim() || loading}
                        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{
                          backgroundColor: 'var(--color-ink)',
                          color: 'var(--color-canvas)',
                          border: '2px solid var(--color-ink)',
                          borderRadius: 999,
                          padding: '8px 16px',
                        }}
                      >
                        {loading ? <Loader2 size={11} className="animate-spin" /> : <><PenLine size={11} /> Save <ArrowRight size={11} /></>}
                      </button>
                    </div>
                  </div>

                  {/* Existing notes */}
                  {notes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {notes.map(note => (
                          <div
                            key={note.id}
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '2px solid var(--color-ink)',
                              borderRadius: 12,
                              padding: '14px 16px',
                              boxShadow: '3px 3px 0 var(--color-ink)',
                            }}
                          >
                            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-ink-2)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                              {note.content}
                            </p>
                            {note.page_number && (
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] mt-2" style={{ color: 'var(--color-accent)' }}>
                                p. {note.page_number}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-ink-3)' }}>
                                {formatDate(note.created_at)}
                              </span>
                              <button
                                onClick={() => handleDelete(note)}
                                disabled={deletingId === note.id}
                                className="transition-opacity hover:opacity-60 disabled:opacity-30"
                                aria-label="Delete note"
                              >
                                {deletingId === note.id
                                  ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-ink-3)' }} />
                                  : <Trash2 size={13} style={{ color: 'var(--color-ink-3)' }} />
                                }
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && notes.length === 0 && (
                    <div className="text-center py-6" style={{ borderTop: '1.5px dashed var(--color-rim)' }}>
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-ink-3)' }}>
                        No notes yet — write the first one above.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center px-6 py-4 flex-shrink-0" style={{ borderTop: '2px solid var(--color-ink)' }}>
                  <button
                    onClick={onClose}
                    className="w-full font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                    style={{
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '14px 20px',
                      fontSize: 12,
                      color: 'var(--color-ink)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
