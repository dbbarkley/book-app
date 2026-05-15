import React, { useState, useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  RefreshControl, Modal, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth, useUserLibrary, usePrivateLibrary, useMilestones } from '@book-app/shared'
import { Search, Plus, X, BookOpen, ArrowRight, ChevronRight, Lock, ArrowUpDown, Check as CheckIcon, CheckCircle } from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import BookProgressSheet from '@/components/BookProgressSheet'
import ReadingGoalModal from '@/components/ReadingGoalModal'
import StarRating from '@/components/StarRating'
import { Colors } from '@/constants/colors'
import { SHELF_LABELS } from '@/constants/shelf-labels'
import type { UserBook } from '@book-app/shared'

// ── Currently Reading card (vertical, larger) ─────────────────────────────────

function ReadingCard({
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
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.85}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name}
        width={72}
        borderRadius={10}
      />
      <View style={styles.readingInfo}>
        <Text style={styles.readingTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.readingAuthor} numberOfLines={1}>by {book.author_name}</Text>
        )}
        <View style={styles.readingProgress}>
          <ProgressBar percent={pct} height={5} />
          <View style={styles.readingProgressRow}>
            <Text style={styles.readingProgressPages}>
              {total ? `p. ${pRead} / ${total}` : `${pct}%`}
            </Text>
            <Text style={styles.readingProgressPct}>{pct}%</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.readingUpdateBtn}
          onPress={(e) => { e.stopPropagation?.(); onUpdatePress() }}
          activeOpacity={0.8}
        >
          <Text style={styles.readingUpdateText}>Update Progress</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

// ── Horizontal cover tile ─────────────────────────────────────────────────────

const H_COVER_W = 80

function CoverTile({ userBook, onPress }: { userBook: UserBook; onPress: () => void }) {
  const book = userBook.book!
  const ratingLabel = userBook.rating != null
    ? `, rated ${userBook.rating} out of 5 stars`
    : ''
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.coverTile}
      accessibilityLabel={`${book.title} by ${book.author_name ?? 'unknown author'}${ratingLabel}`}
      accessibilityRole="button"
    >
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name}
        width={H_COVER_W}
        borderRadius={10}
      />
      {userBook.rating != null && (
        <View style={styles.coverRating}>
          <StarRating rating={userBook.rating} size={10} />
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  onSeeAll,
  icon,
}: {
  title: string
  count?: number
  onSeeAll?: () => void
  icon?: React.ReactNode
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon && icon}
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null && count > 0 && (
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>{count}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAll} onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={13} color={Colors.lit3} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Search result row (when querying) ─────────────────────────────────────────

function SearchRow({
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

  return (
    <TouchableOpacity style={styles.searchRow} onPress={onPress} activeOpacity={0.8}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name}
        width={56}
        borderRadius={8}
      />
      <View style={styles.searchRowInfo}>
        <Text style={styles.searchRowTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.searchRowAuthor} numberOfLines={1}>by {book.author_name}</Text>
        )}
        <View style={styles.searchRowMeta}>
          <View style={[
            styles.shelfPill,
            userBook.status === 'reading'    && styles.shelfPillReading,
            (userBook as any)._private       && styles.shelfPillPrivate,
          ]}>
            <Text style={[
              styles.shelfPillText,
              userBook.status === 'reading'  && styles.shelfPillTextReading,
            ]}>
              {(userBook as any)._private ? 'Private' : (SHELF_LABELS[userBook.status] ?? userBook.status)}
            </Text>
          </View>
          {userBook.status === 'reading' && (
            <Text style={styles.searchRowPct}>{pct}%</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.searchRowEdit}
        onPress={(e) => { e.stopPropagation?.(); onUpdatePress() }}
        hitSlop={8}
      >
        <Text style={styles.searchRowEditText}>Edit</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

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
      case 'title':
        return (a.book?.title ?? '').localeCompare(b.book?.title ?? '')
      case 'author':
        return (a.book?.author_name ?? '').localeCompare(b.book?.author_name ?? '')
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'date_added':
      default:
        return (b.id ?? 0) - (a.id ?? 0)
    }
  })
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const { user }  = useAuth()
  const router    = useRouter()
  const insets    = useSafeAreaInsets()

  const { groupedLibrary, library, loading, error, refresh } = useUserLibrary(user?.id)
  const { privateBooks, refreshPrivateLibrary } = usePrivateLibrary()
  const { readingGoal, setGoal, isLoading: goalSaving } = useMilestones()

  const [query, setQuery]           = useState('')
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalInput,     setGoalInput]     = useState('')
  const [progressTarget, setProgressTarget] = useState<UserBook | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sortKey, setSortKey]       = useState<SortKey>('date_added')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refresh(), refreshPrivateLibrary()])
    setRefreshing(false)
  }, [refresh, refreshPrivateLibrary])

  const q = query.trim().toLowerCase()
  const allBooks = [...library, ...privateBooks.map(b => ({ ...b, _private: true }))]
  const searchResults = q
    ? allBooks.filter((ub) => {
        const title  = ub.book?.title?.toLowerCase()       ?? ''
        const author = ub.book?.author_name?.toLowerCase() ?? ''
        return title.includes(q) || author.includes(q)
      })
    : []

  const reading   = sortBooks(groupedLibrary?.reading  ?? [], sortKey)
  const toRead    = sortBooks(groupedLibrary?.to_read  ?? [], sortKey)
  const completed = sortBooks(groupedLibrary?.read     ?? [], sortKey)
  const dnf       = sortBooks(groupedLibrary?.dnf      ?? [], sortKey)
  const totalCount = library.length
  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Sort'

  const handleSaveGoal = async () => {
    const n = parseInt(goalInput, 10)
    if (isNaN(n) || n < 1) {
      Alert.alert('Invalid goal', 'Please enter a number greater than 0.')
      return
    }
    await setGoal(n)
    setGoalModalOpen(false)
  }

  const goToBook = (ub: UserBook) =>
    router.push(`/book/${ub.book!.google_books_id ?? ub.book!.id}`)

  const goToShelf = (status: string) => router.push(`/shelf/${status}`)

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          {totalCount > 0 && (
            <Text style={styles.subtitle}>
              {totalCount} book{totalCount !== 1 ? 's' : ''} in your collection
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {totalCount > 0 && (
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortSheetOpen(true)}
              activeOpacity={0.8}
              accessibilityLabel={`Sort by ${activeSortLabel}`}
              accessibilityRole="button"
            >
              <ArrowUpDown size={14} color={Colors.lit2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/(tabs)/search')
            }}
            activeOpacity={0.8}
            accessibilityLabel="Add a book to your library"
            accessibilityRole="button"
          >
            <Plus size={16} color={Colors.accentOn} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort sheet */}
      <Modal
        visible={sortSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSortSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.sortBackdrop}
          onPress={() => setSortSheetOpen(false)}
          activeOpacity={1}
        />
        <View style={[styles.sortSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sortHandle} />
          <Text style={styles.sortSheetTitle}>Sort Library</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.sortOption}
              onPress={() => { setSortKey(opt.key); setSortSheetOpen(false) }}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ checked: sortKey === opt.key }}
            >
              <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionActive]}>
                {opt.label}
              </Text>
              {sortKey === opt.key && <CheckIcon size={16} color={Colors.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Search size={15} color={Colors.lit3} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or author…"
          placeholderTextColor={Colors.lit3}
          selectionColor={Colors.accent}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <X size={15} color={Colors.lit3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={refresh}>
          <Text style={styles.errorText}>{error} — tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && library.length === 0 && privateBooks.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>

      /* Empty library — new user, no books yet */
      ) : !q && library.length === 0 && privateBooks.length === 0 ? (
        <View style={styles.emptyLibrary}>
          <View style={styles.emptyLibraryIconWrap}>
            <BookOpen size={36} color={Colors.accent} />
          </View>
          <Text style={styles.emptyLibraryTitle}>Your library is empty</Text>
          <Text style={styles.emptyLibraryBody}>
            Start tracking what you read by adding your first book.
          </Text>
          <TouchableOpacity
            style={styles.emptyLibraryBtn}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <Search size={15} color={Colors.accentOn} />
            <Text style={styles.emptyLibraryBtnText}>Find a book to add</Text>
          </TouchableOpacity>
        </View>

      /* Search results */
      ) : q ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.searchContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {searchResults.length === 0 ? (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No books match "{query}"</Text>
            </View>
          ) : (
            searchResults.map((ub, i) => (
              <View key={String(ub.id)}>
                <SearchRow
                  userBook={ub}
                  onPress={() => goToBook(ub)}
                  onUpdatePress={() => setProgressTarget(ub)}
                />
                {i < searchResults.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </ScrollView>

      /* Main shelf view */
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
        >

          {/* ── Reading Goal ── */}
          <TouchableOpacity
            style={styles.goalCard}
            onPress={() => {
              setGoalInput(readingGoal ? String(readingGoal) : '')
              setGoalModalOpen(true)
            }}
            activeOpacity={0.85}
          >
            {(() => {
              const year       = new Date().getFullYear()
              const pct        = readingGoal ? Math.min(100, Math.round((completed.length / readingGoal) * 100)) : 0
              const isComplete = !!readingGoal && completed.length >= readingGoal
              return (
                <>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>
                      Reading Goal{' '}
                      <Text style={styles.goalYear}>· {year}</Text>
                    </Text>
                    {isComplete ? (
                      <View style={styles.goalCompletePill}>
                        <CheckCircle size={11} color="#fff" />
                        <Text style={styles.goalCompletePillText}>Complete!</Text>
                      </View>
                    ) : (
                      <Text style={styles.goalEdit}>{readingGoal ? 'Edit' : 'Set →'}</Text>
                    )}
                  </View>

                  {readingGoal ? (
                    <>
                      <View style={styles.goalCountRow}>
                        <Text style={styles.goalCountDone}>{completed.length}</Text>
                        <Text style={styles.goalCountOf}> of {readingGoal} books</Text>
                        <View style={styles.goalCountSpacer} />
                        <Text style={[styles.goalPct, isComplete && styles.goalPctComplete]}>{pct}%</Text>
                      </View>
                      <View style={styles.goalBarTrack}>
                        <View style={[
                          styles.goalBarFill,
                          { width: `${pct}%` as any },
                          isComplete && styles.goalBarFillComplete,
                        ]} />
                      </View>
                    </>
                  ) : (
                    <Text style={styles.goalCta}>Track how many books you read this year</Text>
                  )}
                </>
              )
            })()}
          </TouchableOpacity>

          {/* ── Currently Reading ── */}
          <SectionHeader title="Currently Reading" count={reading.length} />
          {reading.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyShelf}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <BookOpen size={20} color={Colors.lit3} />
              <Text style={styles.emptyShelfText}>
                Find a book to start reading
              </Text>
              <ArrowRight size={14} color={Colors.lit3} />
            </TouchableOpacity>
          ) : (
            <View style={styles.readingList}>
              {reading.map((ub) => (
                <ReadingCard
                  key={String(ub.id)}
                  userBook={ub}
                  onPress={() => goToBook(ub)}
                  onUpdatePress={() => setProgressTarget(ub)}
                />
              ))}
            </View>
          )}

          {/* ── To Read ── */}
          <SectionHeader
            title="To Read"
            count={toRead.length}
            onSeeAll={toRead.length > 0 ? () => goToShelf('to_read') : undefined}
          />
          {toRead.length === 0 ? (
            <View style={styles.emptyHScroll}>
              <Text style={styles.emptyShelfText}>Nothing queued up yet</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {toRead.map((ub) => (
                <CoverTile
                  key={String(ub.id)}
                  userBook={ub}
                  onPress={() => goToBook(ub)}
                />
              ))}
              {toRead.length >= 5 && (
                <TouchableOpacity
                  style={styles.seeAllTile}
                  onPress={() => goToShelf('to_read')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeAllTileText}>See{'\n'}all</Text>
                  <ChevronRight size={16} color={Colors.lit2} />
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* ── Completed ── */}
          <SectionHeader
            title="Completed"
            count={completed.length}
            onSeeAll={completed.length > 0 ? () => goToShelf('read') : undefined}
          />
          {completed.length === 0 ? (
            <View style={styles.emptyHScroll}>
              <Text style={styles.emptyShelfText}>No finished books yet</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {completed.map((ub) => (
                <CoverTile
                  key={String(ub.id)}
                  userBook={ub}
                  onPress={() => goToBook(ub)}
                />
              ))}
              {completed.length >= 5 && (
                <TouchableOpacity
                  style={styles.seeAllTile}
                  onPress={() => goToShelf('read')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeAllTileText}>See{'\n'}all</Text>
                  <ChevronRight size={16} color={Colors.lit2} />
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* ── DNF (only if non-empty) ── */}
          {dnf.length > 0 && (
            <>
              <SectionHeader
                title="Did Not Finish"
                count={dnf.length}
                onSeeAll={() => goToShelf('dnf')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScrollContent}
              >
                {dnf.map((ub) => (
                  <CoverTile
                    key={String(ub.id)}
                    userBook={ub}
                    onPress={() => goToBook(ub)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Private (always shown) ── */}
          <SectionHeader
            title="Private"
            count={privateBooks.length}
            onSeeAll={privateBooks.length > 0 ? () => goToShelf('private') : undefined}
            icon={<Lock size={14} color={Colors.lit3} />}
          />
          {privateBooks.length === 0 ? (
            <View style={styles.emptyHScroll}>
              <Text style={styles.emptyShelfText}>
                Books you mark as private will appear here
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {privateBooks.map((ub) => (
                <CoverTile
                  key={String(ub.id)}
                  userBook={ub}
                  onPress={() => goToBook(ub)}
                />
              ))}
              {privateBooks.length >= 5 && (
                <TouchableOpacity
                  style={styles.seeAllTile}
                  onPress={() => goToShelf('private')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeAllTileText}>See{'\n'}all</Text>
                  <ChevronRight size={16} color={Colors.lit2} />
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      )}

      <ReadingGoalModal
        visible={goalModalOpen}
        value={goalInput}
        onChangeValue={setGoalInput}
        onSave={handleSaveGoal}
        onClose={() => setGoalModalOpen(false)}
        saving={goalSaving}
      />

      {/* Progress sheet */}
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
  flex:      { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.canvas },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  title:    { fontSize: 26, fontWeight: '700', color: Colors.lit, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.lit2, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },

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

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8,
    paddingHorizontal: 12, height: 44, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.lit, height: 44 },

  // Error
  errorBanner: {
    marginHorizontal: 20, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
  errorText: { fontSize: 13, color: Colors.lit2, textAlign: 'center' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Main scroll
  mainContent: { paddingBottom: 20 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.lit },
  sectionCount: {
    backgroundColor: Colors.grove, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.rim,
  },
  sectionCountText: { fontSize: 11, fontWeight: '700', color: Colors.lit2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, color: Colors.lit2 },

  // Currently Reading cards
  readingList: { paddingHorizontal: 20, gap: 12 },
  readingCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.rim,
    padding: 14,
  },
  readingInfo:        { flex: 1, gap: 5 },
  readingTitle:       { fontSize: 15, fontWeight: '700', color: Colors.lit, lineHeight: 20 },
  readingAuthor:      { fontSize: 12, color: Colors.lit2 },
  readingProgress:    { gap: 5, marginTop: 4 },
  readingProgressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  readingProgressPages: { fontSize: 11, color: Colors.lit2 },
  readingProgressPct:   { fontSize: 11, fontWeight: '700', color: Colors.accent },
  readingUpdateBtn: {
    marginTop: 6, height: 44, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  readingUpdateText: { fontSize: 12, fontWeight: '700', color: Colors.accentOn },

  // Horizontal scroll
  hScrollContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  coverTile: { gap: 5 },
  coverRating: { alignItems: 'center', marginTop: 2 },

  // "See all" tile in horizontal scroll
  seeAllTile: {
    width: H_COVER_W * 0.6,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  seeAllTileText: {
    fontSize: 12, fontWeight: '600',
    color: Colors.lit2, textAlign: 'center',
  },

  // Empty states
  emptyShelf: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  emptyHScroll: {
    marginHorizontal: 20, paddingVertical: 12,
    alignItems: 'center',
  },
  emptyShelfText: { flex: 1, fontSize: 13, color: Colors.lit2 },

  // Search results
  searchContent: { paddingHorizontal: 20, paddingBottom: 40 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  searchRowInfo:   { flex: 1, gap: 4 },
  searchRowTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  searchRowAuthor: { fontSize: 12, color: Colors.lit2 },
  searchRowMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  searchRowPct:    { fontSize: 11, fontWeight: '700', color: Colors.accent },
  searchRowEdit: { paddingHorizontal: 10, paddingVertical: 6 },
  searchRowEditText: { fontSize: 12, fontWeight: '600', color: Colors.accent },
  shelfPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
  shelfPillReading:     { borderColor: `${Colors.accent}55` },
  shelfPillPrivate:     { borderColor: Colors.rim },
  shelfPillText:        { fontSize: 11, fontWeight: '600', color: Colors.lit2 },
  shelfPillTextReading: { color: Colors.accent },
  divider: { height: 1, backgroundColor: Colors.rim },

  emptySearch: { paddingVertical: 40, alignItems: 'center' },
  emptySearchText: { fontSize: 14, color: Colors.lit2 },

  bottomPad: { height: 40 },

  // Reading goal card
  goalCard: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim,
  },
  goalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTitle:     { fontSize: 13, fontWeight: '700', color: Colors.lit },
  goalYear:      { fontWeight: '500', color: Colors.lit2 },
  goalEdit:      { fontSize: 12, fontWeight: '700', color: Colors.accent },
  goalCompletePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  goalCompletePillText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  goalCountRow:  { flexDirection: 'row', alignItems: 'baseline' },
  goalCountDone: { fontSize: 26, fontWeight: '800', color: Colors.lit, lineHeight: 30 },
  goalCountOf:   { fontSize: 14, fontWeight: '500', color: Colors.lit2 },
  goalCountSpacer: { flex: 1 },
  goalPct:             { fontSize: 14, fontWeight: '700', color: Colors.accent },
  goalPctComplete:     { color: Colors.success },
  goalBarTrack:        { height: 8, borderRadius: 4, backgroundColor: Colors.grove, overflow: 'hidden' },
  goalBarFill:         { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  goalBarFillComplete: { backgroundColor: Colors.success },
  goalCta:       { fontSize: 13, color: Colors.lit2, lineHeight: 18 },

  // Empty library (new user)
  emptyLibrary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 14,
  },
  emptyLibraryIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyLibraryTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.lit,
    textAlign: 'center', letterSpacing: -0.3,
  },
  emptyLibraryBody: {
    fontSize: 14, color: Colors.lit2, textAlign: 'center', lineHeight: 20,
  },
  emptyLibraryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 13, marginTop: 6,
  },
  emptyLibraryBtnText: {
    fontSize: 14, fontWeight: '700', color: Colors.accentOn,
  },
})
