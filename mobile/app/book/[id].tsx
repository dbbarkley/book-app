import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Modal, TextInput,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useBookDetails, useBookShelf, useAuth, getDisplayGenre, apiClient,
  useReadingBuddy, useFriends, useBookNotes, useBookFriends,
} from '@book-app/shared'
import type { User } from '@book-app/shared'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, Plus, Check, Calendar, Star, Compass,
  Users, UserPlus, BookOpen, Clock, AlertTriangle, X, Loader2, Send, FileText,
} from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import StarRating from '@/components/StarRating'
import BookProgressSheet from '@/components/BookProgressSheet'
import SuggestToFriendModal from '@/components/SuggestToFriendModal'
import { Colors } from '@/constants/colors'
import type { ShelfStatus, Book } from '@book-app/shared'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const COVER_W = Math.round(SCREEN_W * 0.38)
const HERO_H  = Math.min(320, Math.max(220, Math.round(SCREEN_H * 0.32)))

const SHELF_LABELS: Record<ShelfStatus, string> = {
  reading: 'Currently Reading',
  to_read: 'Want to Read',
  read:    'Finished Reading',
  dnf:     'Did Not Finish',
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading Buddy section — shown on the book detail page
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending: 'Invite Pending',
  active:  'Reading Together',
  declined:'Declined',
  dnf:     'Did Not Finish',
}
const STATUS_COLOR: Record<string, string> = {
  pending: Colors.lit3,
  active:  Colors.success,
  declined:Colors.lit3,
  dnf:     Colors.lit3,
}

function ReadingBuddySection({
  bookId,
  bookTitle,
}: {
  bookId: number
  bookTitle: string
}) {
  const router = useRouter()
  const { user }  = useAuth()
  const { sessions, sessionsLoading, fetchSessions, createSession } = useReadingBuddy()
  const { friends, loading: friendsLoading } = useFriends()

  const [modalOpen, setModalOpen]       = useState(false)
  const [inviting, setInviting]         = useState<number | null>(null)
  const [inviteError, setInviteError]   = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const bookSessions  = sessions.filter(s => s.book.id === bookId)
  const openSessions  = bookSessions.filter(s => s.status === 'pending' || s.status === 'active')
  const invitableFriends = friends.filter(f =>
    !openSessions.some(s => s.initiator.id === f.id || s.invited.id === f.id)
  )

  const handleInvite = async (friend: User) => {
    setInviting(friend.id)
    setInviteError(null)
    try {
      const session = await createSession(bookId, friend.id)
      setInviteSuccess(true)
      setTimeout(() => {
        setModalOpen(false)
        setInviteSuccess(false)
        router.push(`/reading-buddy/${session.id}` as any)
      }, 800)
    } catch (e: any) {
      setInviteError(e?.response?.data?.error || e?.message || 'Failed to send invite')
    } finally {
      setInviting(null)
    }
  }

  return (
    <View style={rb.container}>
      {/* Section header */}
      <View style={rb.header}>
        <BookOpen size={18} color={Colors.accent} />
        <Text style={rb.heading}>Reading Buddy</Text>
        {openSessions.length === 0 && (
          <TouchableOpacity
            style={rb.inviteChip}
            onPress={() => setModalOpen(true)}
            activeOpacity={0.8}
          >
            <UserPlus size={13} color={Colors.lit2} />
            <Text style={rb.inviteChipText}>Invite a Friend</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessionsLoading ? (
        <View style={rb.loadingRow}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      ) : openSessions.length > 0 ? (
        <View style={{ gap: 8 }}>
          {openSessions.map(session => {
            const partner = session.initiator.id === user?.id ? session.invited : session.initiator
            const color   = STATUS_COLOR[session.status] ?? Colors.lit3
            return (
              <TouchableOpacity
                key={session.id}
                style={rb.sessionRow}
                onPress={() => router.push(`/reading-buddy/${session.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={rb.sessionAvatar}>
                  <Text style={rb.sessionAvatarText}>
                    {(partner.display_name || partner.username).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={rb.sessionName} numberOfLines={1}>
                    {partner.display_name || partner.username}
                  </Text>
                  <View style={rb.statusRow}>
                    {session.status === 'pending' && <Clock size={11} color={color} />}
                    {session.status === 'active'  && <Check size={11} color={color} />}
                    <Text style={[rb.statusText, { color }]}>
                      {STATUS_LABEL[session.status]}
                    </Text>
                  </View>
                </View>
                {partner.progress && (
                  <Text style={rb.progressPct}>
                    {partner.progress.completion_percentage ?? 0}%
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity
            style={rb.addAnotherBtn}
            onPress={() => setModalOpen(true)}
            activeOpacity={0.8}
          >
            <UserPlus size={13} color={Colors.lit3} />
            <Text style={rb.addAnotherText}>Invite another friend</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={rb.emptyBtn}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.8}
        >
          <Users size={16} color={Colors.lit3} />
          <Text style={rb.emptyBtnText}>Read this together with a friend</Text>
        </TouchableOpacity>
      )}

      {/* Invite friend picker modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalOpen(false); setInviteError(null) }}
      >
        <View style={rb.modal}>
          <View style={rb.modalHeader}>
            <View>
              <Text style={rb.modalTitle}>Invite to Read Together</Text>
              <Text style={rb.modalSub} numberOfLines={2}>
                Pick a friend to read "{bookTitle}" with
              </Text>
            </View>
            <TouchableOpacity
              style={rb.modalClose}
              onPress={() => { setModalOpen(false); setInviteError(null) }}
              hitSlop={8}
            >
              <X size={18} color={Colors.lit3} />
            </TouchableOpacity>
          </View>

          {!!inviteError && (
            <View style={rb.errorBanner}>
              <AlertTriangle size={14} color="#fca5a5" />
              <Text style={rb.errorText}>{inviteError}</Text>
            </View>
          )}

          {friendsLoading ? (
            <View style={rb.modalLoading}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          ) : invitableFriends.length === 0 ? (
            <View style={rb.modalEmpty}>
              <Text style={rb.modalEmptyText}>
                {friends.length === 0
                  ? "You haven't added any friends yet."
                  : 'All your friends already have an open session for this book.'}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={rb.friendList}>
              {invitableFriends.map(friend => (
                <TouchableOpacity
                  key={friend.id}
                  style={rb.friendRow}
                  onPress={() => handleInvite(friend)}
                  disabled={inviting !== null}
                  activeOpacity={0.8}
                >
                  <View style={rb.friendAvatar}>
                    <Text style={rb.friendAvatarText}>
                      {(friend.display_name || friend.username).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rb.friendName}>{friend.display_name || friend.username}</Text>
                    <Text style={rb.friendHandle}>@{friend.username}</Text>
                  </View>
                  {inviting === friend.id ? (
                    inviteSuccess
                      ? <Check size={18} color={Colors.success} />
                      : <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <UserPlus size={18} color={Colors.lit3} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  )
}

const rb = StyleSheet.create({
  container: { gap: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading:   { fontSize: 16, fontWeight: '700', color: Colors.lit, flex: 1 },
  inviteChip:{
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.grove,
  },
  inviteChipText: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },

  loadingRow: { alignItems: 'center', paddingVertical: 12 },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
  },
  sessionAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove, alignItems: 'center', justifyContent: 'center',
  },
  sessionAvatarText: { fontSize: 12, fontWeight: '800', color: Colors.lit3 },
  sessionName:       { fontSize: 13, fontWeight: '700', color: Colors.lit },
  statusRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusText:        { fontSize: 11, fontWeight: '600' },
  progressPct:       { fontSize: 13, fontWeight: '700', color: Colors.lit },

  addAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.rim, borderStyle: 'dashed',
  },
  addAnotherText: { fontSize: 12, fontWeight: '600', color: Colors.lit3 },

  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.grove,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: Colors.lit3 },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.canvas },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.lit },
  modalSub:   { fontSize: 13, color: Colors.lit3, marginTop: 3, maxWidth: 260 },
  modalClose: { padding: 4, backgroundColor: Colors.grove, borderRadius: 20, marginTop: 2 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, padding: 12,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: '#fca5a5', flex: 1 },

  modalLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalEmpty:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalEmptyText: { fontSize: 14, color: Colors.lit3, textAlign: 'center' },

  friendList: { padding: 16, gap: 8 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.rim,
  },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.grove, alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 14, fontWeight: '800', color: Colors.lit3 },
  friendName:       { fontSize: 14, fontWeight: '700', color: Colors.lit },
  friendHandle:     { fontSize: 12, color: Colors.lit3, marginTop: 1 },
})

// ─────────────────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.rim,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: 'center', gap: 4,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.lit3 },
  value: { fontSize: 14, fontWeight: '700', color: Colors.lit },
})

export default function BookDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { isAuthenticated } = useAuth()

  // True when the user has navigated more than one screen deep (e.g. Book A → Book B
  // via "Also By"), at which point the Discover escape-hatch button becomes useful.
  const canDismissAll = router.canDismiss()

  // id may be a Google Books ID string, an ISBN (10/13 digits), or a numeric DB ID.
  // Only treat as a numeric DB id if it's short enough that it can't be an ISBN —
  // ISBNs are always 10 or 13 digits; Postgres auto-increment will never reach 10 digits.
  const parsed = parseInt(id, 10)
  const bookIdentifier: number | string =
    !isNaN(parsed) && String(parsed) === id && id.length < 10 ? parsed : id

  const { book, userBook, loading, error, refetch } = useBookDetails(bookIdentifier)
  const { addToShelf, loading: shelfLoading } = useBookShelf()
  const { saveNotes, loading: notesSaving } = useBookNotes()

  // Only fetch once we know the DB id — hook guards against negative/null ids internally
  const dbId = book?.id != null && book.id > 0 ? book.id : undefined
  const { friends: bookFriends, loading: friendsLoading } = useBookFriends(dbId)

  const [progressOpen,  setProgressOpen]  = useState(false)
  const [suggestOpen,   setSuggestOpen]   = useState(false)
  const [suggestBookId, setSuggestBookId] = useState<number | null>(null)
  const [ensuring,      setEnsuring]      = useState(false)
  const [descExpanded,  setDescExpanded]  = useState(false)
  const [descTruncated, setDescTruncated] = useState(false)
  const [notesText,     setNotesText]     = useState('')
  const [notesDirty,    setNotesDirty]    = useState(false)
  const [notesSaved,    setNotesSaved]    = useState(false)

  // Sync notes text when userBook loads or changes
  useEffect(() => {
    setNotesText(userBook?.notes ?? '')
    setNotesDirty(false)
  }, [userBook?.id])

  // Also by author — 3-state: idle | loading | success | error
  type AlsoByState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; works: Book[] }
    | { status: 'error' }
  const [alsoBy, setAlsoBy] = useState<AlsoByState>({ status: 'idle' })

  useEffect(() => {
    if (!book?.author_name) return

    // `stale` prevents a slow/timed-out request from overwriting state
    // after the user has navigated to a different book or unmounted.
    let stale = false

    // Client-side guard: if the request hasn't resolved in 8s, show the
    // error state so the skeleton doesn't hang forever. The backend already
    // has a 5s timeout on the Google Books call, so in practice this is a
    // last-resort safety net.
    const timeoutId = setTimeout(() => {
      if (!stale) setAlsoBy({ status: 'error' })
      stale = true
    }, 8_000)

    setAlsoBy({ status: 'loading' })

    apiClient
      .getAuthorWorks(book.author_name, book.title ?? '')
      .then((works) => {
        clearTimeout(timeoutId)
        if (stale) return
        setAlsoBy({ status: 'success', works })
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        if (stale) return
        console.warn('[AlsoBy] fetch failed:', err?.message)
        setAlsoBy({ status: 'error' })
      })

    return () => {
      stale = true
      clearTimeout(timeoutId)
    }
  }, [book?.author_name, book?.title])


  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading book…</Text>
      </View>
    )
  }

  if (!book || error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorEmoji}>🔍</Text>
        <Text style={styles.errorTitle}>Book not found</Text>
        <Text style={styles.errorSub}>{error ?? 'We couldn\'t find this book.'}</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const inDB = book.id != null && book.id > 0

  const formatFinishedDate = (dateStr?: string) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Shelf action button
  const renderShelfButton = () => {
    if (!isAuthenticated) return null

    if (userBook) {
      return (
        <TouchableOpacity
          style={[styles.shelfBtn, styles.shelfBtnActive]}
          onPress={() => setProgressOpen(true)}
          activeOpacity={0.8}
          accessibilityLabel={`${SHELF_LABELS[userBook.status] ?? 'On My Shelf'} — tap to update progress`}
          accessibilityRole="button"
        >
          <Check size={16} color={Colors.accentOn} />
          <Text style={styles.shelfBtnActiveText}>
            {SHELF_LABELS[userBook.status] ?? 'On My Shelf'}
          </Text>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        style={[styles.shelfBtn, shelfLoading && styles.shelfBtnDisabled]}
        onPress={() => setProgressOpen(true)}
        disabled={shelfLoading}
        activeOpacity={0.8}
        accessibilityLabel={`Add ${book.title} to shelf`}
        accessibilityRole="button"
      >
        {shelfLoading
          ? <ActivityIndicator size="small" color={Colors.accentOn} />
          : <>
              <Plus size={16} color={Colors.accentOn} />
              <Text style={styles.shelfBtnText}>Add to Shelf</Text>
            </>
        }
      </TouchableOpacity>
    )
  }

  const genre   = getDisplayGenre(book.categories)
  const relDate = book.release_date
    ? new Date(book.release_date).getFullYear().toString()
    : null

  const DESC_LINE_LIMIT = 5
  const descLines = descExpanded ? undefined : DESC_LINE_LIMIT

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Blurred cover hero */}
        <View style={styles.heroArea}>
          {book.cover_image_url && (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.heroBg}
              contentFit="cover"
              blurRadius={30}
              cachePolicy="disk"
            />
          )}
          {/* Gradient scrim: transparent at top → canvas at bottom.
              Keeps back button legible on pale covers and blends hero into body. */}
          <LinearGradient
            colors={['transparent', 'rgba(13,26,15,0.55)', Colors.canvas]}
            locations={[0, 0.58, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Cover centered in hero */}
          <View style={[styles.coverWrap, { marginTop: insets.top + 52 }]}>
            <BookCover
              uri={book.cover_image_url}
              title={book.title}
              author={book.author_name}
              width={COVER_W}
              borderRadius={16}
              style={styles.coverShadow}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.body}>
          {/* Title + author */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author_name}</Text>
            {relDate && (
              <View style={styles.relRow}>
                <Calendar size={12} color={Colors.lit3} />
                <Text style={styles.relDate}>{relDate}</Text>
              </View>
            )}
          </View>

          {/* User's progress — if on shelf */}
          {userBook && userBook.status === 'reading' && (
            <View style={styles.progressCard}>
              <View style={styles.progressCardRow}>
                <Text style={styles.progressCardLabel}>Your Progress</Text>
                <Text style={styles.progressCardPct}>{userBook.completion_percentage ?? 0}%</Text>
              </View>
              <ProgressBar percent={userBook.completion_percentage ?? 0} height={6} />
              <Text style={styles.progressCardPages}>
                Page {userBook.pages_read ?? 0}
                {(userBook.total_pages ?? book.page_count)
                  ? ` of ${userBook.total_pages ?? book.page_count}`
                  : ''}
              </Text>
            </View>
          )}

          {/* Shelf button */}
          {renderShelfButton()}

          {/* Suggest to a Friend — shown whenever we have any identifier to resolve */}
          {isAuthenticated && (book.id || book.google_books_id || book.isbn) && (
            <TouchableOpacity
              style={[styles.suggestBtn, ensuring && { opacity: 0.6 }]}
              onPress={async () => {
                if (ensuring) return
                if (book.id && book.id > 0) {
                  setSuggestBookId(book.id)
                  setSuggestOpen(true)
                  return
                }
                setEnsuring(true)
                try {
                  const result = await apiClient.ensureBook({
                    title:           book.title,
                    author_name:     book.author_name,
                    google_books_id: book.google_books_id,
                    isbn:            book.isbn,
                    cover_image_url: book.cover_image_url,
                    description:     book.description,
                    page_count:      book.page_count,
                    release_date:    book.release_date,
                    categories:      book.categories,
                  })
                  setSuggestBookId(result.id)
                  setSuggestOpen(true)
                } catch {
                  // silent — button just does nothing on network failure
                } finally {
                  setEnsuring(false)
                }
              }}
              disabled={ensuring}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Suggest this book to a friend"
            >
              {ensuring
                ? <ActivityIndicator size="small" color={Colors.lit2} />
                : <Send size={14} color={Colors.lit2} />
              }
              <Text style={styles.suggestBtnText}>Suggest to a Friend</Text>
            </TouchableOpacity>
          )}

          {/* Finished tag — shown when book is marked as read */}
          {userBook?.status === 'read' && (() => {
            const raw = (userBook as any).finished_at ?? (userBook as any).updated_at
            const label = formatFinishedDate(raw)
            return (
              <View style={styles.finishedTag}>
                <Check size={11} color={Colors.success} />
                <Text style={styles.finishedTagText}>
                  {label ? `Finished · ${label}` : 'Finished'}
                </Text>
              </View>
            )
          })()}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill label="Pages"  value={book.page_count ? String(book.page_count) : '—'} />
            <StatPill label="Genre"  value={genre || '—'} />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text
              style={styles.description}
              numberOfLines={descLines}
              onTextLayout={(e) => {
                if (!descExpanded) {
                  setDescTruncated(e.nativeEvent.lines.length >= DESC_LINE_LIMIT)
                }
              }}
            >
              {book.description || 'No description available for this book.'}
            </Text>
            {(descTruncated || descExpanded) && (
              <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} hitSlop={8}>
                <Text style={styles.readMore}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Also by author — hidden only when idle or zero results */}
          {alsoBy.status !== 'idle' &&
            !(alsoBy.status === 'success' && alsoBy.works.length === 0) && (
            <View style={styles.alsoBySection}>
              <Text style={styles.sectionTitle}>
                Also by {book.author_name}
              </Text>

              {/* Loading skeleton */}
              {alsoBy.status === 'loading' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.alsoByList}
                  scrollEnabled={false}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[styles.alsoByItem, i > 0 && { marginLeft: 12 }]}>
                      <View style={alsoBySkeletonStyles.cover} />
                      <View style={alsoBySkeletonStyles.titleBar} />
                      <View style={alsoBySkeletonStyles.titleBarShort} />
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Success */}
              {alsoBy.status === 'success' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.alsoByList}
                >
                  {alsoBy.works.map((item, index) => (
                    <TouchableOpacity
                      key={item.google_books_id ?? String(item.id) ?? String(index)}
                      onPress={() => router.push(`/book/${item.google_books_id ?? item.id}`)}
                      activeOpacity={0.8}
                      style={[styles.alsoByItem, index > 0 && { marginLeft: 12 }]}
                    >
                      <BookCover
                        uri={item.cover_image_url}
                        title={item.title}
                        author={item.author_name}
                        width={90}
                        borderRadius={10}
                      />
                      <Text style={styles.alsoByTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.release_date && (
                        <Text style={styles.alsoByYear}>
                          {new Date(item.release_date).getFullYear()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Error — section stays visible so there's no mystery blank gap */}
              {alsoBy.status === 'error' && (
                <Text style={styles.alsoByError}>
                  Couldn't load other works right now.
                </Text>
              )}
            </View>
          )}

          {/* Friends who have this — only for DB books */}
          {isAuthenticated && inDB && (
            <View style={styles.section}>
              <View style={friendStyles.header}>
                <Users size={16} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Friends who have this</Text>
              </View>
              {friendsLoading ? (
                <View style={friendStyles.skeletonRow}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={friendStyles.skeletonChip} />
                  ))}
                </View>
              ) : bookFriends.length > 0 ? (
                <View style={friendStyles.chipRow}>
                  {bookFriends.map((friend: { id: number; username: string; display_name?: string; status: ShelfStatus }) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={friendStyles.chip}
                      onPress={() => router.push(`/users/${friend.id}` as any)}
                      activeOpacity={0.75}
                      accessibilityLabel={`${friend.display_name || friend.username} — ${SHELF_LABELS[friend.status] ?? friend.status}`}
                    >
                      <View style={friendStyles.avatar}>
                        <Text style={friendStyles.avatarText}>
                          {(friend.display_name || friend.username).slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={friendStyles.chipName} numberOfLines={1}>
                          {friend.display_name || friend.username}
                        </Text>
                        <Text style={friendStyles.chipStatus} numberOfLines={1}>
                          {SHELF_LABELS[friend.status] ?? friend.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={friendStyles.empty}>
                  <Text style={friendStyles.emptyText}>
                    None of your friends have added this book yet.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Reading Buddy — only for books that exist in our DB */}
          {isAuthenticated && inDB && book.id && (
            <View style={styles.section}>
              <ReadingBuddySection bookId={book.id} bookTitle={book.title} />
            </View>
          )}

          {/* Rating — if reviewed */}
          {userBook?.rating != null && (
            <View style={styles.ratingRow}>
              <Star size={14} color={Colors.accent} />
              <Text style={styles.ratingLabel}>Your rating</Text>
              <StarRating rating={userBook.rating} size={14} />
              <Text style={styles.ratingVal}>{Number(userBook.rating).toFixed(1)}</Text>
            </View>
          )}

          {/* Review — if written */}
          {userBook?.review ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Review</Text>
              <View style={styles.reviewCard}>
                {userBook.rating != null && <StarRating rating={userBook.rating} size={14} />}
                <Text style={styles.reviewText}>&ldquo;{userBook.review}&rdquo;</Text>
              </View>
            </View>
          ) : null}

          {/* Personal Notes — visible only when book is on shelf */}
          {userBook && (
            <View style={styles.section}>
              <View style={styles.notesHeader}>
                <FileText size={15} color={Colors.lit2} />
                <Text style={styles.sectionTitle}>Personal Notes</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={notesText}
                onChangeText={(t) => { setNotesText(t); setNotesDirty(true); setNotesSaved(false) }}
                placeholder="Private notes about this book…"
                placeholderTextColor={Colors.lit3}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
              />
              {notesDirty && (
                <TouchableOpacity
                  style={[styles.notesSaveBtn, notesSaving && { opacity: 0.6 }]}
                  onPress={async () => {
                    if (!userBook.id || notesSaving) return
                    try {
                      await saveNotes(userBook.id, notesText)
                      setNotesDirty(false)
                      setNotesSaved(true)
                    } catch {
                      // error surfaced in hook
                    }
                  }}
                  disabled={notesSaving}
                  activeOpacity={0.8}
                >
                  {notesSaving
                    ? <ActivityIndicator size="small" color={Colors.accentOn} />
                    : <Text style={styles.notesSaveBtnText}>
                        {notesSaved ? 'Saved ✓' : 'Save Notes'}
                      </Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Fixed back button — always visible regardless of scroll position */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ChevronLeft size={20} color={Colors.lit} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Discover shortcut — shown when the user is more than one level deep so
          they can jump back to the tab root without tapping Back repeatedly. */}
      {canDismissAll && (
        <TouchableOpacity
          style={[styles.discoverBtn, { top: insets.top + 12 }]}
          onPress={() => router.dismissAll()}
          hitSlop={8}
          accessibilityLabel="Back to Discover"
          accessibilityRole="button"
        >
          <Compass size={14} color={Colors.lit} />
          <Text style={styles.backText}>Discover</Text>
        </TouchableOpacity>
      )}

      {/* Progress / shelf sheet */}
      {book && (
        <BookProgressSheet
          visible={progressOpen}
          userBook={userBook ?? null}
          book={book}
          onClose={() => setProgressOpen(false)}
          onSaved={() => { setProgressOpen(false); refetch() }}
        />
      )}

      {/* Suggest to a Friend modal */}
      {suggestBookId && (
        <SuggestToFriendModal
          visible={suggestOpen}
          bookId={suggestBookId}
          bookTitle={book.title}
          onClose={() => { setSuggestOpen(false); setSuggestBookId(null) }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.canvas },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, backgroundColor: Colors.canvas },

  // Loading / error
  loadingText: { fontSize: 14, color: Colors.lit2, marginTop: 8 },
  errorEmoji:  { fontSize: 48 },
  errorTitle:  { fontSize: 20, fontWeight: '700', color: Colors.lit },
  errorSub:    { fontSize: 14, color: Colors.lit2, textAlign: 'center' },
  errorBtn:    { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  errorBtnText:{ fontSize: 14, fontWeight: '600', color: Colors.lit2 },

  // Hero
  heroArea:    { height: HERO_H, overflow: 'hidden', position: 'relative' },
  heroBg:      { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  discoverBtn: {
    position: 'absolute', right: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  backText:    { fontSize: 13, fontWeight: '600', color: Colors.lit },
  coverWrap:   { alignItems: 'center', paddingBottom: 16 },
  coverShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 16,
  },

  // Body
  body:         { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  titleBlock:   { gap: 4 },
  title:        { fontSize: 26, fontWeight: '800', color: Colors.lit, letterSpacing: -0.5, lineHeight: 32 },
  author:       { fontSize: 16, color: Colors.lit2, fontWeight: '600' },
  relRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  relDate:      { fontSize: 12, color: Colors.lit2 },

  // Progress card
  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim, padding: 16, gap: 8,
  },
  progressCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCardLabel: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  progressCardPct:   { fontSize: 16, fontWeight: '700', color: Colors.accent },
  progressCardPages: { fontSize: 11, color: Colors.lit2 },

  // Shelf button
  shelfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, backgroundColor: Colors.accent,
  },
  shelfBtnActive:     { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.accent },
  shelfBtnDisabled:   { opacity: 0.55 },
  shelfBtnText:       { fontSize: 15, fontWeight: '700', color: Colors.accentOn },
  shelfBtnActiveText: { fontSize: 15, fontWeight: '700', color: Colors.accent },

  suggestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 44, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.grove,
  },
  suggestBtnText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },

  // Rating
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  ratingLabel: { fontSize: 12, color: Colors.lit2, flex: 1 },
  ratingVal:   { fontSize: 13, fontWeight: '700', color: Colors.accent },

  // Description
  section:      { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  description:  { fontSize: 14, color: Colors.lit2, lineHeight: 22 },
  readMore:     { fontSize: 13, fontWeight: '600', color: Colors.accent, marginTop: 4 },

  // Review
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim, padding: 16, gap: 8,
  },
  reviewText: { fontSize: 14, fontStyle: 'italic', color: Colors.lit2, lineHeight: 20 },

  // Notes
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notesInput: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 14, minHeight: 100,
    fontSize: 14, color: Colors.lit, lineHeight: 20,
  },
  notesSaveBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 9, marginTop: 4,
  },
  notesSaveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },

  // Finished tag
  finishedTag: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    alignSelf: 'center', marginTop: -6,
  },
  finishedTagText: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },

  // Also by author
  alsoBySection: { gap: 12 },
  alsoByList:    { paddingRight: 20 },
  alsoByItem:    { width: 90, gap: 6 },
  alsoByTitle:   { fontSize: 12, fontWeight: '600', color: Colors.lit, lineHeight: 16 },
  alsoByYear:    { fontSize: 11, color: Colors.lit2 },
  alsoByError:   { fontSize: 13, color: Colors.lit3, fontStyle: 'italic' },
})

const friendStyles = StyleSheet.create({
  header:  { flexDirection: 'row', alignItems: 'center', gap: 8 },

  skeletonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  skeletonChip: {
    height: 40, width: 110, borderRadius: 20,
    backgroundColor: Colors.grove,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingLeft: 4, paddingRight: 12, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { fontSize: 11, fontWeight: '800', color: Colors.lit3 },
  chipName:    { fontSize: 12, fontWeight: '700', color: Colors.lit, maxWidth: 120 },
  chipStatus:  { fontSize: 10, color: Colors.lit3, marginTop: 1 },

  empty: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim, borderStyle: 'dashed',
    backgroundColor: Colors.grove,
  },
  emptyText: { fontSize: 13, color: Colors.lit3, fontStyle: 'italic', textAlign: 'center' },
})

const alsoBySkeletonStyles = StyleSheet.create({
  cover: {
    width: 90, height: 130, borderRadius: 10,
    backgroundColor: Colors.grove,
  },
  titleBar: {
    height: 11, borderRadius: 6, backgroundColor: Colors.grove,
    width: 80,
  },
  titleBarShort: {
    height: 11, borderRadius: 6, backgroundColor: Colors.grove,
    width: 56, opacity: 0.6,
  },
})
