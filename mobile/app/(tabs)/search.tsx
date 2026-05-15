import { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  ScrollView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useBookSearch, useBooksStore, useAuth } from '@book-app/shared'
import { apiClient } from '@book-app/shared/api/client'
import type { Book, UserBook, User } from '@book-app/shared'
import {
  Search, X, Plus, Check, ArrowLeft,
  BookOpen, Heart, Zap, Clock, User2, Brain,
  Baby, Plane, UtensilsCrossed, Briefcase, Trophy,
  Camera, Music, Feather, Globe, Palette, Smile,
  FlameKindling, Microscope, Landmark, CalendarDays,
  ChevronRight, UserPlus, UserCheck, ScanLine,
} from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import BookProgressSheet from '@/components/BookProgressSheet'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import { Colors } from '@/constants/colors'
import { API_BASE_URL } from '@/constants/config'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BisacCategory {
  code:          string
  name:          string
  parent_code:   string | null
  color:         string
  display_order: number
  book_count:    number
  stale:         boolean
}

interface ShelfBook {
  google_books_id: string
  title:           string
  author_name:     string | null
  cover_image_url: string | null
  description:     string | null
  published_date:  string | null
  average_rating:  number | null
  ratings_count:   number
  page_count:      number | null
  rank:            number
}

type Segment = 'books' | 'people'

// ── Genre icon picker ─────────────────────────────────────────────────────────

function GenreIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
  const n = name.toLowerCase()
  if (n.includes('romance') || n.includes('love'))                           return <Heart            size={size} color={color} />
  if (n.includes('mystery') || n.includes('thriller') || n.includes('crime')) return <Search          size={size} color={color} />
  if (n.includes('science fiction') || n.includes('sci-fi') || n.includes('fantasy')) return <Zap    size={size} color={color} />
  if (n.includes('history') || n.includes('historical'))                     return <Clock            size={size} color={color} />
  if (n.includes('biography') || n.includes('memoir') || n.includes('auto'))return <User2            size={size} color={color} />
  if (n.includes('self') || n.includes('personal dev') || n.includes('psychology')) return <Brain    size={size} color={color} />
  if (n.includes('child') || n.includes('young adult') || n.includes('juvenile')) return <Baby       size={size} color={color} />
  if (n.includes('travel') || n.includes('geography'))                       return <Plane            size={size} color={color} />
  if (n.includes('cook') || n.includes('food') || n.includes('culinary'))   return <UtensilsCrossed  size={size} color={color} />
  if (n.includes('business') || n.includes('economics') || n.includes('finance') || n.includes('invest')) return <Briefcase size={size} color={color} />
  if (n.includes('sport') || n.includes('fitness') || n.includes('health') || n.includes('wellness')) return <Trophy size={size} color={color} />
  if (n.includes('art') || n.includes('photo') || n.includes('design') || n.includes('architect'))    return <Camera size={size} color={color} />
  if (n.includes('music'))                                                    return <Music            size={size} color={color} />
  if (n.includes('poetry') || n.includes('drama') || n.includes('play'))    return <Feather          size={size} color={color} />
  if (n.includes('political') || n.includes('social science') || n.includes('current')) return <Globe size={size} color={color} />
  if (n.includes('comic') || n.includes('graphic'))                          return <Palette          size={size} color={color} />
  if (n.includes('humor') || n.includes('comedy') || n.includes('satire'))  return <Smile            size={size} color={color} />
  if (n.includes('horror') || n.includes('occult') || n.includes('dark'))   return <FlameKindling    size={size} color={color} />
  if (n.includes('science') || n.includes('nature') || n.includes('environment')) return <Microscope size={size} color={color} />
  if (n.includes('religion') || n.includes('spirit') || n.includes('philosophy')) return <Landmark   size={size} color={color} />
  return <BookOpen size={size} color={color} />
}

// ── Segment toggle ────────────────────────────────────────────────────────────

function SegmentToggle({ active, onChange }: { active: Segment; onChange: (s: Segment) => void }) {
  return (
    <View style={seg.wrap}>
      {(['books', 'people'] as Segment[]).map((s) => (
        <TouchableOpacity
          key={s}
          style={[seg.btn, active === s && seg.btnActive]}
          onPress={() => { Haptics.selectionAsync(); onChange(s) }}
          activeOpacity={0.8}
        >
          <Text style={[seg.label, active === s && seg.labelActive]}>
            {s === 'books' ? 'Books' : 'People'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
const seg = StyleSheet.create({
  wrap:       {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.rim,
    marginHorizontal: 20, marginBottom: 10, padding: 3,
  },
  btn:        { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  btnActive:  { backgroundColor: Colors.grove },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
  labelActive:{ color: Colors.lit },
})

// ── User avatar initials ──────────────────────────────────────────────────────

function UserAvatar({ user, size = 44 }: { user: User; size?: number }) {
  const initials = (user.display_name ?? user.username)
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={[ua.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[ua.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  )
}
const ua = StyleSheet.create({
  circle:   { backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.accent, fontWeight: '700' },
})

// ── Follow button ─────────────────────────────────────────────────────────────

function FollowBtn({
  following,
  onPress,
  loading,
}: {
  following: boolean
  onPress: () => void
  loading: boolean
}) {
  return (
    <TouchableOpacity
      style={[fb.btn, following ? fb.btnFollowing : fb.btnFollow]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      hitSlop={8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={following ? Colors.lit2 : Colors.accentOn} />
      ) : following ? (
        <><UserCheck size={14} color={Colors.lit2} /><Text style={[fb.label, fb.labelFollowing]}>Following</Text></>
      ) : (
        <><UserPlus size={14} color={Colors.accentOn} /><Text style={fb.label}>Follow</Text></>
      )}
    </TouchableOpacity>
  )
}
const fb = StyleSheet.create({
  btn:            {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  btnFollow:      { backgroundColor: Colors.accent },
  btnFollowing:   { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  label:          { fontSize: 12, fontWeight: '700', color: Colors.accentOn },
  labelFollowing: { color: Colors.lit2 },
})

// ── People result row ─────────────────────────────────────────────────────────

function PeopleRow({
  user,
  onPress,
}: {
  user: User
  onPress: () => void
}) {
  const [following, setFollowing] = useState(false)
  const [followId,  setFollowId]  = useState<number | null>(null)
  const [loading,   setLoading]   = useState(false)

  const handleToggle = useCallback(async () => {
    setLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      if (following && followId) {
        await apiClient.unfollow(followId)
        setFollowing(false)
        setFollowId(null)
      } else {
        const follow = await apiClient.follow('User', user.id)
        setFollowing(true)
        setFollowId(follow.id)
      }
    } catch {}
    setLoading(false)
  }, [following, followId, user.id])

  return (
    <TouchableOpacity style={pr.wrap} onPress={onPress} activeOpacity={0.75}>
      <UserAvatar user={user} size={46} />
      <View style={pr.text}>
        <Text style={pr.name} numberOfLines={1}>
          {user.display_name ?? user.username}
        </Text>
        <Text style={pr.handle} numberOfLines={1}>@{user.username}</Text>
      </View>
      <FollowBtn following={following} onPress={handleToggle} loading={loading} />
    </TouchableOpacity>
  )
}
const pr = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 20 },
  text:   { flex: 1 },
  name:   { fontSize: 14, fontWeight: '600', color: Colors.lit, marginBottom: 2 },
  handle: { fontSize: 12, color: Colors.lit2 },
})

// ── People search panel ───────────────────────────────────────────────────────

function PeoplePanel({ query, currentUserId }: { query: string; currentUserId: number | undefined }) {
  const router = useRouter()
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setUsers([]); setLoading(false); return }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { users: results } = await apiClient.searchUsers(query.trim(), 1, 30)
        setUsers(results.filter((u) => u.id !== currentUserId))
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, currentUserId])

  if (!query.trim()) {
    return (
      <View style={pp.hint}>
        <View style={pp.hintIcon}>
          <User2 size={26} color={Colors.accent} strokeWidth={1.5} />
        </View>
        <Text style={pp.hintTitle}>Find readers</Text>
        <Text style={pp.hintSub}>Search by name or username to find and add friends.</Text>
      </View>
    )
  }

  if (loading) {
    return <View style={pp.loader}><ActivityIndicator color={Colors.accent} /></View>
  }

  if (users.length === 0) {
    return (
      <View style={pp.hint}>
        <Text style={pp.hintTitle}>No results for "{query}"</Text>
        <Text style={pp.hintSub}>Try a different name or username.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => String(u.id)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={pp.sep} />}
      renderItem={({ item }) => (
        <PeopleRow
          user={item}
          onPress={() => router.push(`/users/${item.id}` as any)}
        />
      )}
    />
  )
}
const pp = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sep:    { height: StyleSheet.hairlineWidth, backgroundColor: Colors.rim, marginLeft: 78 },
  hint:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40, paddingBottom: 60 },
  hintIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  hintTitle: { fontSize: 15, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  hintSub:   { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },
})

// ── Book search result row ────────────────────────────────────────────────────

function SearchResultItem({
  book, onPress, onAdd, adding, added,
}: {
  book: Book; onPress: () => void; onAdd: () => void
  adding: boolean; added: boolean
}) {
  return (
    <TouchableOpacity style={styles.result} onPress={onPress} activeOpacity={0.8}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name}
        width={52}
        borderRadius={8}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.resultAuthor} numberOfLines={1}>{book.author_name}</Text>
        )}
        {book.release_date && (
          <Text style={styles.resultYear}>{new Date(book.release_date).getFullYear()}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, added && styles.addBtnAdded]}
        onPress={onAdd}
        disabled={adding || added}
        hitSlop={8}
        accessibilityLabel={added ? `${book.title} already in library` : `Add ${book.title} to library`}
        accessibilityRole="button"
      >
        {adding
          ? <ActivityIndicator size="small" color={Colors.accentOn} />
          : added
          ? <Check size={14} color={Colors.accentOn} />
          : <Plus size={14} color={Colors.accentOn} />}
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Shelf book tile ───────────────────────────────────────────────────────────

function ShelfBookItem({
  book, onPress, onAdd, adding, added,
}: {
  book: ShelfBook; onPress: () => void; onAdd: () => void
  adding: boolean; added: boolean
}) {
  return (
    <TouchableOpacity style={styles.shelfBook} onPress={onPress} activeOpacity={0.8}>
      <BookCover
        uri={book.cover_image_url}
        title={book.title}
        author={book.author_name ?? ''}
        width={100}
        borderRadius={10}
      />
      <View style={styles.shelfBookInfo}>
        <Text style={styles.shelfBookTitle} numberOfLines={2}>{book.title}</Text>
        {book.author_name && (
          <Text style={styles.shelfBookAuthor} numberOfLines={1}>{book.author_name}</Text>
        )}
        {book.published_date && (
          <Text style={styles.shelfBookYear}>{book.published_date.slice(0, 4)}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, added && styles.addBtnAdded]}
        onPress={onAdd}
        disabled={adding || added}
        hitSlop={8}
        accessibilityLabel={added ? `${book.title} already in library` : `Add ${book.title} to library`}
        accessibilityRole="button"
      >
        {adding
          ? <ActivityIndicator size="small" color={Colors.accentOn} />
          : added
          ? <Check size={14} color={Colors.accentOn} />
          : <Plus size={14} color={Colors.accentOn} />}
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Subcategory chip bar ──────────────────────────────────────────────────────

function SubcategoryChips({
  parent, subs, activeCode, onSelect,
}: {
  parent: BisacCategory; subs: BisacCategory[]
  activeCode: string; onSelect: (code: string) => void
}) {
  if (subs.length === 0) return null

  const chips = [
    { code: parent.code, name: 'All' },
    ...subs.map(s => ({ code: s.code, name: s.name })),
  ]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map(chip => {
        const active = chip.code === activeCode
        return (
          <TouchableOpacity
            key={chip.code}
            style={[
              styles.chip,
              active
                ? { backgroundColor: parent.color, borderColor: parent.color }
                : { backgroundColor: Colors.surface, borderColor: Colors.rim },
            ]}
            onPress={() => onSelect(chip.code)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {chip.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { q } = useLocalSearchParams<{ q?: string }>()

  const [segment, setSegment] = useState<Segment>('books')

  const { books, loading, query, setQuery, loadMore, hasMore } = useBookSearch({
    debounceMs: 500,
    initialQuery: q ?? '',
  })

  const [sheetBook,     setSheetBook]     = useState<Book | null>(null)
  const [sheetUserBook, setSheetUserBook] = useState<UserBook | null>(null)
  const [added,         setAdded]         = useState<Set<string | number>>(new Set())
  const [scannerVisible, setScannerVisible] = useState(false)

  const userBooks  = useBooksStore(state => state.userBooks)
  const libraryIds = new Set(
    Object.values(userBooks).map(ub => ub.book?.google_books_id).filter(Boolean) as string[]
  )
  const isInLibrary = (googleId: string | undefined | null) =>
    !!googleId && (libraryIds.has(googleId) || added.has(googleId))

  const findUserBook = (googleId: string): UserBook | null =>
    Object.values(useBooksStore.getState().userBooks)
      .find(ub => ub.book?.google_books_id === googleId) ?? null

  const openSheet = useCallback((book: Book) => {
    const existing = book.google_books_id ? findUserBook(book.google_books_id) : null
    setSheetBook(book)
    setSheetUserBook(existing)
  }, [])

  const closeSheet  = useCallback(() => { setSheetBook(null); setSheetUserBook(null) }, [])
  const onSheetSaved = useCallback(() => {
    if (sheetBook?.google_books_id) {
      setAdded(prev => new Set(prev).add(sheetBook.google_books_id!))
    }
  }, [sheetBook])

  // ── Category state ────────────────────────────────────────────────────────
  const [topLevel,     setTopLevel]     = useState<BisacCategory[]>([])
  const [subsByParent, setSubsByParent] = useState<Record<string, BisacCategory[]>>({})
  const [catsLoading,  setCatsLoading]  = useState(true)
  const [selectedParent, setSelectedParent] = useState<BisacCategory | null>(null)
  const [activeCode,     setActiveCode]     = useState<string>('')
  const [shelfBooks,     setShelfBooks]     = useState<ShelfBook[]>([])
  const [shelfLoading,   setShelfLoading]   = useState(false)
  const [shelfError,     setShelfError]     = useState<string | null>(null)
  const [visibleCount,   setVisibleCount]   = useState(40)
  const PAGE_SIZE = 40
  const shelfCache = useRef<Map<string, ShelfBook[]>>(new Map())

  useEffect(() => {
    ;(async () => {
      setCatsLoading(true)
      try {
        const res  = await fetch(`${API_BASE_URL}/bisac_categories`)
        const data = await res.json()
        const all: BisacCategory[] = data.categories ?? []
        const top  = all.filter(c => c.parent_code == null && c.code !== 'TRD000000')
        const subs = all.filter(c => c.parent_code != null)
        const byParent: Record<string, BisacCategory[]> = {}
        for (const s of subs) {
          if (!byParent[s.parent_code!]) byParent[s.parent_code!] = []
          byParent[s.parent_code!].push(s)
        }
        setTopLevel(top)
        setSubsByParent(byParent)
      } catch {
        setTopLevel([])
      } finally {
        setCatsLoading(false)
      }
    })()
  }, [])

  const loadShelf = useCallback(async (code: string) => {
    if (shelfCache.current.has(code)) {
      setShelfBooks(shelfCache.current.get(code)!)
      setShelfLoading(false)
      setShelfError(null)
      return
    }
    setShelfLoading(true)
    setShelfError(null)
    try {
      const res  = await fetch(`${API_BASE_URL}/bisac_categories/${code}/books`)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      const fetched: ShelfBook[] = data.books ?? []
      shelfCache.current.set(code, fetched)
      setShelfBooks(fetched)
    } catch {
      setShelfError('Could not load books. Tap to retry.')
    } finally {
      setShelfLoading(false)
    }
  }, [])

  const handleParentSelect = useCallback((category: BisacCategory) => {
    Haptics.selectionAsync()
    setSelectedParent(category)
    setActiveCode(category.code)
    setVisibleCount(40)
    loadShelf(category.code)
  }, [loadShelf])

  const handleChipSelect = useCallback((code: string) => {
    if (code === activeCode) return
    Haptics.selectionAsync()
    setActiveCode(code)
    setVisibleCount(40)
    loadShelf(code)
  }, [activeCode, loadShelf])

  const clearParent = useCallback(() => {
    setSelectedParent(null)
    setActiveCode('')
    setShelfBooks([])
    setShelfError(null)
    setVisibleCount(40)
  }, [])

  const handleSegmentChange = (s: Segment) => {
    setSegment(s)
    setQuery('')
    clearParent()
  }

  const isSearching = query.length > 0
  const activeSubs  = selectedParent ? (subsByParent[selectedParent.code] ?? []) : []

  // Header title: in people mode always "Discover", in books mode use category name if selected
  const headerTitle = segment === 'people'
    ? 'Discover'
    : (selectedParent && !isSearching ? selectedParent.name : 'Discover')

  const bookPlaceholder = segment === 'books'
    ? 'Title, author, or ISBN…'
    : 'Search people by name or username…'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {segment === 'books' && selectedParent && !isSearching ? (
          <TouchableOpacity style={styles.backBtn} onPress={clearParent} hitSlop={8} activeOpacity={0.7}>
            <ArrowLeft size={18} color={Colors.lit} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{headerTitle}</Text>
          {!selectedParent && !isSearching && (
            <Text style={styles.subtitle}>
              {segment === 'books' ? 'Search or browse by category' : 'Find readers to follow and connect with'}
            </Text>
          )}
        </View>
      </View>

      {/* ── Segment toggle ──────────────────────────────────────────────────── */}
      <SegmentToggle active={segment} onChange={handleSegmentChange} />

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Search size={16} color={Colors.lit3} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={v => {
            setQuery(v)
            if (v.length > 0 && segment === 'books') clearParent()
          }}
          placeholder={bookPlaceholder}
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
        {segment === 'books' && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScannerVisible(true) }}
            hitSlop={8}
            accessibilityLabel="Scan book barcode"
            accessibilityRole="button"
            style={styles.scanBtn}
          >
            <ScanLine size={18} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── People segment ─────────────────────────────────────────────────── */}
      {segment === 'people' ? (
        <PeoplePanel query={query} currentUserId={user?.id} />

      ) : (
        <>
          {/* ── Subcategory chips ──────────────────────────────────────────── */}
          {selectedParent && !isSearching && activeSubs.length > 0 && (
            <SubcategoryChips
              parent={selectedParent}
              subs={activeSubs}
              activeCode={activeCode}
              onSelect={handleChipSelect}
            />
          )}

          {/* ── Text search results ──────────────────────────────────────────── */}
          {isSearching ? (
            loading && books.length === 0 ? (
              <View style={styles.loader}><ActivityIndicator color={Colors.accent} /></View>
            ) : books.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySub}>Try a different title or author name.</Text>
              </View>
            ) : (
              <FlatList
                data={books}
                keyExtractor={b => String(b.google_books_id ?? b.id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: book }) => (
                  <SearchResultItem
                    book={book}
                    onPress={() => router.push(`/book/${book.google_books_id ?? book.id}`)}
                    onAdd={() => openSheet(book)}
                    adding={false}
                    added={isInLibrary(book.google_books_id)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore ? (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color={Colors.lit3} />
                    </View>
                  ) : null
                }
              />
            )

          /* ── Genre shelf ─────────────────────────────────────────────────── */
          ) : selectedParent ? (
            shelfLoading && shelfBooks.length === 0 ? (
              <View style={styles.loader}><ActivityIndicator color={Colors.accent} /></View>
            ) : shelfError ? (
              <TouchableOpacity style={styles.errorBanner} onPress={() => loadShelf(activeCode)}>
                <Text style={styles.errorText}>{shelfError}</Text>
              </TouchableOpacity>
            ) : shelfBooks.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Coming soon</Text>
                <Text style={styles.emptySub}>We're curating this shelf. Check back shortly.</Text>
              </View>
            ) : (
              <FlatList
                data={shelfBooks.slice(0, visibleCount)}
                keyExtractor={b => b.google_books_id}
                contentContainerStyle={styles.list}
                style={{ opacity: shelfLoading ? 0.45 : 1 }}
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                  if (visibleCount < shelfBooks.length) setVisibleCount(n => n + PAGE_SIZE)
                }}
                onEndReachedThreshold={0.3}
                renderItem={({ item: book }) => (
                  <ShelfBookItem
                    book={book}
                    onPress={() => {
                      useBooksStore.getState().cacheSearchResults([{
                        id: null,
                        title: book.title,
                        author_name: book.author_name ?? undefined,
                        cover_image_url: book.cover_image_url ?? undefined,
                        description: book.description ?? undefined,
                        release_date: book.published_date ?? '',
                        google_books_id: book.google_books_id,
                        page_count: book.page_count ?? undefined,
                        isbn: undefined,
                      }])
                      router.push(`/book/${book.google_books_id}`)
                    }}
                    onAdd={() => openSheet({
                      id: null,
                      title: book.title,
                      author_name: book.author_name ?? undefined,
                      cover_image_url: book.cover_image_url ?? undefined,
                      description: book.description ?? undefined,
                      release_date: book.published_date ?? '',
                      google_books_id: book.google_books_id,
                      page_count: book.page_count ?? undefined,
                    })}
                    adding={false}
                    added={isInLibrary(book.google_books_id)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListFooterComponent={
                  shelfLoading && shelfBooks.length > 0 ? (
                    <View style={styles.loadingMore}><ActivityIndicator size="small" color={Colors.lit3} /></View>
                  ) : null
                }
              />
            )

          /* ── Category grid (idle) ──────────────────────────────────────────── */
          ) : (
            <ScrollView
              contentContainerStyle={styles.categoryGrid}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Upcoming Releases entry card ───────────────────────────── */}
              <TouchableOpacity
                style={styles.upcomingCard}
                onPress={() => {
                  Haptics.selectionAsync()
                  router.push('/upcoming-releases')
                }}
                activeOpacity={0.8}
                accessibilityLabel="Browse upcoming book releases"
                accessibilityRole="button"
              >
                <View style={styles.upcomingCardLeft}>
                  <View style={styles.upcomingIconBox}>
                    <CalendarDays size={22} color="#6BAD8B" />
                  </View>
                  <View style={styles.upcomingCardText}>
                    <Text style={styles.upcomingCardTitle}>Upcoming Releases</Text>
                    <Text style={styles.upcomingCardSub}>Browse by week or month · Filter by genre</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.lit3} />
              </TouchableOpacity>

              {/* ── Browse Categories ──────────────────────────────────────── */}
              <Text style={styles.browseLabel}>Browse Categories</Text>

              {catsLoading ? (
                <View style={styles.gridLoader}><ActivityIndicator color={Colors.accent} /></View>
              ) : topLevel.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No categories yet</Text>
                  <Text style={styles.emptySub}>Check back soon.</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {topLevel.map(category => (
                    <TouchableOpacity
                      key={category.code}
                      style={[styles.categoryTile, { borderColor: `${category.color}40` }]}
                      onPress={() => handleParentSelect(category)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Browse ${category.name}`}
                      accessibilityRole="button"
                    >
                      <View style={[styles.categoryIconWrap, { backgroundColor: `${category.color}22` }]}>
                        <GenreIcon name={category.name} color={category.color} size={20} />
                      </View>
                      <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* ── Sheet ────────────────────────────────────────────────────────────── */}
      {sheetBook && (
        <BookProgressSheet
          visible={!!sheetBook}
          book={sheetBook}
          userBook={sheetUserBook}
          onClose={closeSheet}
          onSaved={onSheetSaved}
        />
      )}

      {/* ── Barcode scanner ──────────────────────────────────────────────────── */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerText: { gap: 2 },
  title:    { fontSize: 26, fontWeight: '700', color: Colors.lit, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.lit2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 10,
    paddingHorizontal: 14, height: 48, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.lit, height: 48 },
  scanBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  chipsRow: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  chipText:       { fontSize: 13, fontWeight: '500', color: Colors.lit2 },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },

  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { paddingHorizontal: 20, paddingBottom: 40 },
  separator:   { height: 1, backgroundColor: Colors.rim },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },

  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  resultInfo:   { flex: 1, gap: 3 },
  resultTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  resultAuthor: { fontSize: 12, color: Colors.lit2 },
  resultYear:   { fontSize: 11, color: Colors.lit2 },

  shelfBook: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  shelfBookInfo:   { flex: 1, gap: 4 },
  shelfBookTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit, lineHeight: 19 },
  shelfBookAuthor: { fontSize: 12, color: Colors.lit2 },
  shelfBookYear:   { fontSize: 11, color: Colors.lit2 },

  addBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addBtnAdded: { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.accent },

  upcomingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: '#4A7C5960',
    padding: 14, marginBottom: 20,
  },
  upcomingCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  upcomingIconBox:   { width: 42, height: 42, borderRadius: 13, backgroundColor: '#4A7C5933', alignItems: 'center', justifyContent: 'center' },
  upcomingCardText:  { flex: 1, gap: 3 },
  upcomingCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.lit },
  upcomingCardSub:   { fontSize: 11, color: Colors.lit3, lineHeight: 15 },

  categoryGrid: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  browseLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.lit2,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  gridLoader: { paddingTop: 40, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryTile: {
    width: '31%', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 6, alignItems: 'flex-start',
  },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 12, fontWeight: '600', color: Colors.lit, lineHeight: 16 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.lit2, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: Colors.lit2, textAlign: 'center' },
  errorBanner: { margin: 20, padding: 14, borderRadius: 14, backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  errorText:   { fontSize: 13, color: Colors.lit2, textAlign: 'center' },
})
