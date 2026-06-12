'use client'

import { useState, useRef, useEffect, DragEvent } from 'react'
import Link from 'next/link'
import {
  Download, Upload, FileText, X, Check, AlertCircle,
  ArrowRight, Loader2, CheckCircle2, XCircle, TrendingUp,
  AlertTriangle, BookOpen, BookMarked, Book, Info,
} from 'lucide-react'
import { useGoodreadsImport, useImportStatus } from '@book-app/shared'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedBook { title: string; author: string; shelf: string; rating?: number }
interface ParsedCsvData {
  totalBooks: number
  booksByShelf: { read: number; 'currently-reading': number; 'to-read': number; other: number }
  sampleBooks: ParsedBook[]
}

// ── CSV parser ────────────────────────────────────────────────────────────────

async function parseCsvForPreview(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
        const titleIdx  = headers.findIndex((h) => h === 'Title')
        const authorIdx = headers.findIndex((h) => h === 'Author')
        const shelfIdx  = headers.findIndex((h) => h === 'Exclusive Shelf')
        const ratingIdx = headers.findIndex((h) => h === 'My Rating')
        const dateReadIdx = headers.findIndex((h) => h === 'Date Read')

        const books: ParsedBook[] = []
        const counts = { read: 0, 'currently-reading': 0, 'to-read': 0, other: 0 }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim(); if (!line) continue
          const values: string[] = []
          let cur = ''; let inQ = false
          for (const ch of line) {
            if (ch === '"') { inQ = !inQ }
            else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
            else { cur += ch }
          }
          values.push(cur.trim())

          const title  = values[titleIdx]?.replace(/"/g, '').trim()
          const author = values[authorIdx]?.replace(/"/g, '').trim()
          const raw    = values[shelfIdx]?.replace(/"/g, '').trim().toLowerCase()
          const rating = parseInt(values[ratingIdx]?.replace(/"/g, '').trim() || '0', 10)
          if (!title || !author) continue

          let shelf = 'to-read'
          if (raw === 'read' || values[dateReadIdx]?.trim()) shelf = 'read'
          else if (raw === 'currently-reading' || raw === 'currently reading') shelf = 'currently-reading'
          else if (raw === 'to-read' || raw === 'to read') shelf = 'to-read'

          books.push({ title, author, shelf, rating })
          if (shelf === 'read') counts.read++
          else if (shelf === 'currently-reading') counts['currently-reading']++
          else if (shelf === 'to-read') counts['to-read']++
          else counts.other++
        }
        resolve({ totalBooks: books.length, booksByShelf: counts, sampleBooks: books.slice(0, 10) })
      } catch { reject(new Error('Failed to parse CSV')) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ── Step 1 — Instructions + file picker ───────────────────────────────────────

function StepUpload({
  onFileSelected, isLoading, error,
}: {
  onFileSelected: (f: File) => void
  isLoading: boolean
  error: string | null
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (f: File) => {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') return 'Please upload a CSV file'
    if (f.size > 10 * 1024 * 1024) return 'File must be under 10 MB'
    return null
  }

  const handle = (f: File) => {
    const err = validate(f); if (err) { setLocalError(err); return }
    setLocalError(null); setSelectedFile(f); onFileSelected(f)
  }

  const onDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false) }
  const onDrop      = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) handle(f)
  }

  const displayError = error || localError

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Instructions */}
      <div className="border-0 p-0 sm:border sm:border-dashed sm:p-5 sm:rounded-[10px]" style={{ borderColor: 'var(--color-ink-3)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: 'var(--color-ink-3)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
            Goodreads doesn't provide a public API, so CSV export is the official way to get your data.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Click "Open Goodreads Export Page" below',
            'Scroll down and click "Export Library"',
            'Wait for the CSV file to download (usually a few seconds)',
            'Come back here and upload the CSV file in the drop zone',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-canvas)' }}>{i + 1}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.55, paddingTop: 2 }}>{text}</p>
            </div>
          ))}
        </div>

        <a
          href="https://www.goodreads.com/review/import"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 0', borderRadius: 8,
            backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)', boxShadow: '3px 3px 0px var(--color-accent)',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
            textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <Download size={12} /> Open Goodreads Export Page
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-ink-3)'}`,
          borderRadius: 10, padding: '28px 20px', textAlign: 'center',
          backgroundColor: isDragging ? 'var(--color-accent-subtle)' : 'var(--color-grove)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }} disabled={isLoading} style={{ display: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={18} style={{ color: 'var(--color-accent)' }} />
          </div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
          Drop your Goodreads CSV here
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>or click to browse · CSV files up to 10 MB</p>
      </div>

      {/* Selected file pill */}
      {selectedFile && !displayError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)' }}>
          <FileText size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{(selectedFile.size / 1024).toFixed(0)} KB</p>
          </div>
          {isLoading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
          {!isLoading && (
            <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setLocalError(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-ink-3)' }}>
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {displayError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-accent)', backgroundColor: 'var(--color-accent-subtle)' }}>
          <AlertCircle size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>{displayError}</p>
        </div>
      )}

      {isLoading && (
        <p style={{ fontSize: 12, color: 'var(--color-ink-3)', textAlign: 'center' }}>Parsing your CSV…</p>
      )}
    </div>
  )
}

// ── Step 2 — Preview ──────────────────────────────────────────────────────────

function StepPreview({
  data, onConfirm, onCancel, isLoading,
}: {
  data: ParsedCsvData
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  const shelfIcon = (shelf: string) => {
    switch (shelf) {
      case 'read':              return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
      case 'currently-reading': return <BookOpen size={14} style={{ color: 'var(--color-accent)' }} />
      case 'to-read':           return <BookMarked size={14} style={{ color: 'var(--color-ink-3)' }} />
      default:                  return <Book size={14} style={{ color: 'var(--color-ink-3)' }} />
    }
  }
  const shelfLabel = (shelf: string) => ({
    'read': 'Read', 'currently-reading': 'Reading', 'to-read': 'Want to Read',
  }[shelf] ?? shelf)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Summary line */}
      <p style={{ fontSize: 14, color: 'var(--color-ink-2)', lineHeight: 1.6 }}>
        We found{' '}
        <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 17, fontWeight: 700, color: 'var(--color-ink)' }}>
          {data.totalBooks}
        </span>{' '}
        books in your export. Review the breakdown and confirm to start importing.
      </p>

      {/* Shelf stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2">
        {[
          { label: 'Total',   value: data.totalBooks,                       icon: Book },
          { label: 'Read',    value: data.booksByShelf.read,                icon: CheckCircle2 },
          { label: 'Reading', value: data.booksByShelf['currently-reading'], icon: BookOpen },
          { label: 'To Read', value: data.booksByShelf['to-read'],          icon: BookMarked },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ padding: '12px 10px', borderRadius: 8, border: '1.5px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', textAlign: 'center' }}>
            <Icon size={13} style={{ color: 'var(--color-accent)', margin: '0 auto 6px' }} />
            <div style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 22, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sample books */}
      {data.sampleBooks.length > 0 && (
        <div style={{ border: '1.5px solid var(--color-rim)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', backgroundColor: 'var(--color-grove)', borderBottom: '1px solid var(--color-rim)' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Sample Books</span>
          </div>
          {data.sampleBooks.slice(0, 5).map((book, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < Math.min(data.sampleBooks.length, 5) - 1 ? '1px solid var(--color-rim)' : 'none', backgroundColor: 'var(--color-canvas)' }}>
              <div style={{ paddingTop: 1 }}>{shelfIcon(book.shelf)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{shelfLabel(book.shelf)}</span>
                  {book.rating && book.rating > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--color-accent)', letterSpacing: 0.5, flexShrink: 0 }}>{'★'.repeat(book.rating)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.sampleBooks.length > 5 && (
            <div style={{ padding: '8px 14px', textAlign: 'center', borderTop: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>…and {data.sampleBooks.length - 5} more in the preview</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} disabled={isLoading}
          style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid var(--color-ink)', backgroundColor: 'transparent', color: 'var(--color-ink)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}>
          ← Back
        </button>
        <button onClick={onConfirm} disabled={isLoading}
          style={{ flex: 2, padding: '12px 0', borderRadius: 8, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0px var(--color-accent)', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {isLoading ? <><Loader2 size={12} className="animate-spin" /> Starting…</> : <>Start Import <ArrowRight size={12} /></>}
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Progress ─────────────────────────────────────────────────────────

function StepProgress({
  status, onReset, onSuccess,
}: {
  status: ReturnType<typeof useImportStatus>['status']
  onReset: () => void
  onSuccess?: () => void
}) {
  useEffect(() => {
    if (status?.status === 'completed' && onSuccess) {
      const t = setTimeout(onSuccess, 1500)
      return () => clearTimeout(t)
    }
  }, [status?.status, onSuccess])
  if (!status) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>Waiting for import to start…</p>
      </div>
    )
  }

  const isInProgress = status.status === 'pending' || status.status === 'processing'
  const isComplete   = status.status === 'completed'
  const isFailed     = status.status === 'failed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Status header */}
      <div style={{ textAlign: 'center', padding: '20px', borderRadius: 10, border: `1.5px solid ${isFailed ? 'var(--color-accent)' : 'var(--color-ink)'}`, backgroundColor: isFailed ? 'var(--color-accent-subtle)' : 'var(--color-canvas)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          {isComplete ? <CheckCircle2 size={28} style={{ color: 'var(--color-success)' }} />
           : isFailed  ? <XCircle size={28} style={{ color: 'var(--color-accent)' }} />
           : <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />}
        </div>
        <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.1, marginBottom: 6 }}>
          {isComplete ? 'Import Complete!' : isFailed ? 'Import Failed' : isInProgress && status.status === 'processing' ? 'Importing Your Books…' : 'Preparing Import…'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
          {isComplete
            ? `Successfully imported ${status.successful_imports} books`
            : isFailed
              ? (status.error_message || 'An error occurred during import')
              : `Processing ${status.processed_books} of ${status.total_books} books`}
        </p>
      </div>

      {/* Progress bar */}
      {isInProgress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span>Progress</span>
            <span>{status.progress_percentage}%</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, backgroundColor: 'var(--color-accent)', width: `${status.progress_percentage}%`, transition: 'width 0.5s ease-out' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-ink-3)', textAlign: 'center' }}>
            {status.processed_books} of {status.total_books} books processed
          </p>
        </div>
      )}

      {/* Stats grid */}
      {(isComplete || (isInProgress && status.processed_books > 0)) && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${status.failed_imports > 0 ? 3 : 2}, 1fr)`, gap: 8 }}>
          {[
            { icon: TrendingUp, label: 'Total',    value: status.total_books },
            { icon: CheckCircle2, label: 'Imported', value: status.successful_imports },
            ...(status.failed_imports > 0 ? [{ icon: AlertTriangle, label: 'Skipped', value: status.failed_imports }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ padding: '12px 10px', borderRadius: 8, border: '1.5px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', textAlign: 'center' }}>
              <Icon size={13} style={{ color: 'var(--color-accent)', margin: '0 auto 6px' }} />
              <div style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 22, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Partial failure note */}
      {isComplete && status.failed_imports > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 8, border: '1.5px dashed var(--color-ink-3)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--color-ink-3)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
            {status.failed_imports} books were skipped — usually missing title or author. Your other {status.successful_imports} books imported successfully.
          </p>
        </div>
      )}

      {/* Error detail */}
      {isFailed && status.error_message && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 8, border: '1.5px solid var(--color-accent)', backgroundColor: 'var(--color-accent-subtle)' }}>
          <XCircle size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>{status.error_message}</p>
        </div>
      )}

      {/* Actions */}
      {isComplete && !onSuccess && (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/library"
            style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid var(--color-ink)', backgroundColor: 'transparent', color: 'var(--color-ink)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            View My Library <ArrowRight size={11} />
          </Link>
        </div>
      )}
      {isComplete && onSuccess && (
        <p style={{ fontSize: 11, color: 'var(--color-ink-3)', textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Continuing…
        </p>
      )}

      {isFailed && (
        <button onClick={onReset}
          style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '3px 3px 0px var(--color-accent)' }}>
          Try Again
        </button>
      )}

      {isInProgress && (
        <p style={{ fontSize: 11, color: 'var(--color-ink-3)', textAlign: 'center', lineHeight: 1.6 }}>
          Feel free to navigate away — we'll keep importing in the background.
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface GoodreadsImportInlineProps {
  onSuccess?: () => void
  defaultOpen?: boolean
}

export function GoodreadsImportInline({ onSuccess, defaultOpen = false }: GoodreadsImportInlineProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [step, setStep] = useState<'upload' | 'preview' | 'progress'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ParsedCsvData | null>(null)
  const [importId, setImportId] = useState<number | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const { uploadCsv, isUploading, error: uploadError } = useGoodreadsImport()
  const { status } = useImportStatus(importId, step === 'progress')

  const handleOpen = () => { setOpen(true); setStep('upload'); setSelectedFile(null); setPreviewData(null); setParseError(null) }
  const handleClose = () => setOpen(false)
  const handleReset = () => { setStep('upload'); setSelectedFile(null); setPreviewData(null); setParseError(null); setImportId(null) }

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file); setParseError(null); setIsParsing(true)
    try {
      const parsed = await parseCsvForPreview(file)
      setPreviewData(parsed); setStep('preview')
    } catch {
      setParseError('Failed to parse CSV. Please ensure it is a valid Goodreads export.')
    } finally { setIsParsing(false) }
  }

  const handleConfirmImport = async () => {
    if (!selectedFile) return
    try {
      const result = await uploadCsv(selectedFile)
      setImportId(result.id); setStep('progress')
    } catch { /* uploadError captured by hook */ }
  }

  const stepLabel = { upload: 'Step 1 of 3', preview: 'Step 2 of 3', progress: 'Importing' }[step]
  const canGoBack  = step === 'preview'

  // ── Collapsed row ──
  if (!open) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center" style={{ border: '2px solid var(--color-ink)', borderRadius: 12, padding: '16px 20px', boxShadow: '5px 5px 0px var(--color-ink)', backgroundColor: 'var(--color-canvas)' }}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '2px 2px 0px var(--color-ink)' }}>
            <span className="font-serif font-black" style={{ fontSize: 18, color: 'var(--color-canvas)' }}>G</span>
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Goodreads</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>Import your entire library, ratings and shelves in about a minute.</p>
          </div>
        </div>
        <button onClick={handleOpen}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9999, backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', border: '2px solid var(--color-ink)', boxShadow: '3px 3px 0px var(--color-accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}>
          <Download size={12} /> Import
        </button>
      </div>
    )
  }

  // ── Expanded ──
  return (
    <div style={{ border: '2px solid var(--color-ink)', borderRadius: 12, backgroundColor: 'var(--color-canvas)', overflow: 'hidden', boxShadow: '5px 5px 0px var(--color-ink)' }}>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1.5px dashed var(--color-rim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 7, backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px var(--color-ink)' }}>
            <span className="font-serif font-black" style={{ fontSize: 15, color: 'var(--color-canvas)' }}>G</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.1 }}>Goodreads Import</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{stepLabel}</p>
          </div>
        </div>
        {step !== 'progress' && !defaultOpen && (
          <button onClick={handleClose}
            style={{ width: 30, height: 30, borderRadius: 6, border: '1.5px solid var(--color-rim)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-3)' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Step content */}
      <div style={{ padding: '24px' }}>
        {step === 'upload' && (
          <StepUpload
            onFileSelected={handleFileSelected}
            isLoading={isParsing}
            error={parseError || uploadError}
          />
        )}
        {step === 'preview' && previewData && (
          <StepPreview
            data={previewData}
            onConfirm={handleConfirmImport}
            onCancel={() => { setStep('upload'); setSelectedFile(null); setPreviewData(null) }}
            isLoading={isUploading}
          />
        )}
        {step === 'progress' && (
          <StepProgress status={status} onReset={handleReset} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  )
}
