import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TouchableWithoutFeedback,
  TextInput, StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, FlatList, Keyboard, Alert, ActionSheetIOS,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useReadingBuddy, useAuth, useBooksStore, apiClient } from '@book-app/shared'
import type { ReadingBuddyCableEvent } from '@book-app/shared'
import {
  ChevronLeft, BookOpen, MessageCircle, Highlighter,
  Send, Check, X, MoreHorizontal, Plus, Pencil,
} from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import { ActionCableSubscription, buildMobileCableUrl } from '@/lib/actioncable'

type ViewMode = 'chat' | 'highlights'

// ─── BuddyProgressSheet ───────────────────────────────────────────────────────
function BuddyProgressSheet({
  visible, bookId, bookTitle, pageCount, currentPages, onClose,
}: {
  visible: boolean; bookId: number; bookTitle: string
  pageCount?: number; currentPages: number | null; onClose: () => void
}) {
  const { getUserBookByBookId, fetchUserBook, updateProgress } = useBooksStore()
  const [pagesStr,   setPagesStr]   = useState('')
  const [totalStr,   setTotalStr]   = useState('')
  const [saving,     setSaving]     = useState(false)
  const [fetchingUB, setFetchingUB] = useState(false)
  const [error,      setError]      = useState('')
  const [userBookId, setUserBookId] = useState<number | null>(null)
  const [notOnShelf, setNotOnShelf] = useState(false)

  useEffect(() => {
    if (!visible) return
    setPagesStr(currentPages != null && currentPages > 0 ? String(currentPages) : '')
    setTotalStr(pageCount != null ? String(pageCount) : '')
    setError(''); setNotOnShelf(false); setUserBookId(null)
    const cached = getUserBookByBookId(bookId)
    if (cached) {
      setUserBookId(cached.id)
      if (cached.total_pages != null) setTotalStr(String(cached.total_pages))
      return
    }
    setFetchingUB(true)
    fetchUserBook(bookId)
      .then(ub => {
        if (ub) { setUserBookId(ub.id); if (ub.total_pages != null) setTotalStr(String(ub.total_pages)) }
        else setNotOnShelf(true)
      })
      .catch(() => setNotOnShelf(true))
      .finally(() => setFetchingUB(false))
  }, [visible, bookId, currentPages, pageCount])

  const pRead  = parseInt(pagesStr, 10) || 0
  const tPages = parseInt(totalStr,  10) || 0
  const pct    = tPages > 0 ? Math.min(100, Math.round((pRead / tPages) * 100)) : 0

  const handleSave = async () => {
    if (!userBookId) return
    const n = parseInt(pagesStr, 10)
    if (!pagesStr || isNaN(n) || n < 0) { setError('Please enter a valid page number.'); return }
    setSaving(true); setError('')
    try {
      await updateProgress(userBookId, {
        pages_read: pRead, total_pages: tPages > 0 ? tPages : undefined,
        completion_percentage: tPages > 0 ? pct : undefined,
        status: tPages > 0 && pRead >= tPages ? 'read' : 'reading',
      })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setError(e?.message || 'Failed to save — please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={bps.backdrop} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bps.sheetWrap}>
        <View style={bps.sheet}>
          <View style={bps.handleRow}><View style={bps.handle} /></View>
          <Text style={bps.title} numberOfLines={1}>{bookTitle}</Text>
          <Text style={bps.subtitle}>Update your reading progress</Text>
          {fetchingUB ? (
            <View style={bps.centered}><ActivityIndicator color={Colors.accent} /></View>
          ) : notOnShelf ? (
            <View style={bps.notOnShelf}>
              <BookOpen size={18} color={Colors.lit2} />
              <Text style={bps.notOnShelfText}>Add this book to your library first to track your progress.</Text>
            </View>
          ) : (
            <>
              <View style={bps.inputRow}>
                <View style={bps.inputWrap}>
                  <Text style={bps.inputLabel}>Page I'm on</Text>
                  <TextInput
                    style={bps.input}
                    value={pagesStr}
                    onChangeText={v => { setPagesStr(v); setError('') }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.lit3}
                    autoFocus
                    returnKeyType="done"
                  />
                </View>
                <Text style={bps.divider}>/</Text>
                <View style={bps.inputWrap}>
                  <Text style={bps.inputLabel}>Total pages</Text>
                  <TextInput
                    style={bps.input}
                    value={totalStr}
                    onChangeText={setTotalStr}
                    keyboardType="number-pad"
                    placeholder={pageCount ? String(pageCount) : '—'}
                    placeholderTextColor={Colors.lit3}
                    returnKeyType="done"
                  />
                </View>
              </View>
              {tPages > 0 && (
                <View style={bps.progressRow}>
                  <View style={{ flex: 1 }}><ProgressBar percent={pct} height={4} /></View>
                  <Text style={bps.progressPct}>{pct}%</Text>
                </View>
              )}
              {!!error && <Text style={bps.err}>{error}</Text>}
              <TouchableOpacity
                style={[bps.saveBtn, (saving || !userBookId) && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving || !userBookId}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator size="small" color={Colors.accentOn} />
                  : <Text style={bps.saveBtnText}>Save Progress</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
const bps = StyleSheet.create({
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrap:  { flex: 1, justifyContent: 'flex-end' },
  sheet:      { backgroundColor: Colors.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 36, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  handleRow:  { alignItems: 'center', paddingTop: 10, marginBottom: -4 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.rim },
  title:      { fontSize: 16, fontWeight: '700', color: Colors.lit },
  subtitle:   { fontSize: 13, color: Colors.lit2, marginTop: -8 },
  centered:   { paddingVertical: 24, alignItems: 'center' },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  inputWrap:  { flex: 1, gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  input:      { height: 52, borderRadius: 12, paddingHorizontal: 14, fontSize: 20, fontWeight: '700', color: Colors.lit, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim, textAlign: 'center' },
  divider:    { fontSize: 22, color: Colors.lit3, paddingBottom: 14 },
  progressRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressPct:{ fontSize: 13, fontWeight: '700', color: Colors.accent, width: 40, textAlign: 'right' },
  err:        { fontSize: 13, color: Colors.error, textAlign: 'center' },
  saveBtn:    { height: 52, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText:{ fontSize: 15, fontWeight: '700', color: Colors.accentOn },
  notOnShelf: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.grove, borderRadius: 12, borderWidth: 1, borderColor: Colors.rim, padding: 14 },
  notOnShelfText: { flex: 1, fontSize: 13, color: Colors.lit2, lineHeight: 18 },
})

// ─── Highlight card ───────────────────────────────────────────────────────────
function HighlightCard({
  text, pageNumber, authorName, isMe, dateStr, onLongPress,
}: {
  text: string; pageNumber: number; authorName: string
  isMe: boolean; dateStr: string; onLongPress?: () => void
}) {
  const color = isMe ? Colors.accent : Colors.partner
  return (
    <TouchableOpacity
      style={[hlc.card, { borderLeftColor: color }]}
      activeOpacity={isMe ? 0.75 : 1}
      onLongPress={onLongPress}
      accessibilityLabel={`Highlight by ${isMe ? 'you' : authorName} on page ${pageNumber}${isMe ? ', long press to delete' : ''}`}
    >
      <LinearGradient
        colors={isMe ? ['rgba(201,168,76,0.04)', 'transparent'] : ['rgba(76,175,80,0.04)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={hlc.metaRow}>
        <Text style={[hlc.who, { color }]}>{isMe ? 'You' : authorName}</Text>
        <Text style={hlc.page}>· p. {pageNumber}</Text>
        <Text style={hlc.date}>{dateStr}</Text>
      </View>
      <Text style={hlc.quote}>{'"'}{text}{'"'}</Text>
    </TouchableOpacity>
  )
}
const hlc = StyleSheet.create({
  card:    { borderRadius: 12, borderWidth: 1, borderColor: Colors.rim, borderLeftWidth: 3, backgroundColor: Colors.grove, padding: 12, gap: 6, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  who:     { fontSize: 11, fontWeight: '700' },
  page:    { fontSize: 11, color: Colors.lit3 },
  date:    { fontSize: 11, color: Colors.lit3, marginLeft: 'auto' },
  quote:   { fontSize: 14, fontStyle: 'italic', color: Colors.lit, lineHeight: 21 },
})

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function ChatBubble({
  content, isMe, senderName, initial, timeStr, showName, showTime,
}: {
  content: string; isMe: boolean; senderName: string; initial: string
  timeStr: string; showName: boolean; showTime: boolean
}) {
  return (
    <View style={[chat.row, isMe && chat.rowMe]}>
      {!isMe && (
        showName
          ? <View style={chat.avatar}><Text style={chat.avatarText}>{initial}</Text></View>
          : <View style={{ width: 30 }} />
      )}
      <View style={[chat.msgWrap, isMe && chat.msgWrapMe]}>
        {!isMe && showName && <Text style={chat.sender}>{senderName}</Text>}
        <View style={[chat.bubble, isMe ? chat.bubbleMe : chat.bubbleThem]}>
          <Text style={[chat.text, isMe && chat.textMe]}>{content}</Text>
        </View>
        {showTime && <Text style={[chat.time, isMe && chat.timeRight]}>{timeStr}</Text>}
      </View>
    </View>
  )
}
const chat = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowMe:      { flexDirection: 'row-reverse' },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.partner, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#1a1a1a' },
  msgWrap:    { maxWidth: '75%', gap: 3 },
  msgWrapMe:  { alignItems: 'flex-end' },
  sender:     { fontSize: 11, fontWeight: '600', color: Colors.lit3, marginLeft: 14 },
  bubble:     { paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe:   { backgroundColor: Colors.accent, borderRadius: 999 },
  bubbleThem: { backgroundColor: Colors.surface, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(237,228,220,0.1)' },
  text:       { fontSize: 14, color: Colors.lit, lineHeight: 20 },
  textMe:     { color: Colors.accentOn },
  time:       { fontSize: 10, color: Colors.lit3, marginLeft: 14 },
  timeRight:  { marginLeft: 0, marginRight: 2, textAlign: 'right' },
})

// ─── Highlight modal (add new) ────────────────────────────────────────────────
function HighlightModal({
  visible, bookTitle, pageCount, onClose, onSave,
}: {
  visible: boolean; bookTitle: string; pageCount?: number
  onClose: () => void
  onSave: (payload: { page_number: number; highlighted_text: string; extracted_text: string; char_start: number; char_end: number }) => Promise<void>
}) {
  const [pageNum, setPageNum] = useState('')
  const [pageErr, setPageErr] = useState('')
  const [text,    setText]    = useState('')
  const [textErr, setTextErr] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    if (visible) { setPageNum(''); setPageErr(''); setText(''); setTextErr(''); setSaveErr('') }
  }, [visible])

  const handleSave = async () => {
    let valid = true
    const n = parseInt(pageNum, 10)
    if (!pageNum || isNaN(n) || n < 1) { setPageErr('Enter a valid page number.'); valid = false }
    else if (pageCount && n > pageCount) { setPageErr(`This book only has ${pageCount} pages.`); valid = false }
    else setPageErr('')
    const trimmed = text.trim()
    if (!trimmed) { setTextErr('Enter the passage you want to save.'); valid = false }
    else setTextErr('')
    if (!valid) return
    setSaving(true); setSaveErr('')
    try {
      await onSave({ page_number: n, highlighted_text: trimmed, extracted_text: trimmed, char_start: 0, char_end: trimmed.length })
      onClose()
    } catch (e: any) {
      setSaveErr(e?.message || 'Failed to save — please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Colors.canvas }}>
        <View style={hm.container}>
          <View style={hm.header}>
            <View style={{ flex: 1 }}>
              <Text style={hm.title}>Add Highlight</Text>
              <Text style={hm.subtitle} numberOfLines={1}>{bookTitle}</Text>
            </View>
            <TouchableOpacity style={hm.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={16} color={Colors.lit3} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={hm.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={hm.fieldLabel}>Page number</Text>
            <TextInput
              style={[hm.pageInput, { borderColor: pageErr ? Colors.error : Colors.rim }]}
              value={pageNum}
              onChangeText={t => { setPageNum(t); setPageErr('') }}
              placeholder={pageCount ? `1–${pageCount}` : 'e.g. 47'}
              placeholderTextColor={Colors.lit3}
              keyboardType="number-pad"
              returnKeyType="next"
              autoFocus
            />
            {!!pageErr && <Text style={hm.err}>{pageErr}</Text>}
            <Text style={[hm.fieldLabel, { marginTop: 16 }]}>Passage</Text>
            <TextInput
              style={[hm.textArea, { borderColor: textErr ? Colors.error : Colors.rim }]}
              value={text}
              onChangeText={t => { setText(t); setTextErr('') }}
              placeholder="Type or paste the text you want to save…"
              placeholderTextColor={Colors.lit3}
              multiline
              textAlignVertical="top"
            />
            {!!textErr  && <Text style={hm.err}>{textErr}</Text>}
            {!!saveErr  && <Text style={hm.err}>{saveErr}</Text>}
            <TouchableOpacity
              style={[hm.saveBtn, (!text.trim() || saving) && { opacity: 0.45 }]}
              onPress={handleSave}
              disabled={!text.trim() || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.accentOn} />
                : <><Check size={16} color={Colors.accentOn} /><Text style={hm.saveBtnText}> Save Highlight</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
const hm = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.canvas },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.rim },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.lit },
  subtitle:   { fontSize: 12, color: Colors.lit2, marginTop: 2 },
  closeBtn:   { padding: 6, backgroundColor: Colors.grove, borderRadius: 20, marginTop: 2 },
  content:    { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.lit2, letterSpacing: 0.5 },
  pageInput:  { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontWeight: '700', color: Colors.lit, backgroundColor: Colors.surface, borderWidth: 1 },
  textArea:   { minHeight: 140, fontSize: 14, color: Colors.lit, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim, borderRadius: 14, padding: 14, lineHeight: 22 },
  err:        { fontSize: 13, color: Colors.error },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', paddingVertical: 14, marginTop: 8, backgroundColor: Colors.accent, borderRadius: 14 },
  saveBtnText:{ fontSize: 15, fontWeight: '700', color: Colors.accentOn },
})

// ─── DNF modal ────────────────────────────────────────────────────────────────
function DnfModal({ visible, loading, onKeep, onConfirm }: {
  visible: boolean; loading: boolean; onKeep: () => void; onConfirm: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeep}>
      <View style={dnf.backdrop}>
        <View style={dnf.sheet}>
          <Text style={dnf.title}>Mark as Did Not Finish?</Text>
          <Text style={dnf.body}>This closes the session. Your chat history and highlights stay intact.</Text>
          <View style={dnf.btnRow}>
            <TouchableOpacity style={dnf.keepBtn} onPress={onKeep} activeOpacity={0.8}>
              <Text style={dnf.keepText}>Keep reading</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dnf.dnfBtn, loading && { opacity: 0.5 }]} onPress={onConfirm} disabled={loading} activeOpacity={0.8}>
              {loading
                ? <ActivityIndicator size="small" color={Colors.lit2} />
                : <Text style={dnf.dnfText}>Mark as DNF</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
const dnf = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end', padding: 16 },
  sheet:    { backgroundColor: Colors.canvas, borderRadius: 24, borderWidth: 1, borderColor: Colors.rim, padding: 24, gap: 12, marginBottom: 16 },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.lit },
  body:     { fontSize: 14, color: Colors.lit2, lineHeight: 20 },
  btnRow:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  keepBtn:  { flex: 1, paddingVertical: 14, backgroundColor: Colors.accent, borderRadius: 14, alignItems: 'center' },
  keepText: { fontSize: 14, fontWeight: '700', color: Colors.accentOn },
  dnfBtn:   { flex: 1, paddingVertical: 14, backgroundColor: Colors.grove, borderRadius: 14, borderWidth: 1, borderColor: Colors.rim, alignItems: 'center' },
  dnfText:  { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
})

// ─── Session header strip ─────────────────────────────────────────────────────
// Two-column progress layout: name + % on top, bar below, each reader in their own column
function SessionHeaderStrip({
  session, myPct, myPages, partnerPct, partnerName, isActive, onUpdatePress,
}: {
  session: any; myPct: number; myPages: number
  partnerPct: number; partnerName: string
  isActive: boolean; onUpdatePress: () => void
}) {
  const ptnFirst = partnerName.split(' ')[0]

  return (
    <TouchableOpacity
      style={shs.wrap}
      onPress={isActive ? onUpdatePress : undefined}
      activeOpacity={isActive ? 0.75 : 1}
      accessibilityLabel={isActive ? 'Update your reading progress' : undefined}
    >
      <View style={shs.coverWrap}>
        <BookCover
          uri={session.book.cover_image_url}
          title={session.book.title}
          author={session.book.author_name ?? undefined}
          width={44}
          borderRadius={6}
        />
      </View>

      <View style={shs.right}>
        <View style={shs.titleRow}>
          <Text style={shs.bookTitle} numberOfLines={1}>{session.book.title}</Text>
          {isActive && (
            <View style={shs.editBtn}>
              <Pencil size={12} color={Colors.accent} />
            </View>
          )}
        </View>
        <Text style={shs.partnerLine}>with {partnerName}</Text>

        {/* Two-column progress */}
        <View style={shs.barsRow}>
          {/* You */}
          <View style={shs.barCol}>
            <View style={shs.barColHeader}>
              <Text style={[shs.barName, { color: Colors.accent }]}>You</Text>
              <Text style={[shs.barPct, { color: Colors.accent }]}>{myPct}%</Text>
            </View>
            <View style={shs.barTrack}>
              <View style={[shs.barFill, { width: `${Math.max(myPct, 2)}%`, backgroundColor: Colors.accent }]} />
            </View>
          </View>

          <View style={shs.barSep} />

          {/* Partner */}
          <View style={shs.barCol}>
            <View style={shs.barColHeader}>
              <Text style={[shs.barName, { color: Colors.partner }]} numberOfLines={1}>{ptnFirst}</Text>
              <Text style={[shs.barPct, { color: Colors.partner }]}>{partnerPct}%</Text>
            </View>
            <View style={shs.barTrack}>
              <View style={[shs.barFill, { width: `${Math.max(partnerPct, 2)}%`, backgroundColor: Colors.partner }]} />
            </View>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  )
}
const shs = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  coverWrap: {
    flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  right:       { flex: 1, gap: 2 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookTitle:   { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.lit, letterSpacing: -0.3 },
  partnerLine: { fontSize: 12, color: Colors.lit3, marginBottom: 6 },
  editBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  barsRow:     { flexDirection: 'row', gap: 10 },
  barSep:      { width: 1, backgroundColor: Colors.rim, marginVertical: 2 },
  barCol:      { flex: 1, gap: 4 },
  barColHeader:{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  barName:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  barPct:      { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  barTrack:    { height: 4, borderRadius: 2, backgroundColor: 'rgba(237,228,220,0.1)', overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 2 },
})

// ─── Chat / Highlights view toggle ───────────────────────────────────────────
function ViewToggle({
  active, highlightCount, onChange,
}: {
  active: ViewMode; highlightCount: number; onChange: (v: ViewMode) => void
}) {
  return (
    <View style={vt.wrap}>
      <TouchableOpacity
        style={[vt.btn, active === 'chat' && vt.btnActive]}
        onPress={() => { Haptics.selectionAsync(); onChange('chat') }}
        activeOpacity={0.7}
      >
        <MessageCircle size={13} color={active === 'chat' ? Colors.accent : Colors.lit3} />
        <Text style={[vt.label, active === 'chat' && vt.labelActive]}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[vt.btn, active === 'highlights' && vt.btnActive]}
        onPress={() => { Haptics.selectionAsync(); onChange('highlights') }}
        activeOpacity={0.7}
      >
        <Highlighter size={13} color={active === 'highlights' ? Colors.accent : Colors.lit3} />
        <Text style={[vt.label, active === 'highlights' && vt.labelActive]}>
          Highlights{highlightCount > 0 ? ` · ${highlightCount}` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
const vt = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
    backgroundColor: Colors.canvas,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: 'transparent',
  },
  btnActive:    { backgroundColor: 'rgba(201,168,76,0.09)', borderColor: 'rgba(201,168,76,0.16)' },
  label:        { fontSize: 12, fontWeight: '600', color: Colors.lit3 },
  labelActive:  { color: Colors.accent },
})

// ─── Pending invite — fullscreen ──────────────────────────────────────────────
function PendingInviteScreen({
  session, actionLoading, onAccept, onDecline,
}: {
  session: any; actionLoading: string | null
  onAccept: () => void; onDecline: () => void
}) {
  const initiatorName = session.initiator.display_name || session.initiator.username
  const isLoading = actionLoading !== null

  return (
    <View style={pi.container}>
      <View style={pi.coverWrap}>
        <BookCover
          uri={session.book.cover_image_url}
          title={session.book.title}
          author={session.book.author_name ?? undefined}
          width={120}
          borderRadius={14}
        />
      </View>
      <Text style={pi.bookTitle} numberOfLines={2}>{session.book.title}</Text>
      {session.book.author_name && (
        <Text style={pi.author} numberOfLines={1}>{session.book.author_name}</Text>
      )}
      <View style={pi.card}>
        <Text style={pi.inviteText}>
          <Text style={pi.inviterName}>{initiatorName}</Text>
          {' '}wants to read this with you
        </Text>
        <Text style={pi.inviteSub}>Track your progress and chat as you read together.</Text>
      </View>
      <View style={pi.btnGroup}>
        <TouchableOpacity
          style={[pi.acceptBtn, isLoading && { opacity: 0.6 }]}
          onPress={onAccept}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {actionLoading === 'accept'
            ? <ActivityIndicator color={Colors.accentOn} />
            : <><Check size={18} color={Colors.accentOn} strokeWidth={2.5} /><Text style={pi.acceptText}>Accept Invite</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[pi.declineBtn, isLoading && { opacity: 0.6 }]}
          onPress={onDecline}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {actionLoading === 'decline'
            ? <ActivityIndicator color={Colors.lit2} />
            : <Text style={pi.declineText}>Decline</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}
const pi = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  coverWrap:   { shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 14, marginBottom: 8 },
  bookTitle:   { fontSize: 22, fontWeight: '700', color: Colors.lit, textAlign: 'center', lineHeight: 28, marginTop: 4 },
  author:      { fontSize: 14, color: Colors.lit2, textAlign: 'center' },
  card:        { width: '100%', backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.rim, padding: 16, gap: 6, marginTop: 8 },
  inviteText:  { fontSize: 15, color: Colors.lit, textAlign: 'center', lineHeight: 22 },
  inviterName: { fontWeight: '700', color: Colors.accent },
  inviteSub:   { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },
  btnGroup:    { width: '100%', gap: 10, marginTop: 8 },
  acceptBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 16 },
  acceptText:  { fontSize: 16, fontWeight: '700', color: Colors.accentOn },
  declineBtn:  { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.grove, borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.rim },
  declineText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReadingBuddySessionScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>()
  const router    = useRouter()
  const insets    = useSafeAreaInsets()
  const sessionId = parseInt(id, 10)

  const { user } = useAuth()
  const {
    activeSession, messages, highlights,
    sessionLoading, sessionError,
    fetchSession, clearActiveSession,
    acceptSession, declineSession, dnfSession,
    sendMessage, createHighlight, deleteHighlight, handleCableEvent,
  } = useReadingBuddy()

  const [viewMode,       setViewMode]       = useState<ViewMode>('chat')
  const [msgText,        setMsgText]        = useState('')
  const [sending,        setSending]        = useState(false)
  const [actionLoading,  setActionLoading]  = useState<string | null>(null)
  const [showHighlight,  setShowHighlight]  = useState(false)
  const [showDnf,        setShowDnf]        = useState(false)
  const [showProgress,   setShowProgress]   = useState(false)
  const cableRef = useRef<ActionCableSubscription | null>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!isNaN(sessionId)) fetchSession(sessionId)
    return () => { clearActiveSession() }
  }, [sessionId])

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages.length])

  useEffect(() => {
    if (activeSession?.status !== 'active') return
    const token = apiClient.getToken()
    if (!token) return
    cableRef.current?.unsubscribe()
    cableRef.current = new ActionCableSubscription(buildMobileCableUrl(token), {
      channelName:    'ReadingBuddyChannel',
      params:         { session_id: sessionId },
      onConnected:    () => {},
      onDisconnected: () => {},
      onMessage:      (data) => handleCableEvent(data as ReadingBuddyCableEvent),
    })
    return () => { cableRef.current?.unsubscribe(); cableRef.current = null }
  }, [activeSession?.status, sessionId])

  const handleSend = useCallback(async () => {
    const content = msgText.trim()
    if (!content || sending) return
    setSending(true); setMsgText(''); Keyboard.dismiss()
    try { await sendMessage(sessionId, content) }
    catch { setMsgText(content) }
    finally { setSending(false) }
  }, [msgText, sending, sessionId, sendMessage])

  const handleAccept  = async () => { setActionLoading('accept');  try { await acceptSession(sessionId) }  finally { setActionLoading(null) } }
  const handleDecline = async () => { setActionLoading('decline'); try { await declineSession(sessionId); router.back() } finally { setActionLoading(null) } }
  const handleDnf     = async () => { setActionLoading('dnf');    try { await dnfSession(sessionId) }     finally { setActionLoading(null); setShowDnf(false) } }

  const handleDeleteHighlight = (highlightId: number) => {
    Alert.alert('Delete Highlight', "Remove this highlight? This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteHighlight(sessionId, highlightId); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }
        catch { Alert.alert('Error', 'Could not delete. Please try again.') }
      }},
    ])
  }

  const handleMore = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Mark as Did Not Finish'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setShowDnf(true)
        }
      )
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Mark as Did Not Finish', style: 'destructive', onPress: () => setShowDnf(true) },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  // ── Loading ──
  if (sessionLoading) {
    return (
      <View style={[s.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  // ── Error ──
  if (sessionError || !activeSession) {
    return (
      <View style={[s.centered, { paddingTop: insets.top }]}>
        <BookOpen size={36} color={Colors.lit3} />
        <Text style={s.errTitle}>Session not found</Text>
        <Text style={s.errBody}>{sessionError || "This session doesn't exist or you're not a participant."}</Text>
        <TouchableOpacity style={s.errBtn} onPress={() => router.back()}>
          <Text style={s.errBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Derived state ──
  const session   = activeSession
  const partner   = session.initiator.id === user?.id ? session.invited   : session.initiator
  const me        = session.initiator.id === user?.id ? session.initiator : session.invited
  const isActive  = session.status === 'active'
  const isPending = session.status === 'pending'
  const isClosed  = session.status === 'declined' || session.status === 'dnf'
  const isInvited = session.invited.id === user?.id

  const myPct      = me.progress?.completion_percentage      ?? 0
  const myPages    = me.progress?.pages_read                 ?? 0
  const partnerPct = partner.progress?.completion_percentage ?? 0
  const partnerName = partner.display_name || partner.username
  const bookPageCount = (session.book as any).page_count as number | undefined

  // Highlights grouped by page (used in inline highlights view)
  const highlightsByPage = highlights.reduce<Record<number, typeof highlights>>((acc, h) => {
    if (!acc[h.page_number]) acc[h.page_number] = []
    acc[h.page_number].push(h)
    return acc
  }, {})
  const sortedHighlightPages = Object.keys(highlightsByPage).map(Number).sort((a, b) => a - b)

  const renderMessageItem = ({ item: msg, index }: { item: any; index: number }) => {
    const isMe    = msg.user_id === user?.id
    const prev    = messages[index - 1]
    const next    = messages[index + 1]
    const showName = !prev || prev.user_id !== msg.user_id
    const showTime = !next || next.user_id !== msg.user_id
    const name    = msg.user.display_name || msg.user.username
    const initial = name[0].toUpperCase()
    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return (
      <View style={!showName ? { marginTop: -6 } : undefined}>
        <ChatBubble
          content={msg.content} isMe={isMe} senderName={name}
          initial={initial} timeStr={timeStr}
          showName={showName} showTime={showTime}
        />
      </View>
    )
  }

  // ── Render ──
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={8} activeOpacity={0.8}>
          <ChevronLeft size={20} color={Colors.lit} />
          <Text style={s.backText}>Buddies</Text>
        </TouchableOpacity>
        {isActive && (
          <TouchableOpacity style={s.moreBtn} onPress={handleMore} hitSlop={8} activeOpacity={0.7}>
            <MoreHorizontal size={18} color={Colors.lit2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Incoming pending → fullscreen */}
      {isPending && isInvited ? (
        <PendingInviteScreen
          session={session}
          actionLoading={actionLoading}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ) : (
        <>
          {/* Compact progress header */}
          <SessionHeaderStrip
            session={session}
            myPct={myPct}
            myPages={myPages}
            partnerPct={partnerPct}
            partnerName={partnerName}
            isActive={isActive}
            onUpdatePress={() => setShowProgress(true)}
          />

          {/* Status notices */}
          {isPending && !isInvited && (
            <View style={s.noticeBanner}>
              <Text style={s.noticeText}>Waiting for {partnerName} to respond…</Text>
            </View>
          )}
          {isClosed && (
            <View style={[s.noticeBanner, s.noticeBannerClosed]}>
              <Text style={s.noticeText}>
                {session.status === 'declined'
                  ? 'This invite was declined.'
                  : `Session ended as Did Not Finish · You ${myPct}% · ${partnerName.split(' ')[0]} ${partnerPct}%`}
              </Text>
            </View>
          )}

          {/* Chat / Highlights toggle — only when session has content to switch between */}
          {(isActive || highlights.length > 0 || messages.length > 0) && (
            <ViewToggle
              active={viewMode}
              highlightCount={highlights.length}
              onChange={setViewMode}
            />
          )}

          {/* Content area */}
          {viewMode === 'highlights' ? (
            /* ── Highlights view ── */
            <View style={{ flex: 1 }}>
              {isActive && (
                <View style={s.hlActionRow}>
                  <TouchableOpacity style={s.addHlBtn} onPress={() => setShowHighlight(true)} activeOpacity={0.8}>
                    <Plus size={13} color={Colors.accentOn} />
                    <Text style={s.addHlBtnText}>Add Highlight</Text>
                  </TouchableOpacity>
                </View>
              )}
              {highlights.length === 0 ? (
                <View style={s.emptyState}>
                  <View style={s.emptyIcon}><Highlighter size={22} color={Colors.lit3} /></View>
                  <Text style={s.emptyTitle}>No highlights yet</Text>
                  <Text style={s.emptyBody}>
                    {isActive
                      ? 'Capture passages as you read — tap "Add Highlight" above.'
                      : 'No highlights were saved during this session.'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={[s.hlList, { paddingBottom: insets.bottom + 24 }]}
                  showsVerticalScrollIndicator={false}
                >
                  {sortedHighlightPages.map(pageNum => (
                    <View key={pageNum} style={{ gap: 8 }}>
                      <View style={s.pageDivider}>
                        <View style={s.pageChip}>
                          <Text style={s.pageChipText}>Page {pageNum}</Text>
                        </View>
                        <View style={s.dividerLine} />
                      </View>
                      {highlightsByPage[pageNum].map(h => (
                        <HighlightCard
                          key={h.id}
                          text={h.highlighted_text}
                          pageNumber={h.page_number}
                          authorName={h.user.display_name || h.user.username}
                          isMe={h.user.id === user?.id}
                          dateStr={new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          onLongPress={h.user.id === user?.id ? () => handleDeleteHighlight(h.id) : undefined}
                        />
                      ))}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            /* ── Chat view ── */
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={m => String(m.id)}
                contentContainerStyle={[
                  s.messagesList,
                  messages.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={s.emptyState}>
                    <View style={s.emptyIcon}>
                      <MessageCircle size={22} color={Colors.lit3} />
                    </View>
                    <Text style={s.emptyTitle}>No messages yet</Text>
                    <Text style={s.emptyBody}>
                      {isActive
                        ? 'Say something about the book.'
                        : isClosed
                        ? 'No chat history for this session.'
                        : 'Chat unlocks once both readers join.'}
                    </Text>
                  </View>
                }
                renderItem={renderMessageItem}
              />

              {isActive && (
                <View style={[s.composer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
                  <TouchableOpacity
                    style={s.hlIconBtn}
                    onPress={() => setShowHighlight(true)}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <Highlighter size={18} color={Colors.lit2} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.composerInput}
                    value={msgText}
                    onChangeText={setMsgText}
                    placeholder="Say something about the book…"
                    placeholderTextColor={Colors.lit3}
                    multiline
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={handleSend}
                  />
                  <TouchableOpacity
                    style={[s.sendBtn, (!msgText.trim() || sending) && { opacity: 0.35 }]}
                    onPress={handleSend}
                    disabled={!msgText.trim() || sending}
                    hitSlop={8}
                    activeOpacity={0.8}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color={Colors.accentOn} />
                      : <Send size={15} color={Colors.accentOn} />
                    }
                  </TouchableOpacity>
                </View>
              )}
            </KeyboardAvoidingView>
          )}
        </>
      )}

      {/* Modals */}
      <BuddyProgressSheet
        visible={showProgress}
        bookId={session.book.id}
        bookTitle={session.book.title}
        pageCount={bookPageCount}
        currentPages={myPages}
        onClose={() => setShowProgress(false)}
      />
      <HighlightModal
        visible={showHighlight}
        bookTitle={session.book.title}
        pageCount={bookPageCount}
        onClose={() => setShowHighlight(false)}
        onSave={async (payload) => { await createHighlight(sessionId, payload) }}
      />
      <DnfModal
        visible={showDnf}
        loading={actionLoading === 'dnf'}
        onKeep={() => setShowDnf(false)}
        onConfirm={handleDnf}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  errTitle:   { fontSize: 20, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  errBody:    { fontSize: 14, color: Colors.lit2, textAlign: 'center', lineHeight: 20 },
  errBtn:     { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  errBtnText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.rim },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.lit },
  moreBtn:  { padding: 4 },

  noticeBanner:       { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.grove, borderBottomWidth: 1, borderBottomColor: Colors.rim },
  noticeBannerClosed: { backgroundColor: 'rgba(237,228,220,0.03)' },
  noticeText:         { fontSize: 12, color: Colors.lit3, textAlign: 'center' },

  // Chat
  messagesList:  { paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.rim,
    backgroundColor: Colors.canvas,
  },
  hlIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 1,
  },
  composerInput: {
    flex: 1, fontSize: 14, color: Colors.lit,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 9,
    maxHeight: 120, lineHeight: 20,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 1 },

  // Highlights view
  hlActionRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.rim },
  addHlBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.accent, borderRadius: 12 },
  addHlBtnText:{ fontSize: 13, fontWeight: '700', color: Colors.accentOn },
  hlList:      { paddingHorizontal: 14, paddingTop: 14, gap: 16 },
  pageDivider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageChip:    { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.grove, borderRadius: 999, borderWidth: 1, borderColor: Colors.rim },
  pageChipText:{ fontSize: 10, fontWeight: '700', color: Colors.lit2, letterSpacing: 0.5 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.rim },

  // Shared empty state
  emptyState: { alignItems: 'center', gap: 10, padding: 32 },
  emptyIcon:  { width: 52, height: 52, borderRadius: 15, backgroundColor: Colors.grove, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  emptyBody:  { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },
})
