import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useAuth, useBookSimilarity, apiClient } from '@book-app/shared'
import type { Book, UserBook } from '@book-app/shared'
import { ArrowLeft, Sparkles, Check, X, Search, BookOpen, ChevronRight } from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import { Colors } from '@/constants/colors'

// ── Seed pill ─────────────────────────────────────────────────────────────────

function SeedPill({
  book,
  isLoading,
  onRemove,
}: {
  book: Book
  isLoading: boolean
  onRemove: () => void
}) {
  return (
    <View style={styles.pill}>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.accentOn} style={{ marginRight: 4 }} />
      ) : (
        <Check size={12} color={Colors.accentOn} style={{ marginRight: 4 }} />
      )}
      <Text style={styles.pillText} numberOfLines={1}>{book.title}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8} style={{ marginLeft: 4 }}>
        <X size={12} color={Colors.accentOn} />
      </TouchableOpacity>
    </View>
  )
}

// ── Library book row ──────────────────────────────────────────────────────────

function LibraryRow({
  userBook,
  isSelected,
  isDisabled,
  onPress,
}: {
  userBook: UserBook
  isSelected: boolean
  isDisabled: boolean
  onPress: () => void
}) {
  const book = userBook.book
  if (!book) return null

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={onPress}
      disabled={isDisabled && !isSelected}
      activeOpacity={0.75}
    >
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name ?? ''}
        width={40}
        borderRadius={8}
      />
      <View style={styles.rowInfo}>
        <Text
          style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        {book.author_name && (
          <Text
            style={[styles.rowAuthor, isSelected && styles.rowAuthorSelected]}
            numberOfLines={1}
          >
            {book.author_name}
          </Text>
        )}
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Check size={12} color={Colors.accent} />}
      </View>
    </TouchableOpacity>
  )
}

// ── Result book row ───────────────────────────────────────────────────────────

function ResultRow({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.8}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name ?? ''}
        width={44}
        borderRadius={8}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.resultAuthor} numberOfLines={1}>{book.author_name}</Text>
        )}
      </View>
      <ChevronRight size={16} color={Colors.lit3} />
    </TouchableOpacity>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FindNextBookScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { user } = useAuth()

  const [readBooks,  setReadBooks]  = useState<UserBook[]>([])
  const [libLoading, setLibLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')

  const {
    seeds,
    addSeed,
    removeSeed,
    canAddMore,
    maxSeeds,
    isLoading,
    loadingIds,
    error,
    mergedResults,
    canCommit,
    showResults,
    commit,
    reset,
  } = useBookSimilarity()

  // Load user's read shelf on mount
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { user_books } = await apiClient.getUserBooks({ shelf: 'read' })
        setReadBooks(user_books)
      } catch {
        // non-fatal
      } finally {
        setLibLoading(false)
      }
    })()
  }, [user])

  const isSeedById = useCallback(
    (bookId: number | null) => seeds.some(s => s.id === bookId),
    [seeds]
  )

  const isLoadingById = useCallback(
    (bookId: number | null) => bookId ? loadingIds.has(String(bookId)) : false,
    [loadingIds]
  )

  const handleRowPress = useCallback((ub: UserBook) => {
    if (!ub.book) return
    Haptics.selectionAsync()
    if (isSeedById(ub.book.id ?? null)) {
      removeSeed(ub.book)
    } else {
      addSeed(ub.book)
    }
  }, [isSeedById, removeSeed, addSeed])

  const handleResultPress = useCallback((book: Book) => {
    const id = book.id ?? book.google_books_id
    if (id) router.push(`/book/${id}`)
  }, [router])

  const filteredBooks = readBooks.filter(ub => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    return (
      ub.book?.title?.toLowerCase().includes(q) ||
      ub.book?.author_name?.toLowerCase().includes(q)
    )
  })

  // ── Results view ──────────────────────────────────────────────────────────

  if (showResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={reset} hitSlop={8}>
            <ArrowLeft size={18} color={Colors.lit} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Books you might love</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Based on {seeds.map(s => s.title).join(' & ')}
            </Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color={Colors.lit3} />
            <Text style={styles.searchingText}>Still searching…</Text>
          </View>
        )}

        {mergedResults.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <BookOpen size={32} color={Colors.lit3} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySub}>Try picking different books.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={mergedResults}
            keyExtractor={(b, i) => b.isbn ?? b.google_books_id ?? b.title ?? String(i)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: book }) => (
              <ResultRow
                book={book}
                onPress={() => handleResultPress(book)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    )
  }

  // ── Picker view ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={18} color={Colors.lit} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Find My Next Book</Text>
          <Text style={styles.subtitle}>Pick 2–{maxSeeds} books you've loved</Text>
        </View>
      </View>

      {/* Selected seed pills */}
      {seeds.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {seeds.map(book => (
            <SeedPill
              key={String(book.id)}
              book={book}
              isLoading={isLoadingById(book.id ?? null)}
              onRemove={() => { Haptics.selectionAsync(); removeSeed(book) }}
            />
          ))}
        </ScrollView>
      )}

      {/* Error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.ctaBtn, !canCommit && styles.ctaBtnDisabled]}
        onPress={() => { if (canCommit) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); commit() } }}
        activeOpacity={canCommit ? 0.8 : 1}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color={Colors.accentOn} />
            <Text style={styles.ctaBtnText}>Searching…</Text>
          </>
        ) : (
          <>
            <Sparkles size={16} color={canCommit ? Colors.accentOn : Colors.lit3} />
            <Text style={[styles.ctaBtnText, !canCommit && styles.ctaBtnTextDisabled]}>
              {seeds.length < 2
                ? `Pick ${2 - seeds.length} more book${seeds.length === 1 ? '' : 's'}`
                : 'Find My Next Book'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Search filter */}
      <View style={styles.searchWrap}>
        <Search size={15} color={Colors.lit3} />
        <TextInput
          style={styles.searchInput}
          value={filterQuery}
          onChangeText={setFilterQuery}
          placeholder="Filter your read books…"
          placeholderTextColor={Colors.lit3}
          selectionColor={Colors.accent}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {filterQuery.length > 0 && (
          <TouchableOpacity onPress={() => setFilterQuery('')} hitSlop={8}>
            <X size={14} color={Colors.lit3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        Your read books ({readBooks.length})
      </Text>

      {/* Book list */}
      {libLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : readBooks.length === 0 ? (
        <View style={styles.empty}>
          <BookOpen size={32} color={Colors.lit3} />
          <Text style={styles.emptyTitle}>No books marked as read</Text>
          <Text style={styles.emptySub}>
            Mark books as "Read" in your library to use them as seeds.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={ub => String(ub.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: ub }) => (
            <LibraryRow
              userBook={ub}
              isSelected={isSeedById(ub.book?.id ?? null)}
              isDisabled={!canAddMore}
              onPress={() => handleRowPress(ub)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={[styles.emptySub, { textAlign: 'center', marginTop: 20 }]}>
              No books match "{filterQuery}"
            </Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerText: { flex: 1, gap: 2 },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.lit, letterSpacing: -0.3 },
  subtitle:   { fontSize: 12, color: Colors.lit2 },

  // ── Seed pills ─────────────────────────────────────────────────────────────
  pillsRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, maxWidth: 200,
  },
  pillText: { color: Colors.accentOn, fontWeight: '600', fontSize: 13, flex: 1 },

  // ── CTA button ─────────────────────────────────────────────────────────────
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 4, marginBottom: 12,
    height: 52, borderRadius: 16,
    backgroundColor: Colors.accent,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },
  ctaBtnTextDisabled: { color: Colors.lit3 },

  // ── Search ─────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 8,
    paddingHorizontal: 14, height: 44, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.lit, height: 44 },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.lit3,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginBottom: 8,
  },

  // ── Library rows ──────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 16, marginHorizontal: 20,
  },
  rowSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  rowInfo:   { flex: 1, gap: 3 },
  rowTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  rowTitleSelected: { color: Colors.accentOn },
  rowAuthor: { fontSize: 12, color: Colors.lit2 },
  rowAuthorSelected: { color: Colors.accentOn, opacity: 0.8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.accentOn, backgroundColor: Colors.accentOn,
  },

  // ── Result rows ────────────────────────────────────────────────────────────
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  resultTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  resultAuthor: { fontSize: 12, color: Colors.lit2, marginTop: 2 },


  // ── Shared ─────────────────────────────────────────────────────────────────
  list:      { paddingBottom: 40, gap: 8 },
  separator: { height: 8 },
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.lit2, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: Colors.lit3, textAlign: 'center', lineHeight: 18 },
  resetBtn: {
    marginTop: 12, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.surface,
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },

  errorText: {
    marginHorizontal: 20, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, fontSize: 13, color: Colors.lit2,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },

  // ── Searching row (results view) ───────────────────────────────────────────
  searchingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  searchingText: { fontSize: 13, color: Colors.lit3 },
})
