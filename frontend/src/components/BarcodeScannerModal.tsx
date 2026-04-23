'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Camera, BookOpen, Loader2, AlertCircle, ScanLine, Hash, Check } from 'lucide-react'
import { searchBooks } from '@book-app/shared/services/googleBooksService'
import { useBooksStore } from '@book-app/shared/store/booksStore'
import QuickUpdateModal from './QuickUpdateModal'
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function BarcodeScannerModal({ isOpen, onClose }: BarcodeScannerModalProps) {
  const router = useRouter()
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef      = useRef<number | null>(null)
  const lastIsbnRef = useRef<string>('')

  const [scanState,    setScanState]    = useState<ScanState>('scanning')
  const [foundBook,    setFoundBook]    = useState<Book | null>(null)
  const [scannedIsbn,  setScannedIsbn]  = useState('')
  const [manualIsbn,   setManualIsbn]   = useState('')
  const [manualError,  setManualError]  = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)

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
    if (rafRef.current)  { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const { cacheSearchResults } = useBooksStore()

  // ── Look up an ISBN via Google Books proxy ────────────────────────────────

  const lookupIsbn = useCallback(async (isbn: string) => {
    setScanState('loading')
    setScannedIsbn(isbn)
    try {
      const results = await searchBooks(`isbn:${isbn}`, 1)
      if (results.length > 0) {
        const gb = results[0]
        // Build a full Book so we can cache it — the book page reads from
        // this cache and skips its own network fetch entirely.
        const book: Book = {
          id: null,
          title:           gb.title,
          author_name:     gb.authors.join(', '),
          cover_image_url: gb.cover_image_url,
          release_date:    gb.published_date || new Date().toISOString().split('T')[0],
          isbn:            gb.isbn,
          page_count:      gb.page_count,
          description:     gb.description,
          google_books_id: gb.id,
        }
        cacheSearchResults([book])
        setFoundBook(book)
        setScanState('found')
      } else {
        setScanState('not_found')
      }
    } catch {
      setScanState('not_found')
    }
  }, [cacheSearchResults])

  // ── Start camera + scan loop ──────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    // 1. Secure context check — camera + BarcodeDetector both require HTTPS
    //    (or localhost). On a local dev server accessed from a phone via LAN IP
    //    the page is HTTP and both APIs are silently unavailable.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setScanState('no_https')
      return
    }

    // 2. Check BarcodeDetector support
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      setScanState('no_support')
      return
    }

    // 2. Create detector.
    //    Prefer EAN/UPC formats (the ones used on book barcodes), but don't
    //    pre-flight with getSupportedFormats() — Safari reports formats fine
    //    but the filter was causing false no_support results.
    //    Strategy: try with explicit formats → fall back to format-less
    //    constructor (uses all supported) → give up.
    try {
      const BarcodeDetector = (window as any).BarcodeDetector
      try {
        detectorRef.current = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
        })
      } catch {
        // Browser accepted the API but rejected the format list — use defaults
        detectorRef.current = new BarcodeDetector()
      }
    } catch {
      setScanState('no_support')
      return
    }

    // 3. Request camera (prefer rear/environment-facing)
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

    // 4. Detection loop
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
      } catch {
        // Detection errors are transient — keep looping
      }
      rafRef.current = requestAnimationFrame(detect)
    }
    rafRef.current = requestAnimationFrame(detect)
  }, [stopCamera, lookupIsbn])

  // ── Lifecycle: start / stop based on isOpen ───────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      // Reset all state for next open
      setScanState('scanning')
      setFoundBook(null)
      setScannedIsbn('')
      setManualIsbn('')
      setManualError('')
      setAddModalOpen(false)
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
    lastIsbnRef.current = ''
    setScanState('scanning')
    startCamera()
  }, [startCamera])

  // View only — just browse, no shelf modal
  const handleView = useCallback(() => {
    if (!foundBook?.google_books_id) return
    stopCamera()
    onClose()
    router.push(`/books/${foundBook.google_books_id}`)
  }, [foundBook, stopCamera, onClose, router])

  // Open QuickUpdateModal on top of the scanner
  const handleStartAdd = useCallback(() => setAddModalOpen(true), [])

  // Called when QuickUpdateModal saves successfully
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

  // ── Camera viewport shown only when camera is (or was) active ───────────
  const cameraActive = scanState === 'scanning' || scanState === 'loading'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-rim)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          maxHeight: '90vh',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}
        >
          <div className="flex items-center gap-2">
            <ScanLine size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="font-serif font-bold text-base" style={{ color: 'var(--color-lit)' }}>
              Scan Book Barcode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--color-lit-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Camera viewport ── */}
        {(cameraActive || scanState === 'no_camera') && (
          <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Scanning state — guide frame overlay */}
            {scanState === 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Darken outside the guide frame */}
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
                {/* Guide frame */}
                <div
                  className="relative z-10 rounded-xl"
                  style={{
                    width: 260,
                    height: 140,
                    border: '2px solid var(--color-accent)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0)',
                  }}
                >
                  {/* Corner accents */}
                  {[
                    'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                    'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
                  ].map((cls, i) => (
                    <span
                      key={i}
                      className={`absolute w-5 h-5 ${cls}`}
                      style={{ borderColor: 'white' }}
                    />
                  ))}
                  {/* Animated scan line */}
                  <div
                    className="absolute left-2 right-2 h-0.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      top: '50%',
                      boxShadow: '0 0 8px var(--color-accent)',
                    }}
                  />
                </div>
                <p
                  className="relative z-10 mt-4 text-xs font-medium px-4 text-center"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Point the camera at the barcode on the back cover
                </p>
              </div>
            )}

            {/* Loading state — detected, fetching */}
            {scanState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
                <Loader2
                  size={36}
                  className="animate-spin"
                  style={{ color: 'var(--color-accent)' }}
                />
                <p className="text-sm font-medium text-white">
                  Looking up ISBN {scannedIsbn}…
                </p>
              </div>
            )}

            {/* No camera */}
            {scanState === 'no_camera' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4 px-8 text-center">
                <Camera size={40} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <div>
                  <p className="font-semibold text-white mb-1">Camera unavailable</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Allow camera access in your browser, or enter the ISBN manually below.
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
            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
              >
                <AlertCircle size={26} style={{ color: '#f87171' }} />
              </div>
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--color-lit)' }}>Book not found</p>
                <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                  ISBN <span className="font-mono font-semibold">{scannedIsbn}</span> didn't match
                  any book in our catalogue.
                </p>
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-on)',
                  }}
                >
                  Scan Again
                </button>
                <button
                  onClick={handleSwitchToManual}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit-2)',
                  }}
                >
                  Enter ISBN
                </button>
              </div>
            </div>
          )}

          {/* HTTPS required — camera + BarcodeDetector blocked on plain HTTP */}
          {scanState === 'no_https' && (
            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
              >
                <ScanLine size={26} style={{ color: 'var(--color-lit-3)' }} />
              </div>
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
                  HTTPS required for camera
                </p>
                <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                  Camera access is only available on secure (HTTPS) connections.
                  This will work fine once the app is deployed — or enter the ISBN manually for now.
                </p>
              </div>
              <button
                onClick={handleSwitchToManual}
                className="px-8 py-2.5 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
              >
                Enter ISBN Manually
              </button>
            </div>
          )}

          {/* No BarcodeDetector support */}
          {scanState === 'no_support' && (
            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
              >
                <Camera size={26} style={{ color: 'var(--color-lit-3)' }} />
              </div>
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
                  Scanner not supported
                </p>
                <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                  Your browser doesn't support barcode scanning. Try Chrome or Safari on mobile,
                  or enter the ISBN manually.
                </p>
              </div>
              <button
                onClick={handleSwitchToManual}
                className="px-8 py-2.5 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
              >
                Enter ISBN Manually
              </button>
            </div>
          )}

          {/* Manual ISBN entry */}
          {scanState === 'manual' && (
            <div className="px-5 py-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Hash size={16} style={{ color: 'var(--color-accent)' }} />
                <p className="font-semibold text-sm" style={{ color: 'var(--color-lit)' }}>
                  Enter ISBN manually
                </p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualIsbn}
                    onChange={e => { setManualIsbn(e.target.value); setManualError('') }}
                    placeholder="e.g. 9780062316097"
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--color-grove)',
                      border: `1px solid ${manualError ? '#f87171' : 'var(--color-rim)'}`,
                      color: 'var(--color-lit)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = manualError ? '#f87171' : 'var(--color-rim)')}
                    autoFocus
                  />
                  {manualError && (
                    <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{manualError}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    Find Book
                  </button>
                  {'BarcodeDetector' in (typeof window !== 'undefined' ? window : {}) && (
                    <button
                      type="button"
                      onClick={handleSwitchToCamera}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
                      style={{
                        backgroundColor: 'var(--color-grove)',
                        border: '1px solid var(--color-rim)',
                        color: 'var(--color-lit-2)',
                      }}
                    >
                      Use Camera
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Loading (manual) — reuse the inline spinner */}
          {scanState === 'loading' && !cameraActive && (
            <div className="flex flex-col items-center gap-3 px-6 py-8">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
                Looking up ISBN {scannedIsbn}…
              </p>
            </div>
          )}

          {/* Found book — View / Add / Scan Again */}
          {scanState === 'found' && foundBook && (
            <div className="p-5 space-y-4">
              {/* Match pill */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit"
                style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <ScanLine size={12} />
                ISBN {scannedIsbn} matched
              </div>

              {/* Book card */}
              <div
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
              >
                {foundBook.cover_image_url ? (
                  <img
                    src={foundBook.cover_image_url}
                    alt={foundBook.title}
                    className="w-14 rounded-lg object-cover flex-shrink-0"
                    style={{ aspectRatio: '2/3', border: '1px solid var(--color-rim)' }}
                  />
                ) : (
                  <div
                    className="w-14 flex-shrink-0 rounded-lg flex items-center justify-center"
                    style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-surface)' }}
                  >
                    <BookOpen size={20} style={{ color: 'var(--color-lit-3)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="font-bold text-sm leading-snug" style={{ color: 'var(--color-lit)' }}>
                    {foundBook.title}
                  </p>
                  {foundBook.author_name && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-lit-3)' }}>
                      {foundBook.author_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Three actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleView}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit)',
                  }}
                >
                  <BookOpen size={14} />
                  View
                </button>
                <button
                  onClick={handleStartAdd}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                >
                  <Check size={14} />
                  Add to Library
                </button>
                <button
                  onClick={handleScanAgain}
                  className="px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit-2)',
                  }}
                >
                  <ScanLine size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Added — success confirmation */}
          {scanState === 'added' && foundBook && (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <Check size={26} style={{ color: '#4ade80' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--color-lit)' }}>Added to your library!</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{foundBook.title}</p>
              </div>
              <button
                onClick={handleView}
                className="mt-1 text-sm font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                View book →
              </button>
            </div>
          )}

          {/* Bottom hint bar when camera is scanning */}
          {scanState === 'scanning' && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
                Works with ISBN-13 and ISBN-10 barcodes
              </p>
              <button
                onClick={handleSwitchToManual}
                className="text-xs font-semibold underline-offset-2"
                style={{ color: 'var(--color-accent)' }}
              >
                Enter manually
              </button>
            </div>
          )}

          {/* Bottom hint when no_camera — also show manual entry link */}
          {scanState === 'no_camera' && (
            <div className="px-5 py-4 text-center">
              <button
                onClick={handleSwitchToManual}
                className="text-sm font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                Enter ISBN manually instead →
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
