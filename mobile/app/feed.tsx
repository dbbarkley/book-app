import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFeed } from '@book-app/shared'
import type { FeedEntry } from '@book-app/shared'
import { ChevronLeft, Rss, Zap } from 'lucide-react-native'
import FeedCard from '@/components/FeedCard'
import { Colors } from '@/constants/colors'

// ── Date grouping ─────────────────────────────────────────────────────────────

interface DateGroup { label: string; newCount: number; entries: FeedEntry[] }

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

    if (!groupMap[label]) { groupMap[label] = []; groupOrder.push(label) }
    groupMap[label].push(entry)
  }

  return groupOrder.map(label => ({
    label,
    newCount: groupMap[label].filter(e => e.new).length,
    entries:  groupMap[label],
  }))
}

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

// ── Flat row types ─────────────────────────────────────────────────────────────

type Row =
  | { type: 'separator'; label: string; newCount: number; id: string }
  | { type: 'card'; entry: FeedEntry; id: string }

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    entries, pagination, loading, error,
    hasMore, isEmpty, newCount,
    fetchFeed, markViewed,
  } = useFeed()

  const [refreshing, setRefreshing] = useState(false)
  const fetchingRef = useRef(false)
  const todayStr    = new Date().toDateString()

  const grouped = useMemo(() => groupByDate(entries), [entries, todayStr])

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    for (const group of grouped) {
      result.push({ type: 'separator', label: group.label, newCount: group.newCount, id: `sep-${group.label}` })
      for (const entry of group.entries) {
        result.push({ type: 'card', entry, id: entry.id })
      }
    }
    return result
  }, [grouped])

  useEffect(() => {
    if (entries.length === 0) fetchFeed(1)
    markViewed()
  }, [])

  const loadMore = useCallback(() => {
    if (fetchingRef.current || !hasMore || !pagination) return
    fetchingRef.current = true
    fetchFeed(pagination.page + 1).finally(() => { fetchingRef.current = false })
  }, [hasMore, pagination, fetchFeed])

  const onRefresh = useCallback(async () => {
    fetchingRef.current = false
    setRefreshing(true)
    await fetchFeed(1)
    setRefreshing(false)
  }, [fetchFeed])

  const renderItem = useCallback(({ item }: { item: Row }) => {
    if (item.type === 'separator') {
      return <DateSeparator label={item.label} newCount={item.newCount} />
    }
    return <FeedCard entry={item.entry} variant="default" />
  }, [])

  const renderFooter = useCallback(() => {
    if (loading && !isEmpty) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      )
    }
    if (!loading && !hasMore && !isEmpty) {
      return (
        <View style={styles.caughtUpRow}>
          <View style={styles.caughtUpLine} />
          <Text style={styles.caughtUpText}>You're all caught up</Text>
          <View style={styles.caughtUpLine} />
        </View>
      )
    }
    return null
  }, [loading, hasMore, isEmpty])

  const renderEmpty = useCallback(() => {
    if (error) {
      return (
        <TouchableOpacity style={styles.errorBanner} onPress={() => fetchFeed(1)}>
          <Text style={styles.errorText}>{error} — tap to retry</Text>
        </TouchableOpacity>
      )
    }
    if (loading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      )
    }
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Rss size={22} color={Colors.accent} />
        </View>
        <Text style={styles.emptyHeading}>Your feed is empty</Text>
        <Text style={styles.emptyText}>
          Follow people to see what they're reading, their reviews, and shelf updates.
        </Text>
      </View>
    )
  }, [error, loading, fetchFeed])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={20} color={Colors.lit2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activity</Text>
          {newCount > 0 && (
            <View style={styles.badge}>
              <Zap size={9} color={Colors.accentOn} />
              <Text style={styles.badgeText}>{newCount > 9 ? '9+' : String(newCount)} new</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: Colors.lit },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.accentOn },

  content: { paddingHorizontal: 20, paddingTop: 8 },

  errorBanner: {
    margin: 16, padding: 14, borderRadius: 12,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  errorText: { fontSize: 13, color: Colors.lit2, textAlign: 'center' },

  loader: { paddingVertical: 48, alignItems: 'center' },

  empty: {
    margin: 16, padding: 28, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', gap: 10,
  },
  emptyIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyHeading: { fontSize: 16, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  emptyText:    { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },

  footer:      { paddingVertical: 24, alignItems: 'center' },
  caughtUpRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 28, paddingHorizontal: 4,
  },
  caughtUpLine: { flex: 1, height: 1, backgroundColor: Colors.rim },
  caughtUpText: { fontSize: 12, color: Colors.lit3 },
})

const sepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginTop: 16, marginBottom: 10, paddingHorizontal: 2,
  },
  line:     { flex: 1, height: 1, backgroundColor: Colors.rim },
  labelWrap:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.lit3,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: `${Colors.accent}28`,
    borderWidth: 1, borderColor: `${Colors.accent}55`,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.accent },
})
