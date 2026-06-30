'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Camera, BookOpen, Loader2, AlertCircle, ScanLine, Hash, Check } from 'lucide-react'
import { searchBooks } from '@book-app/shared/services/googleBooksService'
import { useBooksStore } from '@book-app/shared/store/booksStore'
import { apiClient } from '@book-app/shared/api/client'
import QuickUpdateModal from './QuickUpdateModal'
import { BookCoverImage } from './BookCoverImage'
import type { Book, UserBook } from '@book-app/shared'

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanState =
  | 'scanning'     // camera active, waiting for barcode
  | 'loading'      // barcode detected, looking up book
  | 'found'        // book found — show View / Add / Scan Again
  | 'added'        // success confirmation before auto-close
  | 'not_found'    // ISBN searched but no book found
  | 'no_support'   // BarcodeDetector not available in this browser
  | 'no_https'     // secure context required (camera/BarcodeDetector blocked on HTTP)
  | 'no_camera'    // camera permission denied / unavailable
  | 'manual'       // user switched to manual ISBN entry

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip hyphens and validate as ISBN-10 or ISBN-13 */
function parseIsbn(raw: string): string | null {
  const digits = raw.replace(/[-\s]/g, '')
  if (/^\d{10}$/.test(digits) || /^\d{13}$/.test(digits)) return digits
  return null
}

// ─── Shared zine button style helpers ────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  fontSize: 11, letterSpacing: '0.14em', fontWeight: 700,
  padding: '11px 20px', borderRadius: 999,
  border: '2px solid var(--color-ink)',
  boxShadow: '3px 3px 0px var(--color-accent)',
  backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
  cursor: 'pointer', textTransform: 'uppercase',
  transition: 'transform 0.1s, box-shadow 0.1s',
}

const secondaryBtn: React.CSSProperties = {
  fontSize: 11, letterSpacing: '0.14em', fontWeight: 700,
  padding: '11px 20px', borderRadius: 999,
  border: '2px solid var(--color-ink)',
  backgroundColor: 'transparent', color: 'var(--color-ink)',
  cursor: 'pointer', textTransform: 'uppercase',
}

function pressDown(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.transform = 'translate(2px,2px)'
  e.currentTarget.style.boxShadow = '1px 1px 0px var(--color-accent)'
}
function pressUp(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.transform = ''
  e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)'
}
function pressLeave(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.transform = ''
  e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BarcodeScannerModal({ isOpen, onClose }: BarcodeScannerModalProps) {
  const router = useRouter()
  const videoRef         = useRef<HTMLVideoElement>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const detectorRef      = useRef<any>(null)
  const rafRef           = useRef<number | null>(null)
  const lastIsbnRef      = useRef<string>('')
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null)

  const [scanState,       setScanState]       = useState<ScanState>('scanning')
  const [foundBook,       setFoundBook]       = useState<Book | null>(null)
  const [scannedIsbn,     setScannedIsbn]     = useState('')
  const [manualIsbn,      setManualIsbn]      = useState('')
  const [manualError,     setManualError]     = useState('')
  const [addModalOpen,    setAddModalOpen]    = useState(false)
  const [isCoverEnriching, setIsCoverEnriching] = useState(false)

  // Phantom UserBook passed to QuickUpdateModal — id:0 triggers the "add" flow
  const phantomUserBook = useMemo<UserBook | null>(() => {
    if (!foundBook) return null
    return {
      id:         0,
      book_id:    0,
      book:       foundBook,
      status:     'to_read',
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }, [foundBook])

  // ── Stop camera ──────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (zxingControlsRef.current) {
      try { zxingControlsRef.current.stop() } catch {}
      zxingControlsRef.current = null
    }
  }, [])

  const { cacheSearchResults } = useBooksStore()

  // ── Look up an ISBN via Google Books proxy ────────────────────────────────

  const lookupIsbn = useCallback(async (isbn: string) => {
    setScanState('loading')
    setScannedIsbn(isbn)
    try {
      // Check our DB first (instant if already registered; falls back to GB internally)
      let book: Book | null = null
      try {
        book = await apiClient.getBookByIsbn(isbn)
      } catch {
        // 404 or network error — fall through to external search
      }

      if (!book) {
        // DB miss — call the external search as fallback
        const results = await searchBooks(`isbn:${isbn}`, 1)
        if (results.length > 0) {
          const gb = results[0]
          book = {
            id:              null,
            title:           gb.title,
            author_name:     gb.authors.join(', '),
            cover_image_url: gb.cover_image_url,
            release_date:    gb.published_date || new Date().toISOString().split('T')[0],
            isbn:            gb.isbn,
            page_count:      gb.page_count,
            description:     gb.description,
            google_books_id: gb.id,
          }
        }
      }

      if (book) {
        cacheSearchResults([book])
        setFoundBook(book)
        setScanState('found')

        // Register the book in our DB and run Serper enrichment synchronously
        // so we get a real cover photo instead of the GB/OL PNG placeholder.
        if (!book.id) {
          setIsCoverEnriching(true)
          apiClient.registerBook({
            title:           book.title,
            isbn:            book.isbn ?? undefined,
            google_books_id: book.google_books_id ?? undefined,
            author_name:     book.author_name ?? undefined,
            cover_image_url: book.cover_image_url ?? undefined,
            description:     book.description ?? undefined,
            release_date:    book.release_date ?? undefined,
            page_count:      book.page_count ?? undefined,
            categories:      book.categories ?? undefined,
          }).then(registered => {
            setFoundBook(prev => prev ? {
              ...prev,
              id:              registered.id,
              cover_image_url: registered.cover_image_url ?? prev.cover_image_url,
            } : prev)
          }).catch(() => {/* non-critical */})
            .finally(() => setIsCoverEnriching(false))
        }
      } else {
        setScanState('not_found')
      }
    } catch {
      setScanState('not_found')
    }
  }, [cacheSearchResults])

  // ── Start camera + scan loop ──────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setScanState('no_https')
      return
    }

    // ── Path A: native BarcodeDetector (Chrome/Chromium) ─────────────────
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BD = (window as any).BarcodeDetector
        try {
          detectorRef.current = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        } catch {
          detectorRef.current = new BD()
        }
      } catch {
        // BarcodeDetector broken — fall through to ZXing below
      }

      if (detectorRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          })
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }
        } catch {
          setScanState('no_camera')
          return
        }

        const detect = async () => {
          if (!videoRef.current || !detectorRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(detect)
            return
          }
          try {
            const barcodes: { rawValue: string }[] = await detectorRef.current.detect(videoRef.current)
            for (const barcode of barcodes) {
              const isbn = parseIsbn(barcode.rawValue)
              if (isbn && isbn !== lastIsbnRef.current) {
                lastIsbnRef.current = isbn
                stopCamera()
                await lookupIsbn(isbn)
                return
              }
            }
          } catch {}
          rafRef.current = requestAnimationFrame(detect)
        }
        rafRef.current = requestAnimationFrame(detect)
        return
      }
    }

    // ── Path B: ZXing JS fallback (Safari, Firefox, everything else) ──────
    try {
      const { BrowserMultiFormatReader, BrowserCodeReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()

      // Prefer rear camera on mobile — ZXing's facingMode constraint isn't
      // always respected, so enumerate devices and pick by label.
      let deviceId: string | undefined
      try {
        const devices = await BrowserCodeReader.listVideoInputDevices()
        const rear = devices.find(d => /back|rear|environment/i.test(d.label))
        deviceId = rear?.deviceId
      } catch {}

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result) => {
          if (!result) return
          const isbn = parseIsbn(result.getText())
          if (isbn && isbn !== lastIsbnRef.current) {
            lastIsbnRef.current = isbn
            zxingControlsRef.current?.stop()
            zxingControlsRef.current = null
            lookupIsbn(isbn)
          }
        }
      )
      zxingControlsRef.current = controls
    } catch (err) {
      const isDenied = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      setScanState(isDenied ? 'no_camera' : 'no_support')
    }
  }, [stopCamera, lookupIsbn])

  // ── Lifecycle: start / stop based on isOpen ───────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setScanState('scanning')
      setFoundBook(null)
      setScannedIsbn('')
      setManualIsbn('')
      setManualError('')
      setAddModalOpen(false)
      setIsCoverEnriching(false)
      lastIsbnRef.current = ''
      return
    }
    startCamera()
    return () => stopCamera()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleScanAgain = useCallback(() => {
    setFoundBook(null)
    setScannedIsbn('')
    setIsCoverEnriching(false)
    lastIsbnRef.current = ''
    setScanState('scanning')
    startCamera()
  }, [startCamera])

  const handleView = useCallback(() => {
    if (!foundBook?.google_books_id) return
    stopCamera()
    onClose()
    router.push(`/books/${foundBook.google_books_id}`)
  }, [foundBook, stopCamera, onClose, router])

  const handleStartAdd = useCallback(() => setAddModalOpen(true), [])

  const handleAdded = useCallback(() => {
    setAddModalOpen(false)
    setScanState('added')
    setTimeout(() => onClose(), 2200)
  }, [onClose])

  const handleManualSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const isbn = parseIsbn(manualIsbn)
    if (!isbn) {
      setManualError('Please enter a valid 10- or 13-digit ISBN')
      return
    }
    setManualError('')
    await lookupIsbn(isbn)
  }, [manualIsbn, lookupIsbn])

  const handleSwitchToManual = useCallback(() => {
    stopCamera()
    setScanState('manual')
  }, [stopCamera])

  const handleSwitchToCamera = useCallback(() => {
    setManualIsbn('')
    setManualError('')
    setScanState('scanning')
    startCamera()
  }, [startCamera])

  if (!isOpen) return null

  const cameraActive = scanState === 'scanning' || scanState === 'loading'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — no blur, solid dark overlay */}
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      {/* Sheet — hard border + bottom-right offset accent shadow */}
      <div
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 448,
          backgroundColor: 'var(--color-canvas)',
          border: '2px solid var(--color-ink)',
          borderRadius: 20,
          boxShadow: '6px 6px 0px var(--color-accent)',
          maxHeight: '90vh',
        }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ backgroundColor: 'var(--color-ink)', borderBottom: '2px solid var(--color-ink)' }}
        >
          <div className="flex items-center gap-2.5">
            <ScanLine size={16} style={{ color: 'var(--color-accent)' }} />
            <h2
              className="font-serif font-black uppercase"
              style={{ fontSize: 13, letterSpacing: '0.16em', color: '#FAF6EB' }}
            >
              Scan Barcode
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'rgba(250,246,235,0.45)', lineHeight: 0, padding: 4, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FAF6EB')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,246,235,0.45)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Camera viewport ── */}
        {(cameraActive || scanState === 'no_camera') && (
          <div
            className="relative bg-black flex-shrink-0"
            style={{ aspectRatio: '4/3', borderBottom: '2px solid var(--color-ink)' }}
          >
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

            {/* Scanning overlay — guide frame */}
            {scanState === 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
                <div
                  className="relative z-10"
                  style={{
                    width: 260, height: 140,
                    border: '2px solid var(--color-accent)',
                  }}
                >
                  {/* Sharp corner accents */}
                  {[
                    'top-0 left-0 border-t-2 border-l-2',
                    'top-0 right-0 border-t-2 border-r-2',
                    'bottom-0 left-0 border-b-2 border-l-2',
                    'bottom-0 right-0 border-b-2 border-r-2',
                  ].map((cls, i) => (
                    <span key={i} className={`absolute w-5 h-5 ${cls}`} style={{ borderColor: 'white' }} />
                  ))}
                  <div
                    className="absolute left-2 right-2 h-0.5 animate-bounce"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      top: '50%',
                      boxShadow: '0 0 8px var(--color-accent)',
                    }}
                  />
                </div>
                <p
                  className="relative z-10 mt-4 font-bold uppercase text-center px-4"
                  style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.65)' }}
                >
                  Point camera at back cover barcode
                </p>
              </div>
            )}

            {/* Loading overlay */}
            {scanState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-3">
                <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                <p
                  className="font-bold uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.75)' }}
                >
                  Looking up ISBN {scannedIsbn}…
                </p>
              </div>
            )}

            {/* No camera */}
            {scanState === 'no_camera' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 px-8 text-center">
                <Camera size={36} style={{ color: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <p
                    className="font-bold uppercase mb-1.5"
                    style={{ fontSize: 11, letterSpacing: '0.14em', color: 'white' }}
                  >
                    Camera unavailable
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                    Allow camera access in your browser, or enter the ISBN manually.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Body: per-state content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Not found */}
          {scanState === 'not_found' && (
            <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
              <div
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-accent)',
                  backgroundColor: 'var(--color-cave)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <AlertCircle size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <p className="font-serif font-black text-lg mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Book not found
                </p>
                <p className="text-sm" style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
                  ISBN <span className="font-mono font-bold">{scannedIsbn}</span> didn't match
                  any book in our catalogue.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 transition-all"
                  style={{ ...primaryBtn }}
                  onMouseDown={pressDown}
                  onMouseUp={pressUp}
                  onMouseLeave={pressLeave}
                >
                  Scan Again
                </button>
                <button
                  onClick={handleSwitchToManual}
                  className="flex-1 transition-opacity hover:opacity-70"
                  style={{ ...secondaryBtn }}
                >
                  Enter ISBN
                </button>
              </div>
            </div>
          )}

          {/* HTTPS required */}
          {scanState === 'no_https' && (
            <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
              <div
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                  backgroundColor: 'var(--color-cave)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ScanLine size={24} style={{ color: 'var(--color-ink-3)' }} />
              </div>
              <div>
                <p className="font-serif font-black text-lg mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  HTTPS required
                </p>
                <p className="text-sm" style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
                  Camera access is only available on secure (HTTPS) connections.
                  Works fine once deployed — or enter the ISBN manually for now.
                </p>
              </div>
              <button
                onClick={handleSwitchToManual}
                className="transition-all"
                style={{ ...primaryBtn }}
                onMouseDown={pressDown}
                onMouseUp={pressUp}
                onMouseLeave={pressLeave}
              >
                Enter ISBN Manually
              </button>
            </div>
          )}

          {/* No BarcodeDetector support */}
          {scanState === 'no_support' && (
            <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
              <div
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                  backgroundColor: 'var(--color-cave)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Camera size={24} style={{ color: 'var(--color-ink-3)' }} />
              </div>
              <div>
                <p className="font-serif font-black text-lg mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Scanner unavailable
                </p>
                <p className="text-sm" style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
                  The scanner failed to load. Check your connection and try again, or enter the ISBN manually.
                </p>
              </div>
              <button
                onClick={handleSwitchToManual}
                className="transition-all"
                style={{ ...primaryBtn }}
                onMouseDown={pressDown}
                onMouseUp={pressUp}
                onMouseLeave={pressLeave}
              >
                Enter ISBN Manually
              </button>
            </div>
          )}

          {/* Manual ISBN entry */}
          {scanState === 'manual' && (
            <div className="px-5 py-6">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5" style={{ marginBottom: 20 }}>
                <div style={{ width: 18, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
                  color: 'var(--color-accent)', textTransform: 'uppercase',
                }}>
                  Enter ISBN
                </span>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualIsbn}
                    onChange={e => { setManualIsbn(e.target.value); setManualError('') }}
                    placeholder="e.g. 9780062316097"
                    className="w-full font-mono outline-none"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `2px solid ${manualError ? 'var(--color-accent)' : 'var(--color-ink)'}`,
                      backgroundColor: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                      fontSize: 15,
                      boxShadow: '3px 3px 0px var(--color-ink)',
                      transition: 'border-color 0.12s, box-shadow 0.12s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = manualError ? 'var(--color-accent)' : 'var(--color-ink)'
                      e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)'
                    }}
                    autoFocus
                  />
                  {manualError && (
                    <p className="mt-2 text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                      {manualError}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 transition-all"
                    style={{ ...primaryBtn }}
                    onMouseDown={pressDown}
                    onMouseUp={pressUp}
                    onMouseLeave={pressLeave}
                  >
                    Find Book
                  </button>
                  {'BarcodeDetector' in (typeof window !== 'undefined' ? window : {}) && (
                    <button
                      type="button"
                      onClick={handleSwitchToCamera}
                      className="flex-1 transition-opacity hover:opacity-70"
                      style={{ ...secondaryBtn }}
                    >
                      Use Camera
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Loading (manual flow) */}
          {scanState === 'loading' && !cameraActive && (
            <div className="flex flex-col items-center gap-3 px-6 py-8">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p
                className="font-bold uppercase"
                style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}
              >
                Looking up ISBN {scannedIsbn}…
              </p>
            </div>
          )}

          {/* Found book */}
          {scanState === 'found' && foundBook && (
            <div className="p-5 space-y-4">
              {/* Match pill */}
              <div
                className="flex items-center gap-1.5 w-fit font-bold uppercase"
                style={{
                  fontSize: 9, letterSpacing: '0.16em',
                  padding: '5px 12px', borderRadius: 999,
                  border: '1.5px solid rgba(74,222,128,0.4)',
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  color: '#16a34a',
                }}
              >
                <ScanLine size={11} />
                ISBN {scannedIsbn} matched
              </div>

              {/* Book card */}
              <div
                className="flex items-start gap-4 p-4"
                style={{
                  border: '2px solid var(--color-ink)',
                  borderRadius: 14,
                  boxShadow: '4px 4px 0px var(--color-accent)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ border: '1.5px solid var(--color-ink)', boxShadow: '2px 2px 0px var(--color-ink)', borderRadius: 4, flexShrink: 0 }}>
                  {isCoverEnriching ? (
                    <div
                      style={{
                        width: 96, height: 144, borderRadius: 4,
                        backgroundColor: 'var(--color-cave)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-ink-3)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>
                        Finding cover
                      </span>
                    </div>
                  ) : (
                    <BookCoverImage
                      src={foundBook.cover_image_url
                        ?.replace('zoom=1', 'zoom=0')
                        ?.replace('&edge=curl', '')
                        ?.replace('http://', 'https://')}
                      isbn={foundBook.isbn ?? undefined}
                      title={foundBook.title}
                      author={foundBook.author_name ?? undefined}
                      size="small"
                      priority
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="font-serif font-black leading-snug" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
                    {foundBook.title}
                  </p>
                  {foundBook.author_name && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--color-ink-3)' }}>
                      {foundBook.author_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Three actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleView}
                  className="flex-1 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{ ...secondaryBtn, padding: '10px 16px' }}
                >
                  <BookOpen size={13} />
                  View
                </button>
                <button
                  onClick={handleStartAdd}
                  className="flex-1 flex items-center justify-center gap-1.5 transition-all"
                  style={{ ...primaryBtn, padding: '10px 16px' }}
                  onMouseDown={pressDown}
                  onMouseUp={pressUp}
                  onMouseLeave={pressLeave}
                >
                  <Check size={13} />
                  Add
                </button>
                <button
                  onClick={handleScanAgain}
                  className="transition-opacity hover:opacity-70"
                  style={{
                    padding: '10px 14px', borderRadius: 999,
                    border: '2px solid var(--color-ink)',
                    backgroundColor: 'transparent', color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  <ScanLine size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Added — success */}
          {scanState === 'added' && foundBook && (
            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px #16a34a',
                  backgroundColor: 'rgba(74,222,128,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={26} style={{ color: '#16a34a' }} />
              </div>
              <div>
                <p className="font-serif font-black text-lg" style={{ color: 'var(--color-ink)' }}>
                  Added to your library!
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
                  {foundBook.title}
                </p>
              </div>
              <button
                onClick={handleView}
                className="font-bold uppercase transition-opacity hover:opacity-70"
                style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-accent)' }}
              >
                View book →
              </button>
            </div>
          )}

          {/* Bottom hint bar when scanning */}
          {scanState === 'scanning' && (
            <div
              className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{ borderTop: '1.5px dashed var(--color-rim)' }}
            >
              <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
                Works with ISBN-13 and ISBN-10
              </p>
              <button
                onClick={handleSwitchToManual}
                className="font-bold uppercase transition-opacity hover:opacity-70"
                style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--color-accent)' }}
              >
                Enter manually
              </button>
            </div>
          )}

          {/* No camera hint */}
          {scanState === 'no_camera' && (
            <div
              className="px-5 py-4 text-center"
              style={{ borderTop: '1.5px dashed var(--color-rim)' }}
            >
              <button
                onClick={handleSwitchToManual}
                className="font-bold uppercase transition-opacity hover:opacity-70"
                style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-accent)' }}
              >
                Enter ISBN manually →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QuickUpdateModal rendered as a sibling so its SlideOver sits above the scanner */}
      {phantomUserBook && (
        <QuickUpdateModal
          userBook={phantomUserBook}
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onUpdate={handleAdded}
        />
      )}
    </div>
  )
}
