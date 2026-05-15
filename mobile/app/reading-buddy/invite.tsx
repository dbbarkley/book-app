/**
 * Invite a Reading Buddy
 * Two-step flow:
 *   Step 1 — pick a friend
 *   Step 2 — pick a book from your library
 * On confirm → createSession(bookId, friendId) → navigate to the new session
 */
import { useState, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth, useFriends, useReadingBuddy } from '@book-app/shared'
import { apiClient } from '@book-app/shared/api/client'
import type { User, UserBook } from '@book-app/shared'
import { ArrowLeft, Search, Check, Users, BookOpen, ChevronRight, Send } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/colors'
import BookCover from '@/components/BookCover'

// ─── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ user, size = 44 }: { user: User; size?: number }) {
  const initials = (user.display_name ?? user.username)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <LinearGradient
      colors={['rgba(201,168,76,0.25)', 'rgba(201,168,76,0.08)']}
      style={[av.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[av.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </LinearGradient>
  )
}
const av = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.accent, fontWeight: '700', letterSpacing: 0.5 },
})

// ─── Friend row ───────────────────────────────────────────────────────────────
function FriendRow({
  user,
  selected,
  onPress,
}: {
  user: User
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[fr.wrap, selected && fr.wrapSelected]}
    >
      <Avatar user={user} size={44} />
      <View style={fr.text}>
        <Text style={fr.name} numberOfLines={1}>
          {user.display_name ?? user.username}
        </Text>
        <Text style={fr.handle} numberOfLines={1}>@{user.username}</Text>
      </View>
      <View style={[fr.check, selected && fr.checkSelected]}>
        {selected && <Check size={12} color={Colors.accentOn} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  )
}
const fr = StyleSheet.create({
  wrap:         {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14, marginBottom: 4,
    backgroundColor: 'transparent',
  },
  wrapSelected: { backgroundColor: 'rgba(201,168,76,0.08)' },
  text:         { flex: 1 },
  name:         { fontSize: 15, fontWeight: '600', color: Colors.lit, marginBottom: 1 },
  handle:       { fontSize: 12, color: Colors.lit2 },
  check:        {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
})

// ─── Book row ─────────────────────────────────────────────────────────────────
function BookRow({
  userBook,
  selected,
  onPress,
}: {
  userBook: UserBook
  selected: boolean
  onPress: () => void
}) {
  const book = userBook.book
  if (!book) return null

  const statusLabel: Record<string, string> = {
    reading:     'Currently reading',
    want_to_read: 'Want to read',
    read:        'Read',
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[bk.wrap, selected && bk.wrapSelected]}
    >
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author?.name ?? book.author_name}
        width={52}
      />
      <View style={bk.text}>
        <Text style={bk.title} numberOfLines={2}>{book.title}</Text>
        <Text style={bk.author} numberOfLines={1}>
          {book.author?.name ?? book.author_name ?? ''}
        </Text>
        <View style={bk.statusPill}>
          <Text style={bk.statusText}>
            {statusLabel[userBook.status] ?? userBook.status}
          </Text>
        </View>
      </View>
      <View style={[bk.check, selected && bk.checkSelected]}>
        {selected && <Check size={12} color={Colors.accentOn} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  )
}
const bk = StyleSheet.create({
  wrap:         {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14, marginBottom: 4,
    backgroundColor: 'transparent',
  },
  wrapSelected: { backgroundColor: 'rgba(201,168,76,0.08)' },
  text:         { flex: 1 },
  title:        { fontSize: 14, fontWeight: '600', color: Colors.lit, marginBottom: 2, lineHeight: 19 },
  author:       { fontSize: 12, color: Colors.lit2, marginBottom: 4 },
  statusPill:   {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(237,228,220,0.06)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  statusText:   { fontSize: 10, color: Colors.lit3, letterSpacing: 0.3 },
  check:        {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
})

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <View style={sd.row}>
      <View style={[sd.dot, step >= 1 && sd.dotActive]} />
      <View style={sd.line} />
      <View style={[sd.dot, step >= 2 && sd.dotActive]} />
    </View>
  )
}
const sd = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rim },
  dotActive: { backgroundColor: Colors.accent },
  line:      { width: 20, height: 1.5, backgroundColor: Colors.rim },
})

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InviteBuddyScreen() {
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const { user } = useAuth()
  const { friends, loading: friendsLoading } = useFriends()
  const { createSession } = useReadingBuddy()

  const [step, setStep]               = useState<1 | 2>(1)
  const [query, setQuery]             = useState('')
  const [selectedFriend, setFriend]   = useState<User | null>(null)
  const [selectedBook, setBook]       = useState<UserBook | null>(null)
  const [library, setLibrary]         = useState<UserBook[]>([])
  const [libraryLoading, setLibLoading] = useState(false)
  const [sending, setSending]         = useState(false)

  // Fetch library on mount so step-2 is instant
  useEffect(() => {
    setLibLoading(true)
    apiClient.getUserBooks({ per_page: 200 })
      .then(({ user_books }) => {
        // Only books that actually exist in our DB (id != null)
        setLibrary(user_books.filter((ub) => ub.book && ub.book.id != null))
      })
      .catch(() => {}) // non-fatal
      .finally(() => setLibLoading(false))
  }, [])

  const filteredFriends = friends.filter((f) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      f.username.toLowerCase().includes(q) ||
      (f.display_name?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredLibrary = library.filter((ub) => {
    if (!query) return true
    const q = query.toLowerCase()
    const b = ub.book!
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author?.name?.toLowerCase().includes(q) ?? false) ||
      (b.author_name?.toLowerCase().includes(q) ?? false)
    )
  })

  const goToStep2 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setQuery('')
    setStep(2)
  }

  const goBack = () => {
    if (step === 2) {
      setQuery('')
      setStep(1)
    } else {
      router.back()
    }
  }

  const handleSend = useCallback(async () => {
    if (!selectedFriend || !selectedBook || !selectedBook.book?.id) return
    setSending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const session = await createSession(selectedBook.book.id as number, selectedFriend.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Replace so the back stack lands on buddies list, not the invite screen
      router.replace(`/reading-buddy/${session.id}` as any)
    } catch (err) {
      setSending(false)
      Alert.alert("Couldn't send invite", 'Something went wrong. Please try again.')
    }
  }, [selectedFriend, selectedBook, createSession, router])

  const canAdvance = step === 1 ? !!selectedFriend : !!selectedBook

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.lit} strokeWidth={1.8} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <StepDots step={step} />
          <Text style={s.headerTitle}>
            {step === 1 ? 'Choose a Friend' : 'Choose a Book'}
          </Text>
          {step === 1 && selectedFriend && (
            <Text style={s.headerSub} numberOfLines={1}>
              {selectedFriend.display_name ?? selectedFriend.username}
            </Text>
          )}
          {step === 2 && selectedBook?.book && (
            <Text style={s.headerSub} numberOfLines={1}>
              {selectedBook.book.title}
            </Text>
          )}
        </View>

        {/* Right — either a spacer or the Send button */}
        {step === 2 && selectedBook ? (
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            style={s.sendBtn}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.accentOn} />
              : <Send size={16} color={Colors.accentOn} strokeWidth={2} />
            }
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={s.searchWrap}>
          <Search size={15} color={Colors.lit3} strokeWidth={1.8} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder={step === 1 ? 'Search friends…' : 'Search your library…'}
            placeholderTextColor={Colors.lit3}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Step 1 — friends */}
      {step === 1 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {friendsLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} />
          ) : filteredFriends.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Users size={28} color={Colors.accent} strokeWidth={1.5} />
              </View>
              <Text style={s.emptyTitle}>No friends found</Text>
              <Text style={s.emptySub}>
                {query ? 'Try a different search.' : 'Add friends to invite them to read with you.'}
              </Text>
            </View>
          ) : (
            filteredFriends.map((f) => (
              <FriendRow
                key={f.id}
                user={f}
                selected={selectedFriend?.id === f.id}
                onPress={() => {
                  Haptics.selectionAsync()
                  setFriend(selectedFriend?.id === f.id ? null : f)
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Step 2 — selected friend reminder */}
      {step === 2 && selectedFriend && (
        <View style={s.withChip}>
          <Avatar user={selectedFriend} size={26} />
          <Text style={s.withChipText}>
            Reading with{' '}
            <Text style={s.withChipName}>
              {selectedFriend.display_name ?? selectedFriend.username}
            </Text>
          </Text>
        </View>
      )}

      {/* Step 2 — library */}
      {step === 2 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {libraryLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} />
          ) : filteredLibrary.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <BookOpen size={28} color={Colors.accent} strokeWidth={1.5} />
              </View>
              <Text style={s.emptyTitle}>No books found</Text>
              <Text style={s.emptySub}>
                {query ? 'Try a different search.' : 'Add books to your library to get started.'}
              </Text>
            </View>
          ) : (
            filteredLibrary.map((ub) => (
              <BookRow
                key={ub.id}
                userBook={ub}
                selected={selectedBook?.id === ub.id}
                onPress={() => {
                  Haptics.selectionAsync()
                  setBook(selectedBook?.id === ub.id ? null : ub)
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Bottom CTA bar */}
      <View style={[s.cta, { paddingBottom: insets.bottom + 12 }]}>
        {step === 1 ? (
          <TouchableOpacity
            onPress={goToStep2}
            disabled={!canAdvance}
            style={[s.ctaBtn, !canAdvance && s.ctaBtnDisabled]}
            activeOpacity={0.85}
          >
            <Text style={s.ctaBtnText}>
              {selectedFriend
                ? `Continue with ${selectedFriend.display_name ?? selectedFriend.username}`
                : 'Select a friend to continue'}
            </Text>
            {canAdvance && <ChevronRight size={16} color={Colors.accentOn} strokeWidth={2.5} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canAdvance || sending}
            style={[s.ctaBtn, (!canAdvance || sending) && s.ctaBtnDisabled]}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.accentOn} />
            ) : (
              <>
                <Text style={s.ctaBtnText}>
                  {selectedBook?.book
                    ? `Invite to read "${selectedBook.book.title}"`
                    : 'Select a book to send invite'}
                </Text>
                {canAdvance && <Send size={15} color={Colors.accentOn} strokeWidth={2} />}
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rim,
  },
  backBtn:      {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: Colors.lit, letterSpacing: 0.1 },
  headerSub:    { fontSize: 11, color: Colors.lit2, letterSpacing: 0.2 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  searchRow:  { paddingHorizontal: 16, paddingVertical: 10 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.grove,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, color: Colors.lit, fontSize: 14 },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:  {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.lit },
  emptySub:   { fontSize: 13, color: Colors.lit2, textAlign: 'center', paddingHorizontal: 32, lineHeight: 19 },

  withChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)',
  },
  withChipText: { fontSize: 13, color: Colors.lit2 },
  withChipName: { fontWeight: '700', color: Colors.lit },

  cta:    { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.rim },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15,
  },
  ctaBtnDisabled: { backgroundColor: Colors.grove, opacity: 0.6 },
  ctaBtnText:     { fontSize: 14, fontWeight: '700', color: Colors.accentOn, letterSpacing: 0.2 },
})
