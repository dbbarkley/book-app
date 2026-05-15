/**
 * BookProgressSheet
 *
 * Compact half-screen bottom sheet for shelving / updating progress.
 * Uses a transparent Modal + backdrop so the book detail screen stays
 * visible behind it.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { BookOpen, CheckCircle, Clock, XCircle, Star, Lock } from 'lucide-react-native'
import { useBooksStore, useBookShelf, apiClient } from '@book-app/shared'
import type { UserBook, ShelfStatus, Book } from '@book-app/shared'
import ProgressBar from '@/components/ProgressBar'
import { Colors } from '@/constants/colors'

interface BookProgressSheetProps {
  visible:  boolean
  userBook: UserBook | null
  book:     Book
  onClose:  () => void
  onSaved?: () => void
}

type StatusOption = { value: ShelfStatus; label: string; icon: React.ReactNode }

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'reading',  label: 'Reading',      icon: <BookOpen    size={14} color={Colors.accent}  /> },
  { value: 'to_read',  label: 'Want to Read', icon: <Clock       size={14} color={Colors.lit2}    /> },
  { value: 'read',     label: 'Completed',    icon: <CheckCircle size={14} color={Colors.success} /> },
  { value: 'dnf',      label: 'DNF',          icon: <XCircle     size={14} color={Colors.lit3}    /> },
]

// ── Interactive star picker ────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={starStyles.row}>
      {Array.from({ length: 5 }, (_, i) => {
        const starVal = i + 1
        const filled  = starVal <= value
        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              onChange(starVal)
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }}
            hitSlop={6}
            accessibilityLabel={`Rate ${starVal} star${starVal !== 1 ? 's' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: filled }}
          >
            <Star
              size={28}
              color={Colors.accent}
              fill={filled ? Colors.accent : 'transparent'}
              style={{ opacity: filled ? 1 : 0.55 }}
            />
          </TouchableOpacity>
        )
      })}
      {value > 0 && (
        <TouchableOpacity
          onPress={() => onChange(0)}
          hitSlop={6}
          accessibilityLabel="Clear rating"
          accessibilityRole="button"
          style={starStyles.clearBtn}
        >
          <Text style={starStyles.clearText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const starStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: { marginLeft: 4 },
  clearText: { fontSize: 12, color: Colors.lit2, fontWeight: '600' },
})

// ── Main component ─────────────────────────────────────────────────────────────
export default function BookProgressSheet({
  visible, userBook, book, onClose, onSaved,
}: BookProgressSheetProps) {
  const insets = useSafeAreaInsets()
  const { updateProgress, removeFromShelf, loading: progressLoading } = useBooksStore()
  const { addToShelf, loading: shelfLoading } = useBookShelf()
  const loading = progressLoading || shelfLoading

  const [status,    setStatus]    = useState<ShelfStatus>('to_read')
  const [pagesStr,  setPagesStr]  = useState('')
  const [totalStr,  setTotalStr]  = useState('')
  const [rating,    setRating]    = useState(0)
  const [review,    setReview]    = useState('')
  const [dnfReason, setDnfReason] = useState('')
  const [notes,     setNotes]     = useState('')

  const isEditing = !!(userBook?.id && userBook.id > 0)

  useEffect(() => {
    if (!visible) return
    if (userBook) {
      setStatus(userBook.status)
      // DNF uses dnf_page for the stopped-at field; others use pages_read
      const initPage = userBook.status === 'dnf'
        ? (userBook.dnf_page ?? userBook.pages_read)
        : userBook.pages_read
      setPagesStr(initPage != null ? String(initPage) : '')
      setTotalStr(userBook.total_pages != null ? String(userBook.total_pages) :
                  book.page_count      != null ? String(book.page_count)       : '')
      setRating(userBook.rating ? Math.round(userBook.rating) : 0)
      setReview(userBook.review ?? '')
      setDnfReason(userBook.dnf_reason ?? '')
      setNotes(userBook.notes ?? '')
    } else {
      setStatus('to_read')
      setPagesStr('')
      setTotalStr(book.page_count != null ? String(book.page_count) : '')
      setRating(0)
      setReview('')
      setDnfReason('')
      setNotes('')
    }
  }, [visible, userBook, book])

  const pRead  = parseInt(pagesStr, 10) || 0
  const tPages = parseInt(totalStr, 10) || 0
  const pct    = tPages > 0 ? Math.min(100, Math.round((pRead / tPages) * 100)) : 0

  const handleStatusChange = useCallback((val: ShelfStatus) => {
    setStatus(val)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const handlePagesChange = useCallback((val: string) => {
    setPagesStr(val)
    const p = parseInt(val, 10) || 0
    const t = parseInt(totalStr, 10) || 0
    if (t > 0 && p >= t) {
      setStatus('read')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else if (status === 'read' && p < t) {
      setStatus('reading')
    }
  }, [totalStr, status])

  const handleTotalChange = useCallback((val: string) => {
    setTotalStr(val)
    const p = parseInt(pagesStr, 10) || 0
    const t = parseInt(val, 10) || 0
    if (t > 0 && p >= t) {
      setStatus('read')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [pagesStr])

  const handleSave = async () => {
    try {
      const isCompleted = status === 'read'
      const isDNF       = status === 'dnf'

      if (isEditing) {
        await updateProgress(userBook!.id, {
          status,
          pages_read:            isCompleted ? (tPages || pRead || undefined) : (!isDNF ? pRead || undefined : undefined),
          total_pages:           !isDNF ? (tPages || undefined) : undefined,
          completion_percentage: isCompleted ? 100 : (tPages > 0 ? pct : undefined),
          rating:                isCompleted && rating > 0 ? rating : undefined,
          review:                isCompleted ? review.trim() || undefined : undefined,
          dnf_page:              isDNF ? pRead || undefined : undefined,
          dnf_reason:            isDNF ? dnfReason.trim() || undefined : undefined,
        })
        // Private notes have their own endpoint
        if (isCompleted) {
          const notesChanged = notes.trim() !== (userBook?.notes ?? '')
          if (notesChanged) await apiClient.saveBookNotes(userBook!.id, notes.trim())
        }
      } else {
        const newUserBook = await addToShelf(book.id, status, book, {
          total_pages: !isDNF ? (tPages || undefined) : undefined,
          dnf_page:    isDNF ? pRead || undefined : undefined,
          dnf_reason:  isDNF ? dnfReason.trim() || undefined : undefined,
        })
        if (isCompleted && notes.trim()) {
          await apiClient.saveBookNotes(newUserBook.id, notes.trim())
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSaved?.()
      onClose()
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save progress.')
    }
  }

  const handleRemove = () => {
    if (!userBook?.id) return
    Alert.alert(
      'Remove from shelf',
      `Remove "${book.title}" from your library? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromShelf(userBook!.id)
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              onSaved?.()
              onClose()
            } catch (err) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
              Alert.alert('Remove failed', err instanceof Error ? err.message : 'Could not remove book.')
            }
          },
        },
      ]
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop — tap to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrap}
      >
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
          accessibilityViewIsModal
          accessible={false}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          {/* Book title header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
            {book.author_name ? (
              <Text style={styles.headerAuthor} numberOfLines={1}>by {book.author_name}</Text>
            ) : null}
          </View>

          {/* Status pills — 2×2 grid so pills never orphan on narrow screens */}
          <Text style={styles.sectionLabel}>{isEditing ? 'Update shelf' : 'Add to shelf'}</Text>
          <View style={styles.statusGrid}>
            {[STATUS_OPTIONS.slice(0, 2), STATUS_OPTIONS.slice(2, 4)].map((row, rowIdx) => (
              <View key={rowIdx} style={styles.statusRow}>
                {row.map((opt) => {
                  const active = status === opt.value
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => handleStatusChange(opt.value)}
                      activeOpacity={0.75}
                      accessibilityLabel={`Set status to ${opt.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      {opt.icon}
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </View>

          {/* Pages + progress (Reading only) */}
          {status === 'reading' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Pages</Text>
              <View style={styles.pagesRow}>
                <View style={styles.pagesInputWrap}>
                  <Text style={styles.pagesLabel}>Read</Text>
                  <TextInput
                    style={styles.pagesInput}
                    value={pagesStr}
                    onChangeText={handlePagesChange}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.lit3}
                    selectionColor={Colors.accent}
                  />
                </View>
                <Text style={styles.pagesDivider}>/</Text>
                <View style={styles.pagesInputWrap}>
                  <Text style={styles.pagesLabel}>Total</Text>
                  <TextInput
                    style={styles.pagesInput}
                    value={totalStr}
                    onChangeText={handleTotalChange}
                    keyboardType="number-pad"
                    placeholder={book.page_count ? String(book.page_count) : '—'}
                    placeholderTextColor={Colors.lit3}
                    selectionColor={Colors.accent}
                  />
                </View>
              </View>
              {tPages > 0 && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBarFlex}>
                    <ProgressBar percent={pct} height={6} />
                  </View>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
              )}
            </>
          )}

          {/* DNF — stopped at page + reason */}
          {status === 'dnf' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Stopped at page</Text>
              <TextInput
                style={[styles.pagesInput, styles.dnfPageInput]}
                value={pagesStr}
                onChangeText={setPagesStr}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.lit3}
                selectionColor={Colors.accent}
                accessibilityLabel="Stopped at page"
              />
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Why did you stop?</Text>
              <View style={styles.reviewInputWrap}>
                <TextInput
                  style={styles.reviewInput}
                  value={dnfReason}
                  onChangeText={setDnfReason}
                  placeholder="Optional note about why you stopped…"
                  placeholderTextColor={Colors.lit3}
                  selectionColor={Colors.accent}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                  accessibilityLabel="Why did you stop reading"
                />
              </View>
            </>
          )}

          {/* Star rating, public review, private notes — shown when marking as completed */}
          {status === 'read' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Your Rating</Text>
              <StarPicker value={rating} onChange={setRating} />
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Review</Text>
              <View style={styles.reviewInputWrap}>
                <TextInput
                  style={styles.reviewInput}
                  value={review}
                  onChangeText={setReview}
                  placeholder="Write a short review (optional)…"
                  placeholderTextColor={Colors.lit3}
                  selectionColor={Colors.accent}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                  accessibilityLabel="Write a review"
                />
              </View>
              <View style={styles.privateNotesHeader}>
                <Lock size={11} color={Colors.lit3} />
                <Text style={styles.sectionLabel}>Private Notes</Text>
              </View>
              <View style={styles.reviewInputWrap}>
                <TextInput
                  style={styles.reviewInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Personal notes — only visible to you…"
                  placeholderTextColor={Colors.lit3}
                  selectionColor={Colors.accent}
                  multiline
                  numberOfLines={3}
                  maxLength={2000}
                  textAlignVertical="top"
                  accessibilityLabel="Private notes"
                />
              </View>
            </>
          )}

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityLabel="Save progress"
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color={Colors.accentOn} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>

          {/* Remove from shelf — only when editing an existing entry */}
          {isEditing && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleRemove}
              activeOpacity={0.8}
              accessibilityLabel="Remove book from shelf"
              accessibilityRole="button"
            >
              <Text style={styles.removeBtnText}>Remove from shelf</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // ── Backdrop ──────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    gap: 16,
    // Subtle shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },

  dragHandleRow: { alignItems: 'center', paddingTop: 10, marginBottom: -4 },
  dragHandle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.rim },

  // ── Header ────────────────────────────────────────────────────────────────
  headerRow:   { gap: 2, marginBottom: -4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  headerAuthor:{ fontSize: 12, color: Colors.lit2, fontStyle: 'italic' },

  // ── Labels ────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', color: Colors.lit3,
    marginBottom: -6,
  },

  // ── Status pills — 2×2 fixed grid ─────────────────────────────────────────
  statusGrid: { gap: 8 },
  statusRow:  { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 22, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  pillActive:     { backgroundColor: Colors.grove, borderColor: Colors.accent },
  pillText:       { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
  pillTextActive: { color: Colors.lit },

  // ── Pages ─────────────────────────────────────────────────────────────────
  pagesRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pagesInputWrap: { flex: 1, gap: 6 },
  pagesLabel:     { fontSize: 11, fontWeight: '600', color: Colors.lit2 },
  pagesInput: {
    height: 52, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 20, fontWeight: '700', color: Colors.lit,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    textAlign: 'center',
  },
  pagesDivider:    { fontSize: 22, color: Colors.lit3, marginTop: 18 },
  dnfPageInput:    { alignSelf: 'flex-start', width: 120 },
  progressWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarFlex: { flex: 1 },
  progressPct:     { fontSize: 13, fontWeight: '700', color: Colors.accent, width: 40, textAlign: 'right', flexShrink: 0 },

  // ── Private notes label ───────────────────────────────────────────────────
  privateNotesHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: -6,
  },

  // ── Review / Notes ────────────────────────────────────────────────────────
  reviewInputWrap: {
    borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  reviewInput: {
    fontSize: 14, color: Colors.lit, lineHeight: 20,
    minHeight: 72,
  },

  // ── Save ──────────────────────────────────────────────────────────────────
  saveBtn: {
    height: 52, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: Colors.accentOn },

  // ── Remove ────────────────────────────────────────────────────────────────
  removeBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, marginTop: -4,
  },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.error },
})
