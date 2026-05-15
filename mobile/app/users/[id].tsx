/**
 * /users/[id].tsx — Public user profile screen
 * Shown when tapping any user who is NOT the current user.
 * Displays: header card (avatar + stats + follow/friend buttons),
 * favourite authors, reading stats, recently finished, social tabs.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  FlatList, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useAuthStore, useFriendship, useFollows,
  apiClient,
} from '@book-app/shared'
import {
  ChevronLeft, BarChart2, Heart, Users,
  BookOpen, UserCheck, UserPlus, UserMinus, Clock,
} from 'lucide-react-native'
import UserRow from '@/components/UserRow'
import BookCover from '@/components/BookCover'
import Avatar from '@/components/Avatar'
import SocialStatPill from '@/components/SocialStatPill'
import SocialTabBar from '@/components/SocialTabBar'
import GenrePieChart from '@/components/GenrePieChart'
import { Colors } from '@/constants/colors'
import type { User, UserBook, Follow } from '@book-app/shared'
import type { FriendshipStatus } from '@book-app/shared'

// ── Local types ───────────────────────────────────────────────────────────────

interface ProfileData {
  user: User
  stats: {
    followers_count: number
    following_count: number
    friends_count: number
  }
  current_user_follow?: { following: boolean; follow_id?: number | null }
  friendship?: { status: FriendshipStatus; friendship_id: number | null }
}

interface ReadingStats {
  genres:      Array<{ name: string; count: number }>
  top_authors: Array<{ name: string; count: number }>
}

type SocialTab = 'friends' | 'following' | 'followers'

// ── Reading stats bars ────────────────────────────────────────────────────────

function StatBars({
  title, icon, items,
}: { title: string; icon: React.ReactNode; items: Array<{ name: string; count: number }> }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <View style={styles.statBarsCard}>
      <View style={styles.statBarsHeader}>
        {icon}
        <Text style={styles.statBarsTitle}>{title}</Text>
      </View>
      {items.slice(0, 5).map((item) => (
        <View key={item.name} style={styles.statBarRow}>
          <Text style={styles.statBarLabel} numberOfLines={1}>{item.name}</Text>
          <View style={styles.statBarTrack}>
            <View style={[styles.statBarFill, { width: `${(item.count / max) * 100}%` as any }]} />
          </View>
          <Text style={styles.statBarCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Friend button ─────────────────────────────────────────────────────────────

function FriendButton({
  status, sending, onSend, onAccept, onDecline, onRemove,
}: {
  status: FriendshipStatus
  sending: boolean
  onSend: () => void
  onAccept: () => void
  onDecline: () => void
  onRemove: () => void
}) {
  if (status === 'accepted') {
    return (
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnGhost]}
        onPress={onRemove}
        disabled={sending}
        accessibilityLabel="Remove friend"
        accessibilityRole="button"
        accessibilityState={{ disabled: sending }}
      >
        {sending
          ? <ActivityIndicator size="small" color={Colors.lit2} />
          : <>
              <UserCheck size={14} color={Colors.lit2} />
              <Text style={styles.actionBtnGhostText}>Friends</Text>
            </>}
      </TouchableOpacity>
    )
  }
  if (status === 'pending_sent') {
    return (
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnGhost]}
        disabled
        accessibilityLabel="Friend request sent"
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
      >
        <Clock size={14} color={Colors.lit2} />
        <Text style={styles.actionBtnGhostText}>Requested</Text>
      </TouchableOpacity>
    )
  }
  if (status === 'pending_received') {
    return (
      <View style={styles.requestRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnAccent]}
          onPress={onAccept}
          disabled={sending}
          accessibilityLabel="Accept friend request"
          accessibilityRole="button"
          accessibilityState={{ disabled: sending }}
        >
          {sending
            ? <ActivityIndicator size="small" color={Colors.accentOn} />
            : <Text style={styles.actionBtnAccentText}>Accept</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGhost]}
          onPress={onDecline}
          disabled={sending}
          accessibilityLabel="Decline friend request"
          accessibilityRole="button"
          accessibilityState={{ disabled: sending }}
        >
          <Text style={styles.actionBtnGhostText}>Decline</Text>
        </TouchableOpacity>
      </View>
    )
  }
  // 'none'
  return (
    <TouchableOpacity
      style={[styles.actionBtn, styles.actionBtnGhost]}
      onPress={onSend}
      disabled={sending}
      accessibilityLabel="Send friend request"
      accessibilityRole="button"
      accessibilityState={{ disabled: sending }}
    >
      {sending
        ? <ActivityIndicator size="small" color={Colors.lit2} />
        : <>
            <UserPlus size={14} color={Colors.lit2} />
            <Text style={styles.actionBtnGhostText}>Add Friend</Text>
          </>}
    </TouchableOpacity>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { id }  = useLocalSearchParams<{ id: string }>()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const userId = id ? parseInt(id, 10) : null

  // ── Data state ──────────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState<ProfileData | null>(null)
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null)
  const [library,      setLibrary]      = useState<UserBook[]>([])
  const [friends,      setFriends]      = useState<User[]>([])
  const [following,    setFollowing]    = useState<Follow[]>([])
  const [followers,    setFollowers]    = useState<User[]>([])

  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [activeTab,    setActiveTab]    = useState<SocialTab>('friends')

  // ── Follow state ────────────────────────────────────────────────────────────
  const { follow, unfollow } = useFollows()
  const [followLoading,       setFollowLoading]       = useState(false)
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false)
  const [localFollowId,        setLocalFollowId]        = useState<number | null>(null)

  // ── Friendship hook ─────────────────────────────────────────────────────────
  const {
    status:       friendStatus,
    sending:      friendSending,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriendship(
    userId,
    profile?.friendship?.status,
    profile?.friendship?.friendship_id,
  )

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    if (!userId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [profileRes, statsRes, libRes] = await Promise.allSettled([
        apiClient.getUserProfile(userId),
        apiClient.getUserStats(userId),
        apiClient.getUserLibrary(userId),
      ])

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value as ProfileData
        setProfile(p)
        if (p.current_user_follow) {
          setIsCurrentlyFollowing(p.current_user_follow.following)
          setLocalFollowId(p.current_user_follow.follow_id ?? null)
        }
      } else { setError('Could not load profile.'); return }

      if (statsRes.status === 'fulfilled') setReadingStats(statsRes.value)
      if (libRes.status === 'fulfilled')   setLibrary(libRes.value)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  const loadSocialTab = useCallback(async (tab: SocialTab, uid: number) => {
    try {
      if (tab === 'friends') {
        const res = await apiClient.getFriends(uid)
        setFriends(res as User[])
      } else if (tab === 'following') {
        const res = await apiClient.getUserFollowing(uid)
        setFollowing(res)
      } else {
        const res = await apiClient.getUserFollowers(uid)
        setFollowers(res)
      }
    } catch { /* fail silently — tab will show empty */ }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (userId) loadSocialTab(activeTab, userId)
  }, [activeTab, userId, loadSocialTab])

  // ── Follow toggle ───────────────────────────────────────────────────────────
  const handleFollowToggle = useCallback(async () => {
    if (!userId) return
    setFollowLoading(true)
    try {
      if (isCurrentlyFollowing && localFollowId) {
        await unfollow(localFollowId)
        setIsCurrentlyFollowing(false)
        setLocalFollowId(null)
      } else if (!isCurrentlyFollowing) {
        const newFollow = await follow('User', userId)
        setIsCurrentlyFollowing(true)
        setLocalFollowId(newFollow.id)
      }
    } catch {}
    setFollowLoading(false)
  }, [userId, isCurrentlyFollowing, localFollowId, follow, unfollow])

  // ── Guard: own profile ──────────────────────────────────────────────────────
  const isOwnProfile = currentUserId !== undefined && userId === currentUserId

  // ── Derived ─────────────────────────────────────────────────────────────────
  const user  = profile?.user
  const stats = profile?.stats
  const name  = user?.display_name || user?.username || '...'
  const finishedBooks = library.filter((ub) => ub.status === 'read').slice(0, 12)

  // ── Render helpers ──────────────────────────────────────────────────────────
  // following returns Follow[] (User followable), followers returns User[] directly
  const socialItems: User[] = activeTab === 'friends'
    ? friends
    : activeTab === 'following'
      ? (following
          .filter((f) => f.followable_type === 'User' && f.followable)
          .map((f) => f.followable as User))
      : followers

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  if (error || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={[styles.backBtn, { margin: 16 }]}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={20} color={Colors.lit2} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'User not found.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load()}
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={20} color={Colors.lit2} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.accent}
          />
        }
      >
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <Avatar uri={user.avatar_url} name={name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{name}</Text>
            {user.display_name && (
              <Text style={styles.username} numberOfLines={1}>@{user.username}</Text>
            )}
            {user.bio && (
              <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
            )}
          </View>
        </View>

        {/* ── Stats row ── */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <SocialStatPill value={stats.friends_count} label="Friends" />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <SocialStatPill value={stats.following_count} label="Following" />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <SocialStatPill value={stats.followers_count} label="Followers" />
            </View>
          </View>
        )}

        {/* ── Action buttons (hidden on own profile) ── */}
        {!isOwnProfile && (
          <View style={styles.actionRow}>
            {/* Follow / Unfollow */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isCurrentlyFollowing ? styles.actionBtnGhost : styles.actionBtnAccent,
                styles.actionBtnFlex,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
              accessibilityLabel={isCurrentlyFollowing ? 'Unfollow user' : 'Follow user'}
              accessibilityRole="button"
              accessibilityState={{ disabled: followLoading }}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={isCurrentlyFollowing ? Colors.lit2 : Colors.accentOn} />
                : isCurrentlyFollowing
                  ? <>
                      <UserMinus size={14} color={Colors.lit2} />
                      <Text style={styles.actionBtnGhostText}>Unfollow</Text>
                    </>
                  : <>
                      <UserPlus size={14} color={Colors.accentOn} />
                      <Text style={styles.actionBtnAccentText}>Follow</Text>
                    </>}
            </TouchableOpacity>

            {/* Friend button */}
            <FriendButton
              status={friendStatus}
              sending={friendSending}
              onSend={sendRequest}
              onAccept={acceptRequest}
              onDecline={declineRequest}
              onRemove={removeFriend}
            />
          </View>
        )}

        {/* ── Favourite authors ── */}
        {user.favourite_authors && user.favourite_authors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Favourite Authors</Text>
            </View>
            <View style={styles.authorsWrap}>
              {user.favourite_authors.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.authorChip}
                  onPress={() => router.push(`/(tabs)/search?q=${encodeURIComponent(a.name)}&tab=books` as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.authorChipText}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Reading stats ── */}
        {readingStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart2 size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Reading Stats</Text>
            </View>
            {readingStats.genres.length > 0 && (
              <GenrePieChart items={readingStats.genres} />
            )}
            {readingStats.top_authors.length > 0 && (
              <StatBars
                title="Top Authors"
                icon={<Heart size={13} color={Colors.lit3} />}
                items={readingStats.top_authors}
              />
            )}
          </View>
        )}

        {/* ── Recently finished ── */}
        {finishedBooks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Recently Finished</Text>
            </View>
            <FlatList
              data={finishedBooks}
              keyExtractor={(ub) => String(ub.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bookStrip}
              renderItem={({ item: ub }) =>
                ub.book ? (
                  <TouchableOpacity
                    onPress={() => router.push(`/book/${ub.book!.google_books_id ?? ub.book!.id}`)}
                    activeOpacity={0.8}
                    accessibilityLabel={`View ${ub.book!.title}`}
                    accessibilityRole="button"
                  >
                    <BookCover
                      uri={ub.book.cover_image_url}
                      title={ub.book.title}
                      author={ub.book.author_name}
                      width={64}
                      borderRadius={8}
                    />
                  </TouchableOpacity>
                ) : null
              }
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            />
          </View>
        )}

        {/* ── Social tabs ── */}
        <View style={styles.section}>
          <SocialTabBar
            tabs={(['friends', 'following', 'followers'] as SocialTab[]).map((t) => ({
              key:   t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />

          {socialItems.length === 0 ? (
            <View style={styles.emptyTab}>
              <Users size={24} color={Colors.lit3} />
              <Text style={styles.emptyTabText}>
                {activeTab === 'friends'
                  ? 'No friends yet'
                  : activeTab === 'following'
                    ? `${name.split(' ')[0]} isn't following anyone yet`
                    : `${name.split(' ')[0]} has no followers yet`}
              </Text>
            </View>
          ) : (
            <View style={styles.socialList}>
              {socialItems.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.canvas },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scrollContent: { paddingBottom: 40 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  headerBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit, flex: 1, textAlign: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4,
  },
  profileInfo: { flex: 1, gap: 3 },
  displayName: { fontSize: 20, fontWeight: '800', color: Colors.lit },
  username:    { fontSize: 13, color: Colors.lit2 },
  bio:         { fontSize: 13, color: Colors.lit2, lineHeight: 18, marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingVertical: 12,
  },
  statCell:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.rim },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  requestRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, minWidth: 90, justifyContent: 'center',
  },
  actionBtnFlex:    { flex: 1 },
  actionBtnAccent:  { backgroundColor: Colors.accent },
  actionBtnGhost:   { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  actionBtnAccentText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },
  actionBtnGhostText:  { fontSize: 13, fontWeight: '600', color: Colors.lit2 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.lit },

  // Authors
  authorsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  authorChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
  authorChipText: { fontSize: 12, color: Colors.lit2, fontWeight: '500' },

  // Stat bars
  statBarsCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 14, marginBottom: 10,
  },
  statBarsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  statBarsTitle:  { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  statBarRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  statBarLabel:   { fontSize: 12, color: Colors.lit2, width: 90 },
  statBarTrack:   { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.grove, overflow: 'hidden' },
  statBarFill:    { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  statBarCount:   { fontSize: 11, color: Colors.lit2, width: 20, textAlign: 'right' },

  // Book strip
  bookStrip: { paddingBottom: 4 },

  socialList: { gap: 8 },

  emptyTab: {
    alignItems: 'center', gap: 10, paddingVertical: 40,
  },
  emptyTabText: { fontSize: 13, color: Colors.lit2, textAlign: 'center' },

  // Error
  errorText: { fontSize: 14, color: Colors.lit2, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
})
