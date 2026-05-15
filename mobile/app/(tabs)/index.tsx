'use strict'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View, Text, ScrollView, Image,
  TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Animated, Alert,
  useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useAuth, useUserLibrary, useFeed, useMilestones,
} from '@book-app/shared'
import type { FeedEntry } from '@book-app/shared'
import * as Haptics from 'expo-haptics'
import { Search, BookOpen, Rss, Zap, CheckCircle, Bookmark, ChevronRight } from 'lucide-react-native'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import FeedCard from '@/components/FeedCard'
import BookProgressSheet from '@/components/BookProgressSheet'
import ReadingGoalModal from '@/components/ReadingGoalModal'
import { Colors } from '@/constants/colors'
import type { UserBook } from '@book-app/shared'

// ── Feed date grouping ────────────────────────────────────────────────────────

interface DateGroup {
  label: string
  newCount: number
  entries: FeedEntry[]
}

function groupByDate(entries: FeedEntry[]): DateGroup[] {
  const now          = Date.now()
  const todayStr     = new Date(now).toDateString()
  const yesterdayStr = new Date(now - 86_400_000).toDateString()
  const weekAgo      = now - 7 * 86_400_000

  const groupMap:   Record<string, FeedEntry[]> = {}
  const groupOrder: string[] = []

  for (const entry of entries) {
    const d  = new Date(entry.created_at)
    const ds = d.toDateString()
    const label =
      ds === todayStr     ? 'Today' :
      ds === yesterdayStr ? 'Yesterday' :
      d.getTime() > weekAgo ? 'This week' : 'Earlier'

    if (!groupMap[label]) {
      groupMap[label] = []
      groupOrder.push(label)
    }
    groupMap[label].push(entry)
  }

  return groupOrder.map((label) => ({
    label,
    newCount: groupMap[label].filter((e) => e.new).length,
    entries:  groupMap[label],
  }))
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ label, newCount }: { label: string; newCount: number }) {
  return (
    <View style={sepStyles.row}>
      <View style={sepStyles.line} />
      <View style={sepStyles.labelWrap}>
        <Text style={sepStyles.label}>{label}</Text>
        {newCount > 0 && (
          <View style={sepStyles.badge}>
            <Text style={sepStyles.badgeText}>{newCount} new</Text>
          </View>
        )}
      </View>
      <View style={sepStyles.line} />
    </View>
  )
}

// ── Currently Reading Hero ────────────────────────────────────────────────────

function ReadingHero({
  userBook,
  onUpdatePress,
}: {
  userBook: UserBook
  onUpdatePress: () => void
}) {
  const router = useRouter()
  const book   = userBook.book!
  const pct    = userBook.completion_percentage ?? 0
  const pRead  = userBook.pages_read ?? 0
  const total  = userBook.total_pages ?? book.page_count

  return (
    <TouchableOpacity
      style={styles.hero}
      activeOpacity={0.92}
      onPress={() => router.push(`/book/${book.google_books_id ?? book.id}`)}
      accessibilityLabel={`Currently reading: ${book.title} by ${book.author_name}. ${pct}% complete. Tap to view book.`}
      accessibilityRole="button"
    >
      {/* Blurred cover as background */}
      {book.cover_image_url && (
        <Image
          source={{ uri: book.cover_image_url }}
          style={styles.heroBgImage}
          blurRadius={22}
        />
      )}
      {/* Dark scrim over blur */}
      <View style={styles.heroScrim} />

      {/* Label */}
      <View style={styles.heroLabel}>
        <BookOpen size={11} color={Colors.accent} />
        <Text style={styles.heroLabelText}>CURRENTLY READING</Text>
      </View>

      {/* Large centered cover */}
      <View style={styles.heroCoverWrap}>
        <BookCover
          uri={book.cover_image_url}
          title={book.title}
          author={book.author_name}
          width={130}
          borderRadius={14}
          style={styles.heroCoverShadow}
        />
      </View>

      {/* Title + author */}
      <View style={styles.heroMeta}>
        <Text style={styles.heroTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.heroAuthor} numberOfLines={1}>by {book.author_name}</Text>
      </View>

      {/* Progress — show pages if total is known, otherwise percentage only */}
      <View style={styles.heroProgress}>
        <ProgressBar percent={pct} height={4} />
        <View style={styles.heroProgressRow}>
          {total ? (
            <Text style={styles.heroProgressText}>p. {pRead} / {total}</Text>
          ) : (
            <Text style={styles.heroProgressText}>{pct}% complete</Text>
          )}
          {total > 0 && (
            <Text style={styles.heroProgressPct}>{pct}%</Text>
          )}
        </View>
      </View>

      {/* Update button */}
      <TouchableOpacity
        style={styles.heroBtn}
        onPress={(e) => {
          e.stopPropagation?.()
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          onUpdatePress()
        }}
        activeOpacity={0.85}
        accessibilityLabel="Update reading progress"
        accessibilityRole="button"
      >
        <Text style={styles.heroBtnText}>Update</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Empty reading state ───────────────────────────────────────────────────────

function EmptyHero({ name }: { name?: string }) {
  const router = useRouter()
  return (
    <View style={styles.emptyHero}>
      <View style={styles.heroGlow} pointerEvents="none" />
      <Text style={styles.emptyHeroGreet}>Welcome, {name || 'reader'} 👋</Text>
      <Text style={styles.emptyHeroTitle}>What are you reading right now?</Text>
      <TouchableOpacity
        style={styles.emptyHeroBtn}
        onPress={() => router.push('/(tabs)/search')}
        activeOpacity={0.8}
        accessibilityLabel="Find a book to start reading"
        accessibilityRole="button"
      >
        <Search size={16} color={Colors.lit2} />
        <Text style={styles.emptyHeroBtnText}>Find a book to start…</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Shimmer skeleton for hero loading state ───────────────────────────────────

function SkeletonHero() {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-360, 360],
  })

  return (
    <View style={[styles.heroSkeleton, { overflow: 'hidden' }]}>
      {/* Shimmer bars */}
      <View style={skeletonStyles.coverPlaceholder} />
      <View style={skeletonStyles.titleBar} />
      <View style={skeletonStyles.subtitleBar} />
      <View style={skeletonStyles.progressBar} />
      <View style={skeletonStyles.btnBar} />
      {/* Moving sheen */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.055)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  coverPlaceholder: {
    width: 120, height: 160, borderRadius: 12,
    backgroundColor: Colors.grove, alignSelf: 'center',
  },
  titleBar: {
    height: 16, borderRadius: 8, backgroundColor: Colors.grove,
    marginHorizontal: 24, marginTop: 16,
  },
  subtitleBar: {
    height: 12, borderRadius: 8, backgroundColor: Colors.grove,
    marginHorizontal: 48, marginTop: 8, opacity: 0.7,
  },
  progressBar: {
    height: 6, borderRadius: 3, backgroundColor: Colors.grove,
    marginHorizontal: 24, marginTop: 20,
  },
  btnBar: {
    height: 44, borderRadius: 12, backgroundColor: Colors.grove,
    marginHorizontal: 24, marginTop: 16,
  },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user }  = useAuth()
  const router    = useRouter()
  const insets    = useSafeAreaInsets()

  const { groupedLibrary, loading: libLoading, refresh: refreshLib } = useUserLibrary(user?.id)
  const {
    entries, loading: feedLoading, error: feedError,
    isEmpty: feedIsEmpty, newCount,
    fetchFeed, markViewed,
  } = useFeed()
  const { readingGoal, setGoal, isLoading: goalSaving } = useMilestones()

  const [progressTarget, setProgressTarget] = useState<UserBook | null>(null)
  const [refreshing, setRefreshing]          = useState(false)
  const [goalModalOpen, setGoalModalOpen]    = useState(false)
  const [goalInput,     setGoalInput]        = useState('')
  // Tracks whether markViewed has been called for the current screen focus session.
  const viewedRef = useRef(false)

  const FEED_PREVIEW  = 6
  const UP_NEXT_LIMIT = 3

  // 40 = horizontal content padding (20 each side), 24 = 2 gaps of 12 between 3 columns
  const { width: windowWidth } = useWindowDimensions()
  const upNextCoverWidth = Math.floor((windowWidth - 40 - 24) / 3)

  const readingBooks = groupedLibrary?.reading  ?? []
  const toReadBooks  = groupedLibrary?.to_read  ?? []
  const completedCnt = groupedLibrary?.read?.length ?? 0

  const handleSaveGoal = async () => {
    const n = parseInt(goalInput, 10)
    if (isNaN(n) || n < 1) {
      Alert.alert('Invalid goal', 'Please enter a number greater than 0.')
      return
    }
    await setGoal(n)
    setGoalModalOpen(false)
  }

  const todayStr       = new Date().toDateString()
  const groupedEntries = useMemo(
    () => groupByDate(entries.slice(0, FEED_PREVIEW)),
    [entries, todayStr],
  )

  // Initial feed load
  useEffect(() => { fetchFeed(1) }, [fetchFeed])

  // Mark the feed as viewed only when the screen is actually focused by the user.
  // Using useFocusEffect prevents the badge from clearing during background tab init.
  useFocusEffect(
    useCallback(() => {
      if (!viewedRef.current && entries.length > 0) {
        viewedRef.current = true
        markViewed()
      }
    }, [entries, markViewed])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refreshLib(), fetchFeed(1)])
    setRefreshing(false)
  }, [refreshLib, fetchFeed])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.greetingName}>
          {user?.display_name || user?.username || 'reader'}
        </Text>
      </View>

      {/* Currently Reading hero(s) — one card per in-progress book */}
      {libLoading && readingBooks.length === 0 ? (
        <SkeletonHero />
      ) : readingBooks.length > 0 ? (
        readingBooks.map((ub) => (
          <ReadingHero
            key={String(ub.id)}
            userBook={ub}
            onUpdatePress={() => setProgressTarget(ub)}
          />
        ))
      ) : (
        <EmptyHero name={user?.display_name || user?.username} />
      )}

      {/* ── Reading Goal ─────────────────────────────────────────────────── */}
      {!libLoading && (
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => { setGoalInput(readingGoal ? String(readingGoal) : ''); setGoalModalOpen(true) }}
          activeOpacity={0.85}
        >
          {(() => {
            const year       = new Date().getFullYear()
            const pct        = readingGoal ? Math.min(100, Math.round((completedCnt / readingGoal) * 100)) : 0
            const isComplete = !!readingGoal && completedCnt >= readingGoal
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
                    <Text style={styles.goalAction}>{readingGoal ? 'Edit' : 'Set →'}</Text>
                  )}
                </View>

                {readingGoal ? (
                  <>
                    <View style={styles.goalCountRow}>
                      <Text style={styles.goalCountDone}>{completedCnt}</Text>
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
      )}

      {/* ── Up Next ───────────────────────────────────────────────────────── */}
      {toReadBooks.length > 0 && (
        <View style={styles.upNextSection}>
          <View style={styles.upNextHeader}>
            <View style={styles.upNextHeaderLeft}>
              <Bookmark size={15} color={Colors.accent} />
              <Text style={styles.upNextTitle}>Up Next</Text>
            </View>
            {toReadBooks.length > UP_NEXT_LIMIT && (
              <TouchableOpacity
                style={styles.upNextSeeAll}
                onPress={() => router.push('/shelf/to_read' as any)}
                hitSlop={8}
              >
                <Text style={styles.upNextSeeAllText}>See all</Text>
                <ChevronRight size={13} color={Colors.lit3} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.upNextRow}>
            {toReadBooks.slice(0, UP_NEXT_LIMIT).map((ub: UserBook) => {
              const book = ub.book!
              return (
                <TouchableOpacity
                  key={String(ub.id)}
                  style={styles.upNextItem}
                  onPress={() => router.push(`/book/${book.google_books_id ?? book.id}` as any)}
                  activeOpacity={0.8}
                >
                  <BookCover
                    uri={book.cover_image_url}
                    title={book.title}
                    author={book.author_name}
                    width={upNextCoverWidth}
                    borderRadius={12}
                  />
                  <Text style={styles.upNextBookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.upNextBookAuthor} numberOfLines={1}>{book.author_name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* ── Activity feed — infinite scroll with date groups ─────────────── */}
      <View style={styles.feedSection}>
        {/* Section header */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Activity</Text>
          {newCount > 0 && (
            <View style={styles.newCountBadge}>
              <Zap size={9} color={Colors.accentOn} />
              <Text style={styles.newCountText}>
                {newCount > 9 ? '9+' : String(newCount)} new
              </Text>
            </View>
          )}
        </View>

        {/* Error */}
        {feedError && feedIsEmpty ? (
          <TouchableOpacity style={styles.feedErrorBanner} onPress={() => fetchFeed(1)}>
            <Text style={styles.feedErrorText}>{feedError} — tap to retry</Text>
          </TouchableOpacity>

        /* First-load spinner */
        ) : feedLoading && feedIsEmpty ? (
          <View style={styles.feedLoader}>
            <ActivityIndicator color={Colors.accent} />
          </View>

        /* Empty state */
        ) : feedIsEmpty ? (
          <View style={styles.feedEmpty}>
            <View style={styles.feedEmptyIconWrap}>
              <Rss size={22} color={Colors.accent} />
            </View>
            <Text style={styles.feedEmptyHeading}>Your feed is empty</Text>
            <Text style={styles.feedEmptyText}>
              Follow people to see what they're reading, their reviews, and shelf updates.
            </Text>
            <TouchableOpacity
              style={styles.feedEmptyCta}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
              accessibilityLabel="Discover books and people"
              accessibilityRole="button"
            >
              <Text style={styles.feedEmptyCtaText}>Explore Discover →</Text>
            </TouchableOpacity>
          </View>

        /* Preview feed */
        ) : (
          <>
            {groupedEntries.map((group) => (
              <View key={group.label}>
                <DateSeparator label={group.label} newCount={group.newCount} />
                {group.entries.map((entry) => (
                  <FeedCard key={entry.id} entry={entry} variant="default" />
                ))}
              </View>
            ))}

            {/* See all button */}
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/feed' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllBtnText}>See all activity</Text>
              <Text style={styles.seeAllArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ReadingGoalModal
        visible={goalModalOpen}
        value={goalInput}
        onChangeValue={setGoalInput}
        onSave={handleSaveGoal}
        onClose={() => setGoalModalOpen(false)}
        saving={goalSaving}
      />

      {/* Progress sheet */}
      {progressTarget && progressTarget.book && (
        <BookProgressSheet
          visible={!!progressTarget}
          userBook={progressTarget}
          book={progressTarget.book}
          onClose={() => setProgressTarget(null)}
          onSaved={() => { setProgressTarget(null); refreshLib() }}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.canvas },
  content:      { padding: 20, paddingBottom: 40, gap: 20 },

  greetingBlock: { gap: 2, marginBottom: 4 },
  greeting:      { fontSize: 16, color: Colors.lit2 },
  greetingName:  { fontSize: 28, fontWeight: '700', color: Colors.lit, letterSpacing: -0.5 },

  // Hero
  hero: {
    borderRadius: 24,
    backgroundColor: '#0F2011',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.rim,
    padding: 20,
    gap: 16,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    opacity: 0.35,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,26,15,0.55)',
  },
  heroLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center',
  },
  heroLabelText:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.accent },
  heroCoverWrap:    { alignItems: 'center' },
  heroCoverShadow:  {
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  heroMeta:         { alignItems: 'center', gap: 4 },
  heroTitle:        { fontSize: 17, fontWeight: '700', color: Colors.lit, lineHeight: 23, textAlign: 'center' },
  heroAuthor:       { fontSize: 13, color: Colors.lit2, fontStyle: 'italic', textAlign: 'center' },
  heroProgress:     { gap: 6 },
  heroProgressRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgressText: { fontSize: 11, color: Colors.lit2 },
  heroProgressPct:  { fontSize: 11, fontWeight: '700', color: Colors.accent },
  heroBtn: {
    height: 48, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accentOn },

  // Empty hero
  emptyHero: {
    borderRadius: 24, backgroundColor: '#0F2011',
    padding: 24, gap: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.rim,
  },
  emptyHeroGreet:  { fontSize: 13, color: Colors.lit2 },
  emptyHeroTitle:  { fontSize: 20, fontWeight: '700', color: Colors.lit, lineHeight: 26 },
  emptyHeroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.grove, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.rim, marginTop: 6,
  },
  emptyHeroBtnText: { fontSize: 14, color: Colors.lit2 },

  // Skeleton
  heroSkeleton: {
    height: 340, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 20, gap: 0, justifyContent: 'center',
  },

  // Feed section
  feedSection: { gap: 0, marginTop: 12 },
  feedHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 4,
  },
  feedTitle:    { fontSize: 20, fontWeight: '800', color: Colors.lit, letterSpacing: -0.3 },
  newCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  newCountText: { fontSize: 10, fontWeight: '700', color: Colors.accentOn },
  // Reading goal card
  goalCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  goalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTitle:    { fontSize: 13, fontWeight: '700', color: Colors.lit },
  goalYear:     { fontWeight: '500', color: Colors.lit2 },
  goalAction:   { fontSize: 12, fontWeight: '700', color: Colors.accent },
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
  goalPct:           { fontSize: 14, fontWeight: '700', color: Colors.accent },
  goalPctComplete:   { color: Colors.success },
  goalBarTrack:      { height: 8, borderRadius: 4, backgroundColor: Colors.grove, overflow: 'hidden' },
  goalBarFill:       { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  goalBarFillComplete: { backgroundColor: Colors.success },
  goalCta:       { fontSize: 13, color: Colors.lit2, lineHeight: 18 },

  // Up Next
  upNextSection: { gap: 12 },
  upNextHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upNextHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  upNextTitle:   { fontSize: 18, fontWeight: '700', color: Colors.lit },
  upNextSeeAll:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  upNextSeeAllText: { fontSize: 13, color: Colors.lit2 },
  upNextRow:     { flexDirection: 'row', gap: 12 },
  upNextItem:    { flex: 1, gap: 6 },
  upNextBookTitle:  { fontSize: 12, fontWeight: '600', color: Colors.lit, lineHeight: 16 },
  upNextBookAuthor: { fontSize: 11, color: Colors.lit3 },

  feedLoader: { paddingVertical: 32, alignItems: 'center' },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  seeAllBtnText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
  seeAllArrow:   { fontSize: 14, color: Colors.accent },
  feedErrorBanner: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
    marginBottom: 8,
  },
  feedErrorText: { fontSize: 13, color: Colors.lit2, textAlign: 'center' },
  feedEmpty: {
    borderRadius: 20, padding: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', gap: 10,
  },
  feedEmptyIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  feedEmptyHeading: {
    fontSize: 16, fontWeight: '700', color: Colors.lit, textAlign: 'center',
  },
  feedEmptyText: { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },
  feedEmptyCta: {
    marginTop: 6,
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  feedEmptyCtaText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },
})

const sepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.rim,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.lit3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: `${Colors.accent}28`,
    borderWidth: 1,
    borderColor: `${Colors.accent}55`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
  },
})
