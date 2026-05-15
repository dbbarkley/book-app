import { useState, useMemo, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  TouchableWithoutFeedback, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useComingSoon, useBooksStore } from '@book-app/shared'
import type { Book, UserBook, UpcomingRelease } from '@book-app/shared'
import { ArrowLeft, CalendarDays, BookOpen, Plus, Check, ChevronDown } from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import BookProgressSheet from '@/components/BookProgressSheet'
import { Colors } from '@/constants/colors'

// ── Constants ─────────────────────────────────────────────────────────────────

const GENRE_FILTERS = [
  { id: null,                 label: 'All'        },
  { id: 'fiction',            label: 'Fiction'    },
  { id: 'romance',            label: 'Romance'    },
  { id: 'mystery',            label: 'Mystery'    },
  { id: 'thriller',           label: 'Thriller'   },
  { id: 'fantasy',            label: 'Fantasy'    },
  { id: 'science-fiction',    label: 'Sci-Fi'     },
  { id: 'horror',             label: 'Horror'     },
  { id: 'biography',          label: 'Biography'  },
  { id: 'self-help',          label: 'Self-Help'  },
  { id: 'history',            label: 'History'    },
  { id: 'young-adult',        label: 'YA'         },
] as const

type DateMode = 'week' | 'month'

interface DateBucket {
  key:      string
  label:    string
  sub:      string   // e.g. "May 6 – May 12" shown below label
  dateFrom: string
  dateTo:   string
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  // Local date string to avoid UTC-shift (new Date().toISOString() gives UTC midnight)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Return Monday of the week containing `d`. */
function weekMonday(d: Date): Date {
  const copy = new Date(d)
  const dow = copy.getDay() // 0 = Sun
  const offset = dow === 0 ? -6 : 1 - dow
  copy.setDate(copy.getDate() + offset)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function buildWeeks(): DateBucket[] {
  const today  = new Date()
  const monday = weekMonday(today)

  return Array.from({ length: 10 }, (_, i) => {
    const from = new Date(monday)
    from.setDate(monday.getDate() + i * 7)
    const to = new Date(from)
    to.setDate(from.getDate() + 6) // Sunday

    const label = i === 0 ? 'This Week' : i === 1 ? 'Next Week' : shortDate(from)
    const sub   = `${shortDate(from)} – ${shortDate(to)}`

    return { key: `w${i}`, label, sub, dateFrom: toISO(from), dateTo: toISO(to) }
  })
}

function buildMonths(): DateBucket[] {
  const today = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const first = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const last  = new Date(today.getFullYear(), today.getMonth() + i + 1, 0)

    // For the current month start from today, not the 1st
    const from = i === 0 ? new Date(today) : first

    const label = i === 0
      ? 'This Month'
      : first.toLocaleDateString('en-US', { month: 'long' })
    const sub = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    return { key: `m${i}`, label, sub, dateFrom: toISO(from), dateTo: toISO(last) }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAuthorsArray(authors: any): string[] {
  if (!authors) return []
  if (Array.isArray(authors)) return authors.map(String)
  return [String(authors)]
}

function formatReleaseDate(dateStr: string, daysUntil: number | null): string {
  if (daysUntil !== null && daysUntil <= 0)  return 'Out now'
  if (daysUntil !== null && daysUntil === 1) return 'Tomorrow'
  if (daysUntil !== null && daysUntil <= 7)  return `In ${daysUntil} days`
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Convert an UpcomingRelease to the minimal Book shape BookProgressSheet needs. */
function upcomingReleaseToBook(release: UpcomingRelease): Book {
  const authors = toAuthorsArray(release.authors)
  return {
    id:              null,
    title:           release.title,
    author_name:     authors[0] ?? undefined,
    cover_image_url: release.cover_image_url ?? undefined,
    release_date:    release.date_published,
    isbn:            release.isbn13,
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function UpcomingReleasesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // ── Genre filter ──────────────────────────────────────────────────────────
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

  // ── Date mode + buckets ───────────────────────────────────────────────────
  const [dateMode,       setDateMode]       = useState<DateMode>('week')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const weeks  = useMemo(() => buildWeeks(),  [])
  const months = useMemo(() => buildMonths(), [])
  const buckets = dateMode === 'week' ? weeks : months
  const [activeBucketKey, setActiveBucketKey] = useState<string>(weeks[0].key)

  const activeBucket = buckets.find(b => b.key === activeBucketKey) ?? buckets[0]

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { books, meta, loading, error } = useComingSoon({
    genre:     activeGenre,
    page,
    per:       20,
    date_from: activeBucket.dateFrom,
    date_to:   activeBucket.dateTo,
  })

  // ── Library / sheet ───────────────────────────────────────────────────────
  const [sheetBook,     setSheetBook]     = useState<Book | null>(null)
  const [sheetUserBook, setSheetUserBook] = useState<UserBook | null>(null)

  const userBooks = useBooksStore(state => state.userBooks)

  // Track which ISBNs are already in the user's library for the add button state
  const libraryIsbns = useMemo(() => new Set(
    Object.values(userBooks)
      .map(ub => ub.book?.isbn)
      .filter(Boolean) as string[]
  ), [userBooks])

  const closeSheet  = useCallback(() => { setSheetBook(null); setSheetUserBook(null) }, [])
  const onSheetSaved = useCallback(() => {}, [])

  // ── Event handlers ────────────────────────────────────────────────────────
  const selectGenre = useCallback((genre: string | null) => {
    Haptics.selectionAsync()
    setActiveGenre(genre)
    setPage(1)
  }, [])

  const selectMode = useCallback((mode: DateMode) => {
    if (mode === dateMode) return
    Haptics.selectionAsync()
    setDateMode(mode)
    const newBuckets = mode === 'week' ? weeks : months
    setActiveBucketKey(newBuckets[0].key)
    setPage(1)
  }, [dateMode, weeks, months])

  const selectBucket = useCallback((key: string) => {
    if (key === activeBucketKey) return
    Haptics.selectionAsync()
    setActiveBucketKey(key)
    setPage(1)
  }, [activeBucketKey])

  const openDateFilter  = useCallback(() => setDateFilterOpen(true),  [])
  const closeDateFilter = useCallback(() => setDateFilterOpen(false), [])

  // ── Book row renderer ─────────────────────────────────────────────────────
  const renderBook = useCallback(({ item: book }: { item: UpcomingRelease }) => {
    const authors   = toAuthorsArray(book.authors)
    const inLibrary = libraryIsbns.has(book.isbn13)
    const releaseLabel = formatReleaseDate(book.date_published, book.days_until)

    return (
      <TouchableOpacity
        style={styles.bookRow}
        onPress={() => router.push(`/book/${book.isbn13}`)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${book.title}${authors[0] ? ` by ${authors[0]}` : ''}. ${releaseLabel}. Tap to view details.`}
      >
        <BookCover
          uri={book.cover_image_url}
          title={book.title}
          author={authors[0] ?? ''}
          width={68}
          borderRadius={8}
        />

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          {authors.length > 0 && (
            <Text style={styles.bookAuthor} numberOfLines={1}>{authors.join(', ')}</Text>
          )}
          {book.publisher && (
            <Text style={styles.bookPublisher} numberOfLines={1}>{book.publisher}</Text>
          )}
          <View style={styles.bookMeta}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{releaseLabel}</Text>
            </View>
            {book.binding ? (
              <View style={styles.bindingBadge}>
                <Text style={styles.bindingBadgeText}>{book.binding}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Add to library button */}
        <TouchableOpacity
          style={[styles.addBtn, inLibrary && styles.addBtnDone]}
          onPress={(e) => {
            e.stopPropagation?.()
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            setSheetBook(upcomingReleaseToBook(book))
            setSheetUserBook(null)
          }}
          hitSlop={8}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={inLibrary
            ? `${book.title} is already in your library`
            : `Add ${book.title} to your library`}
          accessibilityState={{ selected: inLibrary }}
        >
          {inLibrary
            ? <Check size={15} color={Colors.success} />
            : <Plus  size={15} color={Colors.accent}  />
          }
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }, [libraryIsbns, router])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={Colors.lit} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Upcoming Releases</Text>
          <Text style={styles.subtitle}>{activeBucket.sub}</Text>
        </View>
        {meta && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{meta.total}</Text>
          </View>
        )}
      </View>

      {/* ── Genre chips ─────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.genreScrollView}
        contentContainerStyle={styles.genreRow}
        keyboardShouldPersistTaps="handled"
      >
        {GENRE_FILTERS.map(g => {
          const active = activeGenre === g.id
          return (
            <TouchableOpacity
              key={String(g.id)}
              style={[styles.genreChip, active && styles.genreChipActive]}
              onPress={() => selectGenre(g.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${g.label}`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.genreChipText, active && styles.genreChipTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* ── Date filter chip (replaces mode toggle + bucket scroll) ─────────── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.dateChip}
          onPress={openDateFilter}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Date range: ${activeBucket.label}, ${activeBucket.sub}. Tap to change.`}
        >
          <CalendarDays size={13} color={Colors.accent} />
          <Text style={styles.dateChipLabel}>{activeBucket.label}</Text>
          <Text style={styles.dateChipSub}>{activeBucket.sub}</Text>
          <ChevronDown size={11} color={Colors.lit3} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ── Book list ────────────────────────────────────────────────────────── */}
      {loading && books.length === 0 ? (
        // True initial load — no books yet, show a centred spinner.
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : error && books.length === 0 ? (
        // Error on first load — no stale data to fall back on.
        <View style={styles.empty}>
          <CalendarDays size={32} color={Colors.lit3} />
          <Text style={styles.emptyTitle}>Couldn't load releases</Text>
          <Text style={styles.emptySub}>Check back soon — our catalogue refreshes daily.</Text>
        </View>
      ) : !loading && books.length === 0 ? (
        // Loaded successfully but nothing matches the current filters.
        <View style={styles.empty}>
          <BookOpen size={32} color={Colors.lit3} />
          <Text style={styles.emptyTitle}>No releases found</Text>
          <Text style={styles.emptySub}>
            {activeGenre
              ? `No ${activeGenre} releases scheduled for this ${dateMode}.`
              : `Nothing scheduled for this ${dateMode} yet.`}
          </Text>
        </View>
      ) : (
        // Books available — keep them visible during filter refreshes (page === 1
        // re-fetch). A subtle opacity drop signals "updating" without a layout shift.
        <FlatList
          data={books}
          keyExtractor={b => b.isbn13}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderBook}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={loading && page === 1 ? styles.listRefreshing : undefined}
          onEndReached={() => {
            if (meta && page < meta.total_pages && !loading) {
              setPage(p => p + 1)
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && page > 1
              ? <View style={styles.loadingMore}><ActivityIndicator size="small" color={Colors.accent} /></View>
              : <View style={{ height: 32 }} />
          }
        />
      )}

      {/* ── Date filter modal ────────────────────────────────────────────────── */}
      <Modal
        visible={dateFilterOpen}
        animationType="slide"
        transparent
        onRequestClose={closeDateFilter}
      >
        <View style={styles.dateModalOuter}>
          <TouchableWithoutFeedback onPress={closeDateFilter}>
            <View style={styles.dateModalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.dateModalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Drag handle */}
            <View style={styles.dateModalHandleRow}>
              <View style={styles.dateModalHandle} />
            </View>

            <Text style={styles.dateModalTitle}>When?</Text>

            {/* Week / Month segmented control */}
            <View style={styles.modeToggle}>
              {(['week', 'month'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, dateMode === mode && styles.modeBtnActive]}
                  onPress={() => selectMode(mode)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`View by ${mode === 'week' ? 'week' : 'month'}`}
                  accessibilityState={{ selected: dateMode === mode }}
                >
                  <Text style={[styles.modeBtnText, dateMode === mode && styles.modeBtnTextActive]}>
                    {mode === 'week' ? 'By Week' : 'By Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tuesday hint — only relevant for the current week */}
            {dateMode === 'week' && activeBucketKey === weeks[0].key && (
              <Text style={styles.modeHint}>New releases typically drop on Tuesdays</Text>
            )}

            {/* Bucket grid — 2 columns */}
            <View style={styles.bucketGrid}>
              {Array.from({ length: Math.ceil(buckets.length / 2) }, (_, rowIdx) => (
                <View key={rowIdx} style={styles.bucketGridRow}>
                  {buckets.slice(rowIdx * 2, rowIdx * 2 + 2).map(bucket => {
                    const active = activeBucketKey === bucket.key
                    return (
                      <TouchableOpacity
                        key={bucket.key}
                        style={[styles.bucketGridItem, active && styles.bucketGridItemActive]}
                        onPress={() => { selectBucket(bucket.key); closeDateFilter() }}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`${bucket.label}, ${bucket.sub}`}
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.bucketGridLabel, active && styles.bucketGridLabelActive]}>
                          {bucket.label}
                        </Text>
                        <Text style={[styles.bucketGridSub, active && styles.bucketGridSubActive]}>
                          {bucket.sub}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add-to-library sheet ─────────────────────────────────────────────── */}
      {sheetBook && (
        <BookProgressSheet
          visible={!!sheetBook}
          book={sheetBook}
          userBook={sheetUserBook}
          onClose={closeSheet}
          onSaved={onSheetSaved}
        />
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerText: { flex: 1, gap: 1 },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.lit, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.lit3 },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  countText: { fontSize: 11, fontWeight: '700', color: Colors.lit2 },

  // ── Genre chips ──────────────────────────────────────────────────────────────
  // flexGrow: 0 / flexShrink: 0 prevents the horizontal ScrollView from claiming
  // flex space in the column container. Without this, when the content below is a
  // plain View (flex: 1) instead of FlatList, they split remaining space 50/50 and
  // the date chip lands at ~50% screen height (the "Historical / 0 books" bug).
  genreScrollView: { flexGrow: 0, flexShrink: 0 },
  genreRow: {
    paddingHorizontal: 20, paddingVertical: 10, gap: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  genreChip: {
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  genreChipActive: {
    backgroundColor: Colors.accent, borderColor: Colors.accent,
  },
  genreChipText:       { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  genreChipTextActive: { color: Colors.accentOn },

  // ── Date filter chip (trigger) ────────────────────────────────────────────────
  filterBar: {
    paddingHorizontal: 20, paddingBottom: 10,
    flexDirection: 'row',
  },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  dateChipLabel: { fontSize: 13, fontWeight: '700', color: Colors.lit },
  dateChipSub:   { fontSize: 12, color: Colors.lit3, flex: 1 },

  divider: { height: 1, backgroundColor: Colors.rim },

  // ── Book list ─────────────────────────────────────────────────────────────────
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:          { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  listRefreshing: { opacity: 0.45 },
  separator: { height: 1, backgroundColor: Colors.rim },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },

  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  bookInfo:      { flex: 1, gap: 3 },
  bookTitle:     { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  bookAuthor:    { fontSize: 12, color: Colors.lit2 },
  bookPublisher: { fontSize: 11, color: Colors.lit3 },
  bookMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },

  dateBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
    backgroundColor: `${Colors.accent}28`,
  },
  dateBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  bindingBadge: {
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.rim,
  },
  bindingBadgeText: { fontSize: 11, color: Colors.lit3 },

  // ── Add button ────────────────────────────────────────────────────────────────
  addBtn: {
    width: 32, height: 32, borderRadius: 16, flexShrink: 0,
    backgroundColor: `${Colors.accent}18`,
    borderWidth: 1, borderColor: `${Colors.accent}44`,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDone: {
    backgroundColor: `${Colors.success}18`,
    borderColor:     `${Colors.success}44`,
  },

  // ── Empty / error ─────────────────────────────────────────────────────────────
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.lit2, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: Colors.lit3, textAlign: 'center', lineHeight: 18 },

  // ── Date filter modal ─────────────────────────────────────────────────────────
  dateModalOuter: {
    flex: 1, justifyContent: 'flex-end',
  },
  dateModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dateModalSheet: {
    backgroundColor: Colors.canvas,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 16,
  },
  dateModalHandleRow: { alignItems: 'center', paddingTop: 10, marginBottom: 4 },
  dateModalHandle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.rim },
  dateModalTitle:     { fontSize: 17, fontWeight: '700', color: Colors.lit, marginTop: 12, marginBottom: 14 },

  // ── Week / Month segmented toggle (inside modal) ──────────────────────────────
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.grove,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.rim,
    padding: 3, alignSelf: 'flex-start', marginBottom: 10,
  },
  modeBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  modeBtnText:       { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
  modeBtnTextActive: { color: Colors.lit },
  modeHint: { fontSize: 12, color: Colors.lit3, fontStyle: 'italic', marginBottom: 8 },

  // ── Bucket 2-column grid (inside modal) ───────────────────────────────────────
  bucketGrid:    { gap: 8, marginTop: 4, marginBottom: 8 },
  bucketGridRow: { flexDirection: 'row', gap: 8 },
  bucketGridItem: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.surface,
    alignItems: 'center', gap: 2,
  },
  bucketGridItemActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  bucketGridLabel:       { fontSize: 13, fontWeight: '700', color: Colors.lit2, textAlign: 'center' },
  bucketGridLabelActive: { color: Colors.accent },
  bucketGridSub:         { fontSize: 11, color: Colors.lit3, textAlign: 'center' },
  bucketGridSubActive:   { color: '#A0803C' }, // solid muted gold — no semi-transparent text
})
