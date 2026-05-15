/**
 * /shelf/[status] — full list of all books on a given shelf.
 * Navigated to from the "See all →" links on the Library screen.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Modal,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth, useUserLibrary, usePrivateLibrary } from '@book-app/shared'
import { ArrowLeft, Lock, ArrowUpDown, Check as CheckIcon } from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import BookProgressSheet from '@/components/BookProgressSheet'
import StarRating from '@/components/StarRating'
import { Colors } from '@/constants/colors'
import { SHELF_TITLES } from '@/constants/shelf-labels'
import type { UserBook, ShelfStatus } from '@book-app/shared'

type SortKey = 'date_added' | 'title' | 'author' | 'rating'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_added', label: 'Date Added' },
  { key: 'title',      label: 'Title (A–Z)' },
  { key: 'author',     label: 'Author (A–Z)' },
  { key: 'rating',     label: 'Rating' },
]
function sortBooks(books: UserBook[], sortKey: SortKey): UserBook[] {
  return [...books].sort((a, b) => {
    switch (sortKey) {
      case 'title':  return (a.book?.title ?? '').localeCompare(b.book?.title ?? '')
      case 'author': return (a.book?.author_name ?? '').localeCompare(b.book?.author_name ?? '')
      case 'rating': return (b.rating ?? 0) - (a.rating ?? 0)
      default:       return (b.id ?? 0) - (a.id ?? 0)
    }
  })
}


const COVER_W = 64

function BookRow({
  userBook,
  onPress,
  onUpdatePress,
}: {
  userBook: UserBook
  onPress: () => void
  onUpdatePress: () => void
}) {
  const book = userBook.book!
  const pct  = userBook.completion_percentage ?? 0
  const pRead = userBook.pages_read ?? 0
  const total = userBook.total_pages ?? book.page_count

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name}
        width={COVER_W}
        borderRadius={9}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.rowAuthor} numberOfLines={1}>by {book.author_name}</Text>
        )}

        {userBook.status === 'reading' && (
          <View style={styles.rowProgress}>
            <ProgressBar percent={pct} height={4} />
            <Text style={styles.rowProgressText}>
              {total ? `p. ${pRead} / ${total}` : `${pct}%`}
            </Text>
          </View>
        )}

        {userBook.status === 'read' && userBook.rating != null && (
          <View style={styles.rowRating}>
            <StarRating rating={userBook.rating} size={12} />
          </View>
        )}

        <TouchableOpacity
          style={styles.rowBtn}
          onPress={(e) => { e.stopPropagation?.(); onUpdatePress() }}
          hitSlop={8}
        >
          <Text style={styles.rowBtnText}>
            {userBook.status === 'reading' ? 'Update Progress' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default function ShelfScreen() {
  const { status }  = useLocalSearchParams<{ status: ShelfStatus | 'private' }>()
  const { user }    = useAuth()
  const router      = useRouter()
  const insets      = useSafeAreaInsets()

  const { groupedLibrary, loading: libLoading, refresh } = useUserLibrary(user?.id)
  const { privateBooks, loading: privateLoading, refreshPrivateLibrary } = usePrivateLibrary()
  const [progressTarget, setProgressTarget] = useState<UserBook | null>(null)
  const [refreshing, setRefreshing]         = useState(false)
  const [sortKey, setSortKey]               = useState<SortKey>('date_added')
  const [sortSheetOpen, setSortSheetOpen]   = useState(false)

  const isPrivate = status === 'private'

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await (isPrivate ? refreshPrivateLibrary() : refresh())
    setRefreshing(false)
  }, [refresh, refreshPrivateLibrary, isPrivate])

  const loading = isPrivate ? privateLoading : libLoading
  const rawBooks = isPrivate
    ? privateBooks
    : (groupedLibrary?.[status as ShelfStatus] ?? [])
  const books = sortBooks(rawBooks, sortKey)
  const label = SHELF_TITLES[status as ShelfStatus | 'private'] ?? status

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={Colors.lit} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.titleRow}>
            {isPrivate && <Lock size={16} color={Colors.lit3} />}
            <Text style={styles.title}>{label}</Text>
          </View>
          {books.length > 0 && (
            <Text style={styles.subtitle}>{books.length} book{books.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        {books.length > 1 && (
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setSortSheetOpen(true)}
            accessibilityLabel="Sort books"
            accessibilityRole="button"
          >
            <ArrowUpDown size={16} color={Colors.lit2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort modal */}
      <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
        <TouchableOpacity style={styles.sortBackdrop} onPress={() => setSortSheetOpen(false)} activeOpacity={1} />
        <View style={[styles.sortSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sortHandle} />
          <Text style={styles.sortSheetTitle}>Sort</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.sortOption}
              onPress={() => { setSortKey(opt.key); setSortSheetOpen(false) }}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ checked: sortKey === opt.key }}
            >
              <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionActive]}>{opt.label}</Text>
              {sortKey === opt.key && <CheckIcon size={16} color={Colors.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {loading && books.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing on this shelf yet.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(ub) => String(ub.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item: ub }) =>
            ub.book ? (
              <BookRow
                userBook={ub}
                onPress={() => router.push(`/book/${ub.book!.google_books_id ?? ub.book!.id}`)}
                onUpdatePress={() => setProgressTarget(ub)}
              />
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}

      {progressTarget?.book && (
        <BookProgressSheet
          visible={!!progressTarget}
          userBook={progressTarget}
          book={progressTarget.book}
          onClose={() => setProgressTarget(null)}
          onSaved={() => { setProgressTarget(null); refresh() }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { gap: 2, flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.lit, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.lit2 },
  sortBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },

  // Sort sheet
  sortBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sortSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.canvas, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.rim,
    paddingHorizontal: 20, gap: 4,
  },
  sortHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.rim, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sortSheetTitle: { fontSize: 13, fontWeight: '700', color: Colors.lit3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.rim,
  },
  sortOptionText:   { fontSize: 15, color: Colors.lit },
  sortOptionActive: { color: Colors.accent, fontWeight: '700' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { paddingHorizontal: 20, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: Colors.rim, marginLeft: COVER_W + 20 + 12 },

  row: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    paddingVertical: 14,
  },
  rowInfo:     { flex: 1, gap: 4 },
  rowTitle:    { fontSize: 15, fontWeight: '700', color: Colors.lit, lineHeight: 20 },
  rowAuthor:   { fontSize: 12, color: Colors.lit2 },
  rowProgress: { gap: 4, marginTop: 4 },
  rowProgressText: { fontSize: 11, color: Colors.lit2 },
  rowRating:   { marginTop: 4 },
  rowBtn: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
    minHeight: 34,
  },
  rowBtnText: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.lit2 },
})
