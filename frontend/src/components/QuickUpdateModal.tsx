'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, BookOpen, CheckCircle, XCircle, Globe, Lock, PenLine, ArrowRight } from 'lucide-react'
import {
  useBookProgress,
  useUpdateBookShelf,
  useUpdateBookVisibility,
  useBookShelf,
  useBookNotes,
  useBookReview,
} from '@book-app/shared/hooks'
import { useBooksStore } from '@book-app/shared/store/booksStore'
import type { UserBook, ShelfStatus, Visibility } from '@book-app/shared/types'
import { StarRatingInput } from './StarRatingInput'
import { BookCoverImage } from './BookCoverImage'

interface QuickUpdateModalProps {
  userBook: UserBook
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  id: ShelfStatus
  label: string
  icon: React.ElementType
  activeBg: string
  activeText: string
}[] = [
  { id: 'to_read',  label: 'To Read',   icon: Clock,        activeBg: 'var(--color-ink)',     activeText: 'var(--color-canvas)' },
  { id: 'reading',  label: 'Reading',   icon: BookOpen,     activeBg: 'var(--color-accent)',  activeText: '#fff' },
  { id: 'read',     label: 'Completed', icon: CheckCircle,  activeBg: '#2D6A4F',              activeText: '#fff' },
  { id: 'dnf',      label: 'DNF',       icon: XCircle,      activeBg: '#b91c1c',              activeText: '#fff' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const DNF_TAGS = ['Not for me', 'Wrong time', 'Pacing', 'Skipped ahead', 'Lost interest']

// Serialises reason + tags into dnf_reason; feed renderer can split on "\n\n[TAGS]"
function buildDnfReason(reason: string, tags: string[]): string {
  if (!reason && tags.length === 0) return ''
  if (tags.length === 0) return reason
  const tagLine = `[TAGS: ${tags.join(', ')}]`
  return reason ? `${reason}\n\n${tagLine}` : tagLine
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

function entryNumber(id: number) {
  return id > 0 ? (id * 7 + 100) % 900 + 100 : Math.floor(Math.random() * 800) + 100
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function QuickUpdateModal({ userBook, isOpen, onClose, onUpdate }: QuickUpdateModalProps) {
  const { updateProgress, loading: progressLoading }   = useBookProgress()
  const { updateShelf,   loading: updateShelfLoading } = useUpdateBookShelf()
  const { addToShelf,    loading: addShelfLoading }    = useBookShelf()
  const { setVisibility, loading: visibilityLoading }  = useUpdateBookVisibility()
  const { saveNotes,     loading: notesLoading }       = useBookNotes()
  const { saveReview,    loading: reviewLoading }      = useBookReview()
  const { removeFromShelf } = useBooksStore()

  const [status,     setStatus]          = useState<ShelfStatus>(userBook?.status || 'to_read')
  const [visibility, setVisibilityState] = useState<Visibility>(userBook?.visibility || 'public')
  const [pagesRead,  setPagesRead]       = useState(userBook?.pages_read?.toString() || '0')
  const [totalPages, setTotalPages]      = useState(
    userBook?.total_pages?.toString() || userBook?.book?.page_count?.toString() || '0'
  )
  const [percentage, setPercentage] = useState(userBook?.completion_percentage || 0)
  const [dnfPage,    setDnfPage]    = useState(userBook?.dnf_page?.toString() || '')
  const [dnfReason,  setDnfReason]  = useState(userBook?.dnf_reason || '')
  const [dnfTags,    setDnfTags]    = useState<string[]>([])
  const [rating,     setRating]     = useState<number>(userBook?.rating ?? 0)
  const [review,     setReview]     = useState(userBook?.review || '')
  const [notes,      setNotes]      = useState(userBook?.notes || '')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing,   setRemoving]   = useState(false)

  const isBusy = progressLoading || updateShelfLoading || addShelfLoading || visibilityLoading || notesLoading || reviewLoading || removing

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && userBook) {
      setStatus(userBook.status)
      setVisibilityState(userBook.visibility || 'public')
      setPagesRead(userBook.pages_read?.toString() || '0')
      setTotalPages(userBook.total_pages?.toString() || userBook.book?.page_count?.toString() || '0')
      setPercentage(userBook.completion_percentage || 0)
      setDnfPage(userBook.dnf_page?.toString() || '')
      setDnfReason(userBook.dnf_reason || '')
      setDnfTags([])
      setRating(userBook.rating ?? 0)
      setReview(userBook.review || '')
      setNotes(userBook.notes || '')
      setConfirmRemove(false)
    }
  }, [isOpen, userBook])

  const handleRemove = async () => {
    if (!confirmRemove) { setConfirmRemove(true); return }
    setRemoving(true)
    try {
      await removeFromShelf(userBook.id)
      onUpdate?.()
      onClose()
    } catch (err) {
      console.error('Failed to remove book:', err)
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      let activeUserBookId = userBook.id
      if (activeUserBookId === 0) {
        const newBook = await addToShelf(userBook.book_id, status, userBook.book, {
          visibility,
          dnf_page:    status === 'dnf' ? parseInt(dnfPage)  : undefined,
          dnf_reason:  status === 'dnf' ? buildDnfReason(dnfReason, dnfTags) : undefined,
          total_pages: parseInt(totalPages) > 0 ? parseInt(totalPages) : undefined,
        })
        activeUserBookId = newBook.id
      } else {
        await updateShelf({
          userBookId: activeUserBookId,
          status,
          visibility,
          dnf_page:   status === 'dnf' ? parseInt(dnfPage) : undefined,
          dnf_reason: status === 'dnf' ? buildDnfReason(dnfReason, dnfTags) : undefined,
        })
      }
      if ((status === 'reading' || status === 'read') && activeUserBookId > 0) {
        const pRead  = parseInt(pagesRead)
        const tPages = parseInt(totalPages)
        if (tPages > 0) {
          await updateProgress(activeUserBookId, {
            pages_read:            status === 'read' ? tPages : pRead,
            total_pages:           tPages,
            completion_percentage: status === 'read' ? 100 : Math.round((pRead / tPages) * 100),
          })
        } else {
          await updateProgress(activeUserBookId, { completion_percentage: status === 'read' ? 100 : percentage })
        }
      }
      if (activeUserBookId > 0) await saveNotes(activeUserBookId, notes)
      if (activeUserBookId > 0 && status === 'read' && rating > 0) {
        await saveReview(activeUserBookId, rating, review || undefined)
      }
      onUpdate?.()
      onClose()
    } catch (err) {
      console.error('Failed to save updates:', err)
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setPercentage(val)
    if (parseInt(totalPages) > 0) {
      setPagesRead(Math.round((val / 100) * parseInt(totalPages)).toString())
    }
    if (val >= 100) { setPercentage(100); setStatus('read') }
  }

  const handlePagesReadChange = (val: string) => {
    setPagesRead(val)
    const p = parseInt(val), t = parseInt(totalPages)
    if (t > 0) {
      const pct = Math.min(100, Math.round((p / t) * 100))
      setPercentage(pct)
      if (p >= t) setStatus('read')
    }
  }

  const handleTotalPagesChange = (val: string) => {
    setTotalPages(val)
    const p = parseInt(pagesRead), t = parseInt(val)
    if (t > 0) {
      const pct = Math.min(100, Math.round((p / t) * 100))
      setPercentage(pct)
      if (p >= t) setStatus('read')
    }
  }

  // ── Input style helpers ────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    backgroundColor: 'var(--color-canvas)',
    border: '2px solid var(--color-ink)',
    color: 'var(--color-ink)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 16,
    fontWeight: 600,
    width: '100%',
    outline: 'none',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Slider thumb CSS */}
      <style>{`
        .log-progress-slider { appearance: none; -webkit-appearance: none; outline: none; height: 10px; border-radius: 999px; cursor: pointer; }
        .log-progress-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--color-accent-yellow); border: 2px solid var(--color-ink); cursor: pointer; }
        .log-progress-slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: var(--color-accent-yellow); border: 2px solid var(--color-ink); cursor: pointer; }
        .marginalia-textarea { font-family: inherit; font-style: italic; resize: none; outline: none; width: 100%; background: transparent; }
        .marginalia-textarea::placeholder { color: var(--color-ink-3); font-style: italic; }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="qum-backdrop"
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-0 z-[101] flex items-end sm:items-center sm:p-4 pointer-events-none">
              <motion.div
                key="qum-panel"
                className="pointer-events-auto w-full flex flex-col rounded-t-2xl sm:rounded-[20px]"
                style={{
                  maxWidth: 500,
                  maxHeight: '92dvh',
                  margin: '0 auto',
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: '6px 6px 0px var(--color-ink)',
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        Reader&apos;s Log · Entry N&ordm;{entryNumber(userBook.id)}
                      </p>
                      <h2
                        className="font-serif font-bold leading-[1.0]"
                        style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: 'var(--color-ink)' }}
                      >
                        Log{' '}
                        <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Progress</em>
                      </h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center flex-shrink-0 mt-1 transition-opacity hover:opacity-70"
                      style={{
                        width: 36, height: 36,
                        border: '2px solid var(--color-ink)',
                        borderRadius: 10,
                        backgroundColor: 'var(--color-canvas)',
                        color: 'var(--color-ink)',
                      }}
                      aria-label="Close"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Dotted divider */}
                <div style={{ borderTop: '2px dashed var(--color-ink)', marginBottom: 0 }} />

                {/* ── Scrollable body ──────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-6">

                  {/* Book card */}
                  {userBook.book && (
                    <div
                      className="relative overflow-hidden flex items-center gap-4"
                      style={{
                        backgroundColor: 'var(--color-accent-yellow)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 14,
                        padding: '16px 16px',
                      }}
                    >
                      {/* Date sticker */}
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

                      {/* Cover */}
                      <div
                        className="flex-shrink-0"
                        style={{ transform: 'rotate(-3deg)', marginTop: 4 }}
                      >
                        <div
                          style={{
                            width: 64,
                            aspectRatio: '2/3',
                            borderRadius: 6,
                            overflow: 'hidden',
                            boxShadow: '3px 6px 14px rgba(0,0,0,0.45)',
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        >
                          <BookCoverImage
                            src={userBook.book.cover_image_url}
                            title={userBook.book.title}
                            size="small"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-10">
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
                          style={{ color: 'rgba(26,26,26,0.55)' }}
                        >
                          The Book
                        </p>
                        <p
                          className="font-serif font-bold leading-snug"
                          style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', color: 'var(--color-ink)' }}
                        >
                          {userBook.book.title}
                        </p>
                        {userBook.book.author_name && (
                          <p className="text-[13px] italic mt-0.5" style={{ color: 'rgba(26,26,26,0.6)' }}>
                            by {userBook.book.author_name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Shelf Status ─────────────────────────────────────── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                        Shelf Status
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((opt) => {
                        const active = status === opt.id
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setStatus(opt.id)}
                            className="flex items-center gap-3 transition-all"
                            style={{
                              padding: '12px 14px',
                              border: `2px solid ${active ? opt.activeBg : 'var(--color-ink)'}`,
                              borderRadius: 12,
                              backgroundColor: active ? opt.activeBg : 'var(--color-canvas)',
                              color: active ? opt.activeText : 'var(--color-ink)',
                            }}
                          >
                            <span
                              className="flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 30, height: 30, borderRadius: 8,
                                backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(26,26,26,0.07)',
                                border: `1.5px solid ${active ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,26,0.15)'}`,
                              }}
                            >
                              <opt.icon size={14} strokeWidth={2.5} />
                            </span>
                            <span className="text-[12px] font-bold uppercase tracking-[0.12em]">
                              {opt.label}
                            </span>
                            {active && (
                              <span
                                className="ml-auto flex-shrink-0"
                                style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  backgroundColor: 'rgba(255,255,255,0.7)',
                                }}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>

                  </div>

                  {/* ── To Read placeholder ──────────────────────────────── */}
                  {status === 'to_read' && (
                    <div
                      className="flex items-center gap-4"
                      style={{
                        border: '2px dashed var(--color-rim)',
                        borderRadius: 14,
                        padding: '18px 20px',
                      }}
                    >
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          border: '2px solid var(--color-ink)',
                          backgroundColor: 'var(--color-canvas)',
                        }}
                      >
                        <Clock size={20} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
                      </span>
                      <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
                        On deck. No progress to log yet — we&apos;ll be here when you crack the spine.
                      </p>
                    </div>
                  )}

                  {/* ── DNF card ─────────────────────────────────────────── */}
                  {status === 'dnf' && (
                    <div
                      className="relative"
                      style={{
                        backgroundColor: 'rgba(185,28,28,0.06)',
                        border: '2px solid #b91c1c',
                        borderRadius: 14,
                        padding: '20px 18px',
                        boxShadow: '4px 4px 0px #b91c1c',
                      }}
                    >
                      {/* DID NOT FINISH sticker */}
                      <span
                        className="absolute -top-3 right-4 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5"
                        style={{
                          backgroundColor: 'var(--color-canvas)',
                          border: '2px solid #b91c1c',
                          borderRadius: 6,
                          color: '#b91c1c',
                          transform: 'rotate(2deg)',
                          display: 'inline-block',
                        }}
                      >
                        Did Not Finish
                      </span>

                      {/* Stopped at page */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{ width: 20, height: 2, backgroundColor: '#b91c1c' }} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b91c1c' }}>
                            Stopped at Page
                          </span>
                        </div>
                        <input
                          type="number"
                          value={dnfPage}
                          onChange={(e) => setDnfPage(e.target.value)}
                          placeholder="212"
                          style={{
                            ...inputBase,
                            border: '2px solid #b91c1c',
                            fontSize: 18,
                          }}
                        />
                      </div>

                      {/* Reason */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{ width: 20, height: 2, backgroundColor: '#b91c1c' }} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b91c1c' }}>
                            Reason
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(185,28,28,0.45)' }}>
                            · Optional
                          </span>
                        </div>
                        <textarea
                          value={dnfReason}
                          onChange={(e) => setDnfReason(e.target.value)}
                          placeholder="What happened?"
                          rows={3}
                          style={{
                            ...inputBase,
                            resize: 'none',
                            border: '2px solid #b91c1c',
                            fontSize: 14,
                            lineHeight: 1.6,
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Predefined tags */}
                      <div className="flex flex-wrap gap-2">
                        {DNF_TAGS.map(tag => {
                          const selected = dnfTags.includes(tag)
                          return (
                            <button
                              key={tag}
                              onClick={() =>
                                setDnfTags(prev =>
                                  selected ? prev.filter(t => t !== tag) : [...prev, tag]
                                )
                              }
                              className="text-[12px] font-bold transition-all"
                              style={{
                                border: '2px solid #b91c1c',
                                borderRadius: 999,
                                padding: '6px 14px',
                                backgroundColor: selected ? '#b91c1c' : 'transparent',
                                color: selected ? '#fff' : '#b91c1c',
                              }}
                            >
                              {selected ? '✓ ' : '+ '}{tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Completed card ───────────────────────────────────── */}
                  {status === 'read' && (
                    <div className="space-y-4">
                      {/* Green completion card */}
                      <div
                        className="relative flex items-center gap-5"
                        style={{
                          backgroundColor: 'rgba(45,106,79,0.08)',
                          border: '2px solid #2D6A4F',
                          borderRadius: 14,
                          padding: '18px 20px',
                          boxShadow: '4px 4px 0px #2D6A4F',
                        }}
                      >
                        {/* FINISHED sticker */}
                        <span
                          className="absolute -top-3 right-4 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5"
                          style={{
                            backgroundColor: 'var(--color-canvas)',
                            border: '2px solid #2D6A4F',
                            borderRadius: 6,
                            color: '#2D6A4F',
                            transform: 'rotate(2deg)',
                            display: 'inline-block',
                          }}
                        >
                          Finished
                        </span>

                        {/* 100% */}
                        <span
                          className="font-serif font-bold flex-shrink-0"
                          style={{ fontSize: 'clamp(2rem, 6vw, 2.8rem)', color: '#2D6A4F', lineHeight: 1 }}
                        >
                          100<span style={{ fontSize: '0.45em', verticalAlign: 'super' }}>%</span>
                        </span>

                        {/* Copy */}
                        <div>
                          <p className="font-serif font-bold leading-snug mb-1" style={{ fontSize: 17, color: '#2D6A4F' }}>
                            One more for the shelf.
                          </p>
                          <p className="text-[13px] leading-snug" style={{ color: 'rgba(45,106,79,0.75)' }}>
                            Saving will move{' '}
                            <em>{userBook.book?.title}</em>
                            {' '}to <strong>Finished</strong>. Want to leave a rating?
                          </p>
                        </div>
                      </div>

                      {/* Star rating */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                            Your Rating
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink-3)' }}>
                            · Optional
                          </span>
                        </div>
                        <StarRatingInput
                          value={rating}
                          onChange={setRating}
                          size={32}
                        />
                      </div>

                      {/* Public review */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                            Review
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink-3)' }}>
                            · Optional
                          </span>
                        </div>
                        <div
                          style={{
                            border: '2px solid var(--color-ink)',
                            borderRadius: 12,
                            backgroundColor: 'var(--color-canvas)',
                            padding: '14px 16px',
                          }}
                        >
                          <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="What did you think? Your friends will see this…"
                            rows={3}
                            className="marginalia-textarea"
                            style={{ color: 'var(--color-ink)', fontSize: 14, lineHeight: 1.7 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Progress ─────────────────────────────────────────── */}
                  {status === 'reading' && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 14,
                        padding: '16px 18px',
                      }}
                    >
                      {/* Progress header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-accent)' }} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent)' }}>
                            Progress
                          </span>
                        </div>
                        <span
                          className="font-serif font-bold italic"
                          style={{ fontSize: 'clamp(2rem, 5vw, 2.6rem)', color: 'var(--color-accent)', lineHeight: 1 }}
                        >
                          {percentage}<span style={{ fontSize: '0.45em', verticalAlign: 'super' }}>%</span>
                        </span>
                      </div>

                      {/* Slider */}
                      <div className="mb-5">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={handleSliderChange}
                          className="log-progress-slider w-full"
                          style={{
                            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, rgba(26,26,26,0.12) ${percentage}%, rgba(26,26,26,0.12) 100%)`,
                          }}
                        />
                      </div>

                      {/* Pages inputs */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--color-ink-3)' }}>
                            Pages Read
                          </p>
                          <input
                            type="number"
                            value={pagesRead}
                            onChange={(e) => handlePagesReadChange(e.target.value)}
                            style={inputBase}
                          />
                        </div>
                        <span className="text-[20px] font-bold mt-5" style={{ color: 'var(--color-ink-3)' }}>/</span>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--color-ink-3)' }}>
                            Total Pages
                          </p>
                          <input
                            type="number"
                            value={totalPages}
                            onChange={(e) => handleTotalPagesChange(e.target.value)}
                            style={inputBase}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Marginalia ───────────────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                        <PenLine size={12} style={{ color: 'var(--color-ink)' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                          Marginalia
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock size={10} style={{ color: 'var(--color-ink-3)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-ink-3)' }}>
                          Only You Can See This
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        border: '2px solid var(--color-ink)',
                        borderRadius: 12,
                        backgroundColor: 'var(--color-canvas)',
                        padding: '14px 16px',
                        minHeight: 120,
                      }}
                    >
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Thoughts, quotes, anything you want to remember…"
                        rows={4}
                        className="marginalia-textarea"
                        style={{ color: 'var(--color-ink)', fontSize: 14, lineHeight: 1.7 }}
                      />
                    </div>
                  </div>

                  {/* ── Privacy ──────────────────────────────────────────── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-ink)' }} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)' }}>
                        Privacy of This Update
                      </span>
                    </div>

                    <div
                      className="flex"
                      style={{
                        border: '2px solid var(--color-ink)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Public */}
                      <button
                        onClick={() => setVisibilityState('public')}
                        className="flex-1 flex items-center gap-3 px-5 py-3.5 transition-colors"
                        style={{
                          backgroundColor: visibility === 'public' ? 'var(--color-ink)' : 'var(--color-canvas)',
                          borderRight: '2px solid var(--color-ink)',
                        }}
                      >
                        <Globe size={16} style={{ color: visibility === 'public' ? 'var(--color-canvas)' : 'var(--color-ink)', flexShrink: 0 }} />
                        <div className="text-left">
                          <p className="text-[14px] font-bold" style={{ color: visibility === 'public' ? 'var(--color-canvas)' : 'var(--color-ink)' }}>
                            Public
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: visibility === 'public' ? 'rgba(250,246,235,0.55)' : 'var(--color-ink-3)' }}>
                            Friends + Feed
                          </p>
                        </div>
                      </button>

                      {/* Private */}
                      <button
                        onClick={() => setVisibilityState('private')}
                        className="flex-1 flex items-center gap-3 px-5 py-3.5 transition-colors"
                        style={{
                          backgroundColor: visibility === 'private' ? 'var(--color-ink)' : 'var(--color-canvas)',
                        }}
                      >
                        <Lock size={16} style={{ color: visibility === 'private' ? 'var(--color-canvas)' : 'var(--color-ink)', flexShrink: 0 }} />
                        <div className="text-left">
                          <p className="text-[14px] font-bold" style={{ color: visibility === 'private' ? 'var(--color-canvas)' : 'var(--color-ink)' }}>
                            Private
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: visibility === 'private' ? 'rgba(250,246,235,0.55)' : 'var(--color-ink-3)' }}>
                            Just for You
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>

                {/* ── Footer buttons ───────────────────────────────────────── */}
                <div
                  className="flex items-center gap-3 px-6 py-4"
                  style={{ borderTop: '2px solid var(--color-ink)' }}
                >
                  <button
                    onClick={handleSave}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-2 font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-85 disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '15px 24px',
                      fontSize: 13,
                    }}
                  >
                    {isBusy ? 'Saving…' : (
                      <>Stamp &amp; Save <ArrowRight size={14} strokeWidth={2.5} /></>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    disabled={isBusy}
                    className="font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 flex-shrink-0 disabled:opacity-40"
                    style={{
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '15px 20px',
                      fontSize: 12,
                      color: 'var(--color-ink)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Cancel
                  </button>

                  {userBook.id > 0 && (
                    <button
                      onClick={handleRemove}
                      disabled={isBusy}
                      className="font-bold uppercase tracking-[0.15em] transition-all flex-shrink-0 disabled:opacity-40"
                      style={{
                        border: '2px solid #b91c1c',
                        borderRadius: 999,
                        padding: '15px 16px',
                        fontSize: 12,
                        color: confirmRemove ? '#fff' : '#b91c1c',
                        backgroundColor: confirmRemove ? '#b91c1c' : 'transparent',
                        boxShadow: confirmRemove ? '3px 3px 0px #7f1d1d' : '2px 2px 0px #b91c1c',
                      }}
                      aria-label="Remove from library"
                    >
                      {removing ? 'Removing…' : confirmRemove ? 'Sure?' : 'Remove'}
                    </button>
                  )}
                </div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
