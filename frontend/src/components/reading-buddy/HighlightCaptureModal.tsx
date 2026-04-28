'use client'

/**
 * HighlightCaptureModal — 2-step highlight capture flow
 *
 * Step 1: Enter page number
 * Step 2: Type the passage you want to highlight → save
 */

import { useState, useCallback } from 'react'
import { X, BookOpen, Check, Loader2, Highlighter } from 'lucide-react'
import type { ReadingBuddyHighlight, CreateHighlightPayload } from '@book-app/shared'

// ── Types ────────────────────────────────────────────────────────────────────
type Step = 'page_number' | 'text_entry'

interface Props {
  sessionId:  number
  bookTitle:  string
  pageCount?: number
  onClose:    () => void
  onSave:     (payload: CreateHighlightPayload) => Promise<ReadingBuddyHighlight>
}

// ── Component ────────────────────────────────────────────────────────────────
export default function HighlightCaptureModal({
  bookTitle,
  pageCount,
  onClose,
  onSave,
}: Props) {
  const [step, setStep]               = useState<Step>('page_number')
  const [pageNumber, setPageNumber]   = useState('')
  const [pageNumError, setPageNumError] = useState('')

  const [highlightText, setHighlightText] = useState('')
  const [textError, setTextError]         = useState('')

  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── Step 1 ───────────────────────────────────────────────────────────────
  const handlePageNumberNext = () => {
    const num = parseInt(pageNumber, 10)
    if (!pageNumber || isNaN(num) || num < 1) {
      setPageNumError('Please enter a valid page number.')
      return
    }
    if (pageCount && num > pageCount) {
      setPageNumError(`This book has ${pageCount} pages.`)
      return
    }
    setPageNumError('')
    setStep('text_entry')
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const trimmed = highlightText.trim()
    if (!trimmed) {
      setTextError('Please enter the passage you want to highlight.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        page_number:      parseInt(pageNumber, 10),
        extracted_text:   trimmed,
        highlighted_text: trimmed,
        char_start:       0,
        char_end:         trimmed.length,
      })
      onClose()
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save — please try again.')
    } finally {
      setSaving(false)
    }
  }, [highlightText, pageNumber, onSave, onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-rim)',
          borderRadius: '24px 20px 22px 26px',
          maxWidth: 480,
          maxHeight: '90vh',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="flex-none flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-rim)' }}
        >
          <div>
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--color-lit)' }}>
              Add Highlight
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-lit-3)' }}>
              {bookTitle}{step !== 'page_number' ? ` · p. ${pageNumber}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 flex-none ml-4"
            style={{ backgroundColor: 'var(--color-grove)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
          </button>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <div className="flex-none flex gap-2 px-6 pt-4">
          {(['page_number', 'text_entry'] as Step[]).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  step === s ? 'var(--color-accent)'
                  : (['page_number', 'text_entry'].indexOf(step) > i) ? 'var(--color-success)'
                  : 'var(--color-rim)',
              }}
            />
          ))}
        </div>

        {/* ── Step content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ─ Step 1: Page number ───────────────────────────────────── */}
          {step === 'page_number' && (
            <div className="px-6 py-8 flex flex-col items-center gap-6">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-grove)', borderRadius: '14px 12px 13px 15px' }}
              >
                <BookOpen className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
              </div>

              <div className="w-full text-center space-y-2">
                <h3 className="font-serif text-base font-medium" style={{ color: 'var(--color-lit)' }}>
                  What page are you on?
                </h3>
                {pageCount && (
                  <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                    {pageCount} pages total
                  </p>
                )}
              </div>

              <div className="w-full space-y-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={pageNumber}
                  onChange={e => { setPageNumber(e.target.value); setPageNumError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handlePageNumberNext() }}
                  placeholder="Page number"
                  className="w-full text-center text-3xl font-serif outline-none bg-transparent"
                  style={{
                    borderBottom: `2px solid ${pageNumError ? 'var(--color-error)' : 'var(--color-accent)'}`,
                    color: 'var(--color-lit)',
                    paddingBottom: 8,
                    caretColor: 'var(--color-accent)',
                  }}
                  autoFocus
                />
                {pageNumError && (
                  <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
                    {pageNumError}
                  </p>
                )}
              </div>

              <button
                onClick={handlePageNumberNext}
                className="w-full py-3 font-bold text-sm transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-on)',
                  borderRadius: '14px 12px 13px 15px',
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* ─ Step 2: Type the passage ──────────────────────────────── */}
          {step === 'text_entry' && (
            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex-none flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-grove)', borderRadius: '10px 9px 10px 11px' }}
                >
                  <Highlighter className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-lit)' }}>
                    Type the passage
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
                    Copy the text you want to save from p. {pageNumber}
                  </p>
                </div>
              </div>

              <textarea
                value={highlightText}
                onChange={e => { setHighlightText(e.target.value); setTextError('') }}
                placeholder="Type the highlighted passage here…"
                className="w-full font-serif text-sm leading-relaxed p-4 resize-none outline-none"
                style={{
                  color: 'var(--color-lit)',
                  backgroundColor: 'var(--color-grove)',
                  border: `1px solid ${textError ? 'var(--color-error)' : 'var(--color-accent)'}`,
                  borderRadius: '14px 12px 13px 15px',
                  minHeight: 180,
                  caretColor: 'var(--color-accent)',
                }}
                autoFocus
              />

              {textError && (
                <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
                  {textError}
                </p>
              )}

              {saveError && (
                <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
                  {saveError}
                </p>
              )}

              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => setStep('page_number')}
                  disabled={saving}
                  className="px-5 py-3 font-bold text-sm transition-all hover:opacity-80 disabled:opacity-30"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit-2)',
                    borderRadius: '14px 12px 13px 15px',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !highlightText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-on)',
                    borderRadius: '14px 12px 13px 15px',
                  }}
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Check className="w-4 h-4" /> Save Highlight</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
