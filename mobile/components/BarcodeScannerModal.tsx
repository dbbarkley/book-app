/**
 * BarcodeScannerModal
 *
 * Full-screen modal that activates the rear camera, detects EAN/UPC barcodes,
 * looks up the ISBN via the backend, and lets the user add the book to their
 * library — all without leaving the Discover tab.
 *
 * States:
 *   scanning      — camera live, waiting for a barcode
 *   loading       — barcode detected, fetching book data
 *   found         — book returned; show View / Add / Scan Again
 *   not_found     — ISBN searched but no match
 *   no_permission — camera permission denied
 *   manual        — user switched to manual ISBN entry
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient, useBooksStore } from '@book-app/shared'
import type { Book, UserBook } from '@book-app/shared'
import {
  X, ScanLine, BookOpen, Hash, AlertCircle,
  Camera, Check, RotateCcw,
} from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import BookProgressSheet from '@/components/BookProgressSheet'
import { Colors } from '@/constants/colors'

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanPhase =
  | 'scanning'
  | 'loading'
  | 'found'
  | 'not_found'
  | 'no_permission'
  | 'manual'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseIsbn(raw: string): string | null {
  const digits = raw.replace(/[-\s]/g, '')
  if (/^\d{10}$/.test(digits) || /^\d{13}$/.test(digits)) return digits
  return null
}

// ── Animated scan line ────────────────────────────────────────────────────────

function ScanOverlay({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [active, anim])

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-44, 44] })

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark scrim */}
      <View style={ovl.scrim} />
      {/* Guide frame */}
      <View style={ovl.frameWrap}>
        <View style={ovl.frame}>
          {/* Corner brackets */}
          <View style={[ovl.corner, ovl.tl]} />
          <View style={[ovl.corner, ovl.tr]} />
          <View style={[ovl.corner, ovl.bl]} />
          <View style={[ovl.corner, ovl.br]} />
          {/* Scan line */}
          {active && (
            <Animated.View style={[ovl.scanLine, { transform: [{ translateY }] }]} />
          )}
        </View>
        <Text style={ovl.hint}>Point at the barcode on the back cover</Text>
      </View>
    </View>
  )
}

const FRAME_W = 260
const FRAME_H = 130
const CORNER  = 20

const ovl = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    // Cut a transparent hole in the scrim — we simply render the frame on top
    // The scrim behind it is visible, but the frame outline makes it clear
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  tl: { top: 0, left: 0,  borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accent,
    top: '50%',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
})

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  visible: boolean
  onClose: () => void
}

export default function BarcodeScannerModal({ visible, onClose }: Props) {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()

  const [phase,       setPhase]       = useState<ScanPhase>('scanning')
  const [scannedIsbn, setScannedIsbn] = useState('')
  const [foundBook,   setFoundBook]   = useState<Book | null>(null)
  const [manualIsbn,  setManualIsbn]  = useState('')
  const [manualError, setManualError] = useState('')
  const [sheetOpen,   setSheetOpen]   = useState(false)

  // Prevent duplicate scans while a lookup is in flight
  const scannedRef = useRef(false)

  const { cacheSearchResults } = useBooksStore()

  // Reset everything when the modal opens
  useEffect(() => {
    if (!visible) return
    setPhase('scanning')
    setScannedIsbn('')
    setFoundBook(null)
    setManualIsbn('')
    setManualError('')
    setSheetOpen(false)
    scannedRef.current = false
  }, [visible])

  // ── ISBN lookup ───────────────────────────────────────────────────────────

  const lookupIsbn = useCallback(async (isbn: string) => {
    setPhase('loading')
    setScannedIsbn(isbn)
    try {
      const book = await apiClient.getBookByIsbn(isbn)
      if (book) {
        cacheSearchResults([book])
        setFoundBook(book)
        setPhase('found')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        setPhase('not_found')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      }
    } catch {
      setPhase('not_found')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
  }, [cacheSearchResults])

  // ── Barcode detected by CameraView ────────────────────────────────────────

  const handleBarcode = useCallback(({ data }: { data: string }) => {
    if (scannedRef.current) return
    const isbn = parseIsbn(data)
    if (!isbn) return
    scannedRef.current = true
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    lookupIsbn(isbn)
  }, [lookupIsbn])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleScanAgain = useCallback(() => {
    scannedRef.current = false
    setFoundBook(null)
    setScannedIsbn('')
    setPhase('scanning')
  }, [])

  const handleView = useCallback(() => {
    if (!foundBook?.google_books_id) return
    onClose()
    router.push(`/book/${foundBook.google_books_id}` as any)
  }, [foundBook, onClose, router])

  const handleManualSubmit = useCallback(async () => {
    const isbn = parseIsbn(manualIsbn)
    if (!isbn) {
      setManualError('Enter a valid 10- or 13-digit ISBN')
      return
    }
    setManualError('')
    await lookupIsbn(isbn)
  }, [manualIsbn, lookupIsbn])

  const handleSwitchToManual = useCallback(() => {
    scannedRef.current = true // stop camera from triggering
    setPhase('manual')
  }, [])

  const handleSwitchToCamera = useCallback(() => {
    scannedRef.current = false
    setManualIsbn('')
    setManualError('')
    setPhase('scanning')
  }, [])

  // ── Permission handling ───────────────────────────────────────────────────

  // Ask for permission as soon as the modal opens (if not yet granted)
  useEffect(() => {
    if (!visible) return
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [visible, permission, requestPermission])

  useEffect(() => {
    if (!visible || !permission) return
    if (!permission.granted) {
      setPhase('no_permission')
    } else if (phase === 'no_permission') {
      setPhase('scanning')
    }
  }, [permission?.granted, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const cameraActive = phase === 'scanning' || phase === 'loading'

  // Phantom UserBook passed to BookProgressSheet — id:0 triggers the add flow
  const phantomUserBook: UserBook | null = foundBook ? {
    id: 0, book_id: 0, book: foundBook,
    status: 'to_read', visibility: 'public',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[s.root, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <View style={s.headerLeft}>
            <ScanLine size={18} color={Colors.accent} />
            <Text style={s.headerTitle}>Scan Book Barcode</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={s.closeBtn}>
            <X size={20} color={Colors.lit3} />
          </TouchableOpacity>
        </View>

        {/* ── Camera viewport ────────────────────────────────────────────── */}
        {cameraActive && (
          <View style={s.cameraWrap}>
            {permission?.granted ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                  }}
                  onBarcodeScanned={phase === 'scanning' ? handleBarcode : undefined}
                />
                <ScanOverlay active={phase === 'scanning'} />

                {/* Loading overlay */}
                {phase === 'loading' && (
                  <View style={s.cameraOverlay}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <Text style={s.cameraOverlayText}>Looking up ISBN {scannedIsbn}…</Text>
                  </View>
                )}
              </>
            ) : (
              /* No permission — placeholder while waiting for system prompt */
              <View style={s.cameraOverlay}>
                <Camera size={36} color="rgba(255,255,255,0.3)" />
                <Text style={s.cameraOverlayText}>Waiting for camera access…</Text>
              </View>
            )}
          </View>
        )}

        {/* ── State content ──────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* Scanning hint bar */}
          {phase === 'scanning' && (
            <View style={s.hintBar}>
              <Text style={s.hintText}>Works with ISBN-13 and ISBN-10 barcodes</Text>
              <TouchableOpacity onPress={handleSwitchToManual} hitSlop={8}>
                <Text style={s.hintLink}>Enter manually</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No permission */}
          {phase === 'no_permission' && (
            <View style={s.centred}>
              <View style={s.iconBox}>
                <Camera size={28} color={Colors.lit3} />
              </View>
              <Text style={s.stateTitle}>Camera access needed</Text>
              <Text style={s.stateSub}>
                Allow camera access so Libraio can scan book barcodes.
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>Allow Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSwitchToManual} style={s.secondaryBtn} activeOpacity={0.7}>
                <Text style={s.secondaryBtnText}>Enter ISBN manually instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Not found */}
          {phase === 'not_found' && (
            <View style={s.centred}>
              <View style={[s.iconBox, s.iconBoxError]}>
                <AlertCircle size={28} color={Colors.error} />
              </View>
              <Text style={s.stateTitle}>Book not found</Text>
              <Text style={s.stateSub}>
                ISBN <Text style={s.mono}>{scannedIsbn}</Text> didn't match anything in our catalogue.
              </Text>
              <View style={s.buttonRow}>
                <TouchableOpacity style={[s.primaryBtn, s.flex1]} onPress={handleScanAgain} activeOpacity={0.85}>
                  <RotateCcw size={15} color={Colors.accentOn} />
                  <Text style={s.primaryBtnText}>Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.ghostBtn, s.flex1]} onPress={handleSwitchToManual} activeOpacity={0.8}>
                  <Text style={s.ghostBtnText}>Enter ISBN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Manual entry */}
          {phase === 'manual' && (
            <View style={s.manual}>
              <View style={s.manualLabel}>
                <Hash size={15} color={Colors.accent} />
                <Text style={s.manualLabelText}>Enter ISBN manually</Text>
              </View>
              <TextInput
                style={[s.isbnInput, manualError ? s.isbnInputError : null]}
                value={manualIsbn}
                onChangeText={(v) => { setManualIsbn(v); setManualError('') }}
                placeholder="e.g. 9780062316097"
                placeholderTextColor={Colors.lit3}
                keyboardType="numeric"
                returnKeyType="search"
                onSubmitEditing={handleManualSubmit}
                selectionColor={Colors.accent}
                autoFocus
              />
              {manualError ? <Text style={s.manualError}>{manualError}</Text> : null}
              <View style={s.buttonRow}>
                <TouchableOpacity style={[s.primaryBtn, s.flex1]} onPress={handleManualSubmit} activeOpacity={0.85}>
                  <Text style={s.primaryBtnText}>Find Book</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.ghostBtn, s.flex1]} onPress={handleSwitchToCamera} activeOpacity={0.8}>
                  <Camera size={15} color={Colors.lit2} />
                  <Text style={s.ghostBtnText}>Use Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Loading (manual path — camera not shown) */}
          {phase === 'loading' && !cameraActive && (
            <View style={s.centred}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={s.stateSub}>Looking up ISBN {scannedIsbn}…</Text>
            </View>
          )}

          {/* Found */}
          {phase === 'found' && foundBook && (
            <View style={s.found}>
              {/* Match pill */}
              <View style={s.matchPill}>
                <ScanLine size={12} color="#4ade80" />
                <Text style={s.matchPillText}>ISBN {scannedIsbn} matched</Text>
              </View>

              {/* Book card */}
              <View style={s.bookCard}>
                <BookCover
                  uri={foundBook.cover_image_url}
                  title={foundBook.title}
                  author={foundBook.author_name}
                  width={56}
                  borderRadius={8}
                />
                <View style={s.bookCardInfo}>
                  <Text style={s.bookTitle} numberOfLines={2}>{foundBook.title}</Text>
                  {foundBook.author_name && (
                    <Text style={s.bookAuthor} numberOfLines={1}>{foundBook.author_name}</Text>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={s.buttonRow}>
                <TouchableOpacity style={[s.ghostBtn, s.flex1]} onPress={handleView} activeOpacity={0.8}>
                  <BookOpen size={15} color={Colors.lit} />
                  <Text style={s.ghostBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.primaryBtn, s.flex1]}
                  onPress={() => setSheetOpen(true)}
                  activeOpacity={0.85}
                >
                  <Check size={15} color={Colors.accentOn} />
                  <Text style={s.primaryBtnText}>Add to Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={handleScanAgain} activeOpacity={0.8} hitSlop={4}>
                  <RotateCcw size={16} color={Colors.lit2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* BookProgressSheet — floats above the modal */}
      {phantomUserBook && foundBook && (
        <BookProgressSheet
          visible={sheetOpen}
          book={foundBook}
          userBook={phantomUserBook}
          onClose={() => setSheetOpen(false)}
          onSaved={() => {
            setSheetOpen(false)
            // Brief success pause then close the scanner
            setTimeout(onClose, 600)
          }}
        />
      )}
    </Modal>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rim,
    backgroundColor: Colors.grove,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  closeBtn:    { padding: 4 },

  // Camera
  cameraWrap: {
    height: 280,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraOverlayText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  // Body
  body: { flex: 1, padding: 20 },

  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  hintText: { fontSize: 12, color: Colors.lit3 },
  hintLink: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  // Centred state layout
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxError: {
    backgroundColor: 'rgba(217,83,79,0.12)',
    borderColor: 'rgba(217,83,79,0.3)',
  },
  stateTitle: { fontSize: 17, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  stateSub:   { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  mono:       { fontVariant: ['tabular-nums'], letterSpacing: 0.5 },

  // Manual
  manual: { gap: 12 },
  manualLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  manualLabelText: { fontSize: 14, fontWeight: '600', color: Colors.lit },
  isbnInput: {
    height: 52, borderRadius: 14, paddingHorizontal: 16,
    fontSize: 16, color: Colors.lit, letterSpacing: 1,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  isbnInputError: { borderColor: Colors.error },
  manualError: { fontSize: 12, color: Colors.error },

  // Found
  found: { gap: 14 },
  matchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  matchPillText: { fontSize: 11, fontWeight: '700', color: '#4ade80' },
  bookCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 16, padding: 14,
  },
  bookCardInfo: { flex: 1, gap: 4 },
  bookTitle:    { fontSize: 15, fontWeight: '700', color: Colors.lit, lineHeight: 21 },
  bookAuthor:   { fontSize: 12, color: Colors.lit3 },

  // Shared button primitives
  buttonRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  flex1:     { flex: 1 },
  primaryBtn: {
    height: 48, borderRadius: 14, backgroundColor: Colors.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accentOn },
  ghostBtn: {
    height: 48, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
  secondaryBtn: { marginTop: 4, paddingVertical: 8 },
  secondaryBtnText: { fontSize: 13, color: Colors.accent, textAlign: 'center' },
  iconBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
})
