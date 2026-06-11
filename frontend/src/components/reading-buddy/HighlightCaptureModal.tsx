'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { X, Bookmark, Loader2, Clipboard, Lock, HeartCrack, PenLine, Layers, ThumbsDown, Smile } from 'lucide-react'
import type { ReadingBuddyHighlight, CreateHighlightPayload } from '@book-app/shared'
import { BookCoverImage } from '@/components/BookCoverImage'

// ── Constants ─────────────────────────────────────────────────────────────────
const INK_COLORS = {
  yellow: '#F1C75B',
  clay:   '#D5582E',
  ocean:  '#1f3a5f',
  forest: '#1E6B3A',
} as const
type InkColor = keyof typeof INK_COLORS

const MOODS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'wrecked',   label: 'Wrecked me',    icon: HeartCrack },
  { key: 'craft',     label: 'On the craft',  icon: PenLine    },
  { key: 'structure', label: 'Structure',      icon: Layers     },
  { key: 'save',      label: 'Save for later',icon: Bookmark   },
  { key: 'disagree',  label: 'Disagreed',      icon: ThumbsDown },
  { key: 'laugh',     label: 'Made me laugh', icon: Smile      },
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  sessionId:     number
  bookTitle:     string
  bookAuthor?:   string
  bookCoverUrl?: string
  pageCount?:    number
  chapterCount?: number
  partnerName?:  string
  partnerPages?: number
  onClose:       () => void
  onSave:        (payload: CreateHighlightPayload) => Promise<ReadingBuddyHighlight>
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function HighlightCaptureModal({
  bookTitle, bookAuthor, bookCoverUrl,
  pageCount, chapterCount = 8,
  partnerName, partnerPages,
  onClose, onSave,
}: Props) {
  const [pageNumber,        setPageNumber]        = useState('')
  const [highlightText,     setHighlightText]     = useState('')
  const [note,              setNote]              = useState('')
  const [inkColor,          setInkColor]          = useState<InkColor>('yellow')
  const [moods,             setMoods]             = useState<Set<string>>(new Set())
  const [shareWithPartner,  setShareWithPartner]  = useState(true)
  const [spoilerLock,       setSpoilerLock]       = useState(false)
  const [saving,            setSaving]            = useState(false)
  const [saveError,         setSaveError]         = useState('')

  const pName       = partnerName?.split(' ')[0] ?? 'your buddy'
  const pageNum     = parseInt(pageNumber, 10)
  const isValidPage = pageNumber !== '' && !isNaN(pageNum) && pageNum >= 1
  const chapterLabel = isValidPage && pageCount && pageCount > 0
    ? `Ch. ${Math.min(chapterCount, Math.max(1, Math.ceil((pageNum / pageCount) * chapterCount)))}`
    : null
  const isPartnerPast = partnerPages != null && isValidPage && pageNum <= partnerPages

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const toggleMood = (key: string) =>
    setMoods(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })

  const handleSave = useCallback(async () => {
    const trimmed = highlightText.trim()
    if (!trimmed || !isValidPage) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        page_number:      pageNum,
        extracted_text:   trimmed,
        highlighted_text: trimmed,
        char_start:       0,
        char_end:         trimmed.length,
        note:             note.trim() || undefined,
        moods:            moods.size > 0 ? [...moods] : undefined,
        spoiler_lock:     spoilerLock && shareWithPartner ? true : undefined,
      })
      onClose()
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save — please try again.')
    } finally {
      setSaving(false)
    }
  }, [highlightText, note, moods, spoilerLock, shareWithPartner, pageNum, isValidPage, onSave, onClose])

  // Footer summary text
  let footerText: React.ReactNode = null
  if (shareWithPartner) {
    if (spoilerLock && !isPartnerPast && isValidPage) {
      footerText = (
        <span style={{ color: 'var(--color-ink-2)' }}>
          Hidden from <strong style={{ color: 'var(--color-ink)' }}>{pName}</strong> until they reach p. {pageNumber}.
        </span>
      )
    } else {
      footerText = (
        <span>
          <strong style={{ color: 'var(--color-accent)' }}>{pName} will see this now.</strong>
        </span>
      )
    }
  } else {
    footerText = <span style={{ color: 'var(--color-ink-3)' }}>Only you will see this.</span>
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full flex flex-col"
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          borderRadius: '20px 20px 0 0',
          maxWidth: 520,
          maxHeight: '94vh',
          overflow: 'hidden',
          boxShadow: '0 -4px 0px var(--color-ink)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex-none" style={{ padding: '20px 24px 16px', borderBottom: '2px dashed var(--color-rim)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                  Marginalia · New Highlight
                </span>
              </div>
              <h2 className="font-serif font-bold" style={{ fontSize: 28, color: 'var(--color-ink)', lineHeight: 1.05 }}>
                Mark a <em style={{ color: 'var(--color-accent)' }}>passage.</em>
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}
              aria-label="Close"
            >
              <X className="w-4 h-4" style={{ color: 'var(--color-ink)' }} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '20px 24px', minHeight: 0, overscrollBehavior: 'contain' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Book strip ──────────────────────────────────────────────── */}
          <div style={{ backgroundColor: '#F1C75B', border: '2px solid var(--color-ink)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Cover */}
            <div style={{ width: 56, aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', border: '1.5px solid rgba(0,0,0,0.2)', boxShadow: '3px 3px 0px rgba(0,0,0,0.3)', flexShrink: 0 }}>
              <BookCoverImage src={bookCoverUrl ?? null} title={bookTitle} author={bookAuthor} size="small" className="w-full h-full object-cover" />
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(26,26,26,0.55)', textTransform: 'uppercase', marginBottom: 3 }}>From the book</p>
              <p className="font-serif font-bold" style={{ fontSize: 16, color: 'var(--color-ink)', lineHeight: 1.15, marginBottom: 2 }}>{bookTitle}</p>
              {bookAuthor && (
                <p className="font-serif italic" style={{ fontSize: 13, color: 'rgba(26,26,26,0.65)' }}>by {bookAuthor}</p>
              )}
            </div>
            <div style={{ flexShrink: 0, width: 72, border: '2px solid var(--color-ink)', boxShadow: '2px 2px 0px var(--color-ink)', borderRadius: 10, backgroundColor: 'var(--color-canvas)', padding: '12px 4px', textAlign: 'center' }}>
                 <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--color-ink-3)', textTransform: 'uppercase', marginBottom: 2 }}>Page</p>
                 <input
                  type="text"
                  onChange={e => setPageNumber(e.target.value)}
                  placeholder=""
                  min={1}
                  max={pageCount}
                  className="w-full text-center font-black outline-none bg-transparent tabular-nums"
                  style={{ fontSize: 22, color: 'var(--color-ink)', lineHeight: 1, border: 'none' }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  />
            </div>
          </div>

          {/* ── Page Number ──────────────────────────────────────────────── */}


          {/* ── The Passage ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>The Passage</span>
              </div>
              <button
                onClick={async () => {
                  try { const t = await navigator.clipboard.readText(); setHighlightText(t) } catch { /* denied */ }
                }}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-ink)', border: '1.5px solid var(--color-ink)', borderRadius: 999, padding: '5px 10px', background: 'transparent', cursor: 'pointer' }}>
                <Clipboard className="w-3 h-3" /> Paste from selection
              </button>
            </div>

            {/* Passage textarea with left ink bar + open quote */}
            <div style={{ position: 'relative', border: '2px solid var(--color-ink)', borderRadius: 14, overflow: 'hidden', backgroundColor: `${INK_COLORS[inkColor]}22` }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: INK_COLORS[inkColor] }} />
              <div style={{ paddingLeft: 16, paddingRight: 12, paddingTop: 12 }}>
                <span className="font-serif" style={{ fontSize: 32, lineHeight: 1, color: INK_COLORS[inkColor], display: 'block', marginBottom: -4, fontWeight: 900 }}>&ldquo;</span>
                <textarea
                  value={highlightText}
                  onChange={e => setHighlightText(e.target.value)}
                  placeholder="Type or paste the passage…"
                  rows={4}
                  className="w-full font-serif italic resize-none outline-none bg-transparent"
                  style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--color-ink)', caretColor: 'var(--color-accent)', paddingBottom: 10 }}
                />
              </div>
              {highlightText.length > 0 && (
                <div style={{ position: 'absolute', bottom: 8, right: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', borderRadius: 4, padding: '2px 6px' }}>
                    {highlightText.length} chars
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Your Note ───────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-ink)', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>Your Note</span>
              <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>· optional</span>
            </div>
            <div style={{ position: 'relative', border: '2px solid var(--color-ink)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'var(--color-canvas)' }}>
              {/* Ruled lines illusion */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'var(--color-rim)', top: 24 + i * 28 }} />
              ))}
              {/* Red margin line */}
              <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(213,88,46,0.35)' }} />
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Your reaction, connection, thought…"
                rows={3}
                className="w-full resize-none outline-none bg-transparent"
                style={{ fontSize: 14, lineHeight: '28px', color: 'var(--color-ink)', padding: '8px 12px 8px 48px', caretColor: 'var(--color-accent)' }}
              />
            </div>
          </div>

          {/* ── Mood ────────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-ink)', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>Mood · Why it stuck</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => {
                const active = moods.has(m.key)
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleMood(m.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                      padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                      backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                      color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
                      border: '2px solid var(--color-ink)',
                      transition: 'background-color 0.12s, color 0.12s',
                    }}>
                    <m.icon className="w-3.5 h-3.5" /> {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Share With ──────────────────────────────────────────────── */}
          {partnerName && (
            <div style={{ border: '2px solid var(--color-ink)', borderRadius: 14, overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center gap-2" style={{ padding: '12px 16px 8px' }}>
                <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-ink)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>Spoiler Lock</span>
              </div>

              {/* Spoiler lock row */}
              {shareWithPartner && (
                <label
                  className="flex items-center gap-3 cursor-pointer"
                  style={{ padding: '10px 16px', borderTop: '1.5px solid var(--color-rim)', backgroundColor: 'var(--color-canvas)' }}>
                  <CheckBox checked={spoilerLock} onChange={setSpoilerLock} />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--color-ink)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  <Lock className="w-4 h-4" style={{ color: 'var(--color-accent-yellow)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Spoiler-lock until {pName} reaches this page</p>
                    {partnerPages != null && isValidPage && (
                      <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 1 }}>
                        {pName} is on p. {partnerPages}.{' '}
                        {isPartnerPast
                          ? <span style={{ color: '#1E6B3A', fontWeight: 600 }}>They'll see it immediately — they're past p. {pageNumber}.</span>
                          : <span style={{ color: 'var(--color-ink-2)' }}>Hidden for {pageNum - partnerPages} more pages of reading.</span>
                        }
                      </p>
                    )}
                  </div>
                </label>
              )}
            </div>
          )}

          {saveError && (
            <p style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>{saveError}</p>
          )}
          </div>
        </div>

        {/* ── Sticky footer ───────────────────────────────────────────────── */}
        <div className="flex-none" style={{ padding: '12px 24px 16px', borderTop: '2px dashed var(--color-rim)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ flex: 1, fontSize: 12, lineHeight: 1.5, minWidth: 0 }}>{footerText}</p>
          <button
            onClick={onClose}
            style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', border: '2px solid var(--color-ink)', borderRadius: 999, padding: '10px 18px', backgroundColor: 'transparent', color: 'var(--color-ink)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !highlightText.trim() || !isValidPage}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0px var(--color-ink)' }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
            style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', border: '2px solid var(--color-ink)', borderRadius: 999, padding: '10px 20px', backgroundColor: 'var(--color-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '3px 3px 0px var(--color-ink)', opacity: (!highlightText.trim() || !isValidPage) ? 0.4 : 1, transition: 'opacity 0.15s' }}>
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : <><Bookmark className="w-3.5 h-3.5" /> Save Highlight</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Checkbox helper ────────────────────────────────────────────────────────────
function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: '2px solid var(--color-ink)',
        backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
  )
}
