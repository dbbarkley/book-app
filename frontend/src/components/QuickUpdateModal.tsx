'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, BookOpen, Clock, XCircle, Lock, Globe, NotebookPen } from 'lucide-react'
import {
  useBookProgress,
  useUpdateBookShelf,
  useUpdateBookVisibility,
  useBookShelf,
  useBookNotes,
} from '@book-app/shared/hooks'
import type { UserBook, ShelfStatus, Visibility } from '@book-app/shared/types'
import Button from './Button'
import { BookCoverImage } from './BookCoverImage'
import SlideOver from './SlideOver'

interface QuickUpdateModalProps {
  userBook: UserBook
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

const STATUS_COLOR: Record<ShelfStatus, string> = {
  to_read:  'var(--color-lit-2)',
  reading:  'var(--color-accent)',
  read:     '#4ade80',
  dnf:      '#f87171',
}

export default function QuickUpdateModal({ userBook, isOpen, onClose, onUpdate }: QuickUpdateModalProps) {
  const { updateProgress, loading: progressLoading }   = useBookProgress()
  const { updateShelf,   loading: updateShelfLoading } = useUpdateBookShelf()
  const { addToShelf,    loading: addShelfLoading }    = useBookShelf()
  const { setVisibility, loading: visibilityLoading }  = useUpdateBookVisibility()
  const { saveNotes,     loading: notesLoading }       = useBookNotes()

  const [status,      setStatus]          = useState<ShelfStatus>(userBook?.status || 'to_read')
  const [visibility,  setVisibilityState] = useState<Visibility>(userBook?.visibility || 'public')
  const [pagesRead,   setPagesRead]       = useState(userBook?.pages_read?.toString() || '0')
  const [totalPages,  setTotalPages]      = useState(
    userBook?.total_pages?.toString() || userBook?.book?.page_count?.toString() || '0'
  )
  const [percentage, setPercentage] = useState(userBook?.completion_percentage || 0)
  const [dnfPage,    setDnfPage]    = useState(userBook?.dnf_page?.toString() || '')
  const [dnfReason,  setDnfReason]  = useState(userBook?.dnf_reason || '')
  const [notes,      setNotes]      = useState(userBook?.notes || '')

  const isBusy = progressLoading || updateShelfLoading || addShelfLoading || visibilityLoading || notesLoading

  useEffect(() => {
    if (isOpen && userBook) {
      setStatus(userBook.status)
      setVisibilityState(userBook.visibility || 'public')
      setPagesRead(userBook.pages_read?.toString() || '0')
      setTotalPages(userBook.total_pages?.toString() || userBook.book?.page_count?.toString() || '0')
      setPercentage(userBook.completion_percentage || 0)
      setDnfPage(userBook.dnf_page?.toString() || '')
      setDnfReason(userBook.dnf_reason || '')
      setNotes(userBook.notes || '')
    }
  }, [isOpen, userBook])

  if (!isOpen) return null

  // ── Save handler ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      let activeUserBookId = userBook.id

      if (activeUserBookId === 0) {
        const newBook = await addToShelf(userBook.book_id, status, userBook.book, {
          visibility,
          dnf_page:    status === 'dnf' ? parseInt(dnfPage)  : undefined,
          dnf_reason:  status === 'dnf' ? dnfReason          : undefined,
          total_pages: parseInt(totalPages) > 0 ? parseInt(totalPages) : undefined,
        })
        activeUserBookId = newBook.id
      } else {
        await updateShelf({
          userBookId: activeUserBookId,
          status,
          visibility,
          dnf_page:   status === 'dnf' ? parseInt(dnfPage) : undefined,
          dnf_reason: status === 'dnf' ? dnfReason         : undefined,
        })
      }

      if (status === 'reading' && activeUserBookId > 0) {
        const pRead  = parseInt(pagesRead)
        const tPages = parseInt(totalPages)
        if (tPages > 0) {
          await updateProgress(activeUserBookId, {
            pages_read:            pRead,
            total_pages:           tPages,
            completion_percentage: Math.round((pRead / tPages) * 100),
          })
        } else {
          await updateProgress(activeUserBookId, { completion_percentage: percentage })
        }
      }

      // Save notes if the book is on the shelf (id > 0)
      if (activeUserBookId > 0) {
        await saveNotes(activeUserBookId, notes)
      }

      onUpdate?.()
      onClose()
    } catch (error) {
      console.error('Failed to save updates:', error)
    }
  }

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setPercentage(val)
    if (parseInt(totalPages) > 0) {
      setPagesRead(Math.round((val / 100) * parseInt(totalPages)).toString())
    }
  }

  const statusOptions: { id: ShelfStatus; label: string; icon: React.ElementType }[] = [
    { id: 'to_read',  label: 'To Read',   icon: Clock       },
    { id: 'reading',  label: 'Reading',   icon: BookOpen    },
    { id: 'read',     label: 'Completed', icon: CheckCircle },
    { id: 'dnf',      label: 'DNF',       icon: XCircle     },
  ]

  // ── Styling helpers ───────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-grove)',
    border:          '1px solid var(--color-rim)',
    color:           'var(--color-lit)',
    borderRadius:    12,
    padding:         '8px 12px',
    fontSize:        13,
    width:           '100%',
    outline:         'none',
    transition:      'border-color 0.15s',
  }

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--color-accent)')
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--color-rim)')

  const sectionCard: React.CSSProperties = {
    backgroundColor: 'var(--color-grove)',
    border:          '1px solid var(--color-rim)',
    borderRadius:    16,
    padding:         16,
  }

  const labelStyle: React.CSSProperties = {
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-lit-3)',
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Update Progress">
      <div className="space-y-5">

        {/* ── Book summary ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
        >
          <div className="w-10 flex-none rounded-lg overflow-hidden shadow-md" style={{ aspectRatio: '2/3' }}>
            {userBook.book && (
              <BookCoverImage
                src={userBook.book.cover_image_url}
                title={userBook.book.title}
                size="small"
                className="w-full h-full object-cover"
                layoutId={`book-cover-${userBook.book.id}-modal`}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-snug truncate" style={{ color: 'var(--color-lit)', fontSize: 14 }}>
              {userBook.book?.title}
            </p>
            <p className="truncate italic" style={{ color: 'var(--color-lit-3)', fontSize: 12 }}>
              by {userBook.book?.author_name}
            </p>
          </div>
        </div>

        {/* ── Shelf status ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <p style={labelStyle}>Shelf Status</p>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((opt) => {
              const active = status === opt.id
              const accentColor = STATUS_COLOR[opt.id]
              return (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className="flex items-center gap-2.5 rounded-xl transition-all"
                  style={{
                    padding:         '10px 14px',
                    border:          `2px solid ${active ? accentColor : 'var(--color-rim)'}`,
                    backgroundColor: active ? `color-mix(in srgb, ${accentColor} 12%, var(--color-grove))` : 'var(--color-grove)',
                    color:           active ? accentColor : 'var(--color-lit-3)',
                  }}
                >
                  <opt.icon className="w-4 h-4 flex-none" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Progress (reading only) ───────────────────────────────────── */}
        {status === 'reading' && (
          <div className="space-y-4" style={sectionCard}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p style={labelStyle}>Progress</p>
                <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-accent)' }}>
                  {percentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={handlePercentageChange}
                className="w-full cursor-pointer"
                style={{ accentColor: 'var(--color-accent)', height: 6, borderRadius: 9999 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p style={{ ...labelStyle, fontSize: 9 }}>Pages Read</p>
                <input
                  type="number"
                  value={pagesRead}
                  onChange={(e) => {
                    setPagesRead(e.target.value)
                    const p = parseInt(e.target.value)
                    const t = parseInt(totalPages)
                    if (t > 0) setPercentage(Math.min(100, Math.round((p / t) * 100)))
                  }}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <p style={{ ...labelStyle, fontSize: 9 }}>Total Pages</p>
                <input
                  type="number"
                  value={totalPages}
                  onChange={(e) => {
                    setTotalPages(e.target.value)
                    const p = parseInt(pagesRead)
                    const t = parseInt(e.target.value)
                    if (t > 0) setPercentage(Math.min(100, Math.round((p / t) * 100)))
                  }}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── DNF details ───────────────────────────────────────────────── */}
        {status === 'dnf' && (
          <div
            className="space-y-3 rounded-2xl p-4"
            style={{
              backgroundColor: 'color-mix(in srgb, #f87171 8%, var(--color-grove))',
              border: '1px solid color-mix(in srgb, #f87171 30%, var(--color-rim))',
            }}
          >
            <div className="space-y-1.5">
              <p style={{ ...labelStyle, color: '#f87171' }}>Stopped at Page</p>
              <input
                type="number"
                value={dnfPage}
                onChange={(e) => setDnfPage(e.target.value)}
                placeholder="Optional"
                onFocus={e => (e.currentTarget.style.borderColor = '#f87171')}
                onBlur={blurBorder}
                style={{ ...inputStyle, border: '1px solid color-mix(in srgb, #f87171 30%, var(--color-rim))' }}
              />
            </div>
            <div className="space-y-1.5">
              <p style={{ ...labelStyle, color: '#f87171' }}>Reason (Optional)</p>
              <textarea
                value={dnfReason}
                onChange={(e) => setDnfReason(e.target.value)}
                placeholder="Why did you stop?"
                rows={3}
                onFocus={e => (e.currentTarget.style.borderColor = '#f87171')}
                onBlur={blurBorder}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  border: '1px solid color-mix(in srgb, #f87171 30%, var(--color-rim))',
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* ── Personal Notes ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <NotebookPen className="w-3.5 h-3.5" style={{ color: 'var(--color-lit-3)' }} />
            <p style={labelStyle}>Personal Notes</p>
            <span style={{ ...labelStyle, color: 'var(--color-lit-3)', opacity: 0.6, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
              · only you
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thoughts, quotes, anything you want to remember…"
            rows={4}
            onFocus={focusBorder}
            onBlur={blurBorder}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 } as React.CSSProperties}
          />
        </div>

        {/* ── Privacy toggle ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <p style={labelStyle}>Privacy</p>
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ backgroundColor: 'var(--color-grove)' }}
          >
            {(['public', 'private'] as Visibility[]).map((v) => {
              const selected = visibility === v
              return (
                <button
                  key={v}
                  onClick={() => setVisibilityState(v)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: selected ? 'var(--color-surface)' : 'transparent',
                    color:           selected ? 'var(--color-lit)' : 'var(--color-lit-3)',
                    fontWeight:      700,
                    fontSize:        13,
                    boxShadow:       selected ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    border:          selected ? '1px solid var(--color-rim)' : '1px solid transparent',
                  }}
                >
                  {v === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {v === 'public' ? 'Public' : 'Private'}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <div className="pt-1 pb-3">
          <Button
            onClick={handleSave}
            isLoading={isBusy}
            fullWidth
            size="md"
            className="rounded-xl py-3 font-bold"
          >
            Save Updates
          </Button>
        </div>

      </div>
    </SlideOver>
  )
}
