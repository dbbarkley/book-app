import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  RefreshControl, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useAuth, useFriends, useUserLibrary, useUserLists,
  apiClient,
} from '@book-app/shared'
import {
  Settings, Heart, Users, BookOpen, BarChart2, List, Pencil, HeartIcon,
  Plus, Globe, Lock, ChevronRight,
} from 'lucide-react-native'
import UserRow from '@/components/UserRow'
import PendingRequestCard from '@/components/PendingRequestCard'
import BookCover from '@/components/BookCover'
import Avatar from '@/components/Avatar'
import SocialStatPill from '@/components/SocialStatPill'
import SocialTabBar from '@/components/SocialTabBar'
import GenrePieChart from '@/components/GenrePieChart'
import { Colors } from '@/constants/colors'
import type { User, Follow, UserList } from '@book-app/shared'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileStats {
  followers_count: number
  following_count: number
  friends_count: number
}

interface ReadingStats {
  genres:      Array<{ name: string; count: number }>
  top_authors: Array<{ name: string; count: number }>
}

type SocialTab = 'friends' | 'following' | 'followers'

// ── Lists Card (Top 10 + Custom Lists in one unified card) ───────────────────

/** Renders one list's header row + horizontal book strip (no outer card border). */
function ListEntry({
  title,
  titleRight,
  items,
  onBookPress,
  rankFromPosition = false,
  emptyText,
  emptyAction,
}: {
  title: React.ReactNode
  titleRight: React.ReactNode
  items: UserList['items']
  onBookPress: (googleBooksId: string | undefined, bookId: number) => void
  rankFromPosition?: boolean
  emptyText: string
  emptyAction?: React.ReactNode
}) {
  return (
    <View style={ls.entry}>
      <View style={t10.header}>
        <View style={t10.headerLeft}>{title}</View>
        {titleRight}
      </View>

      {items.length === 0 ? (
        <View style={t10.empty}>
          <Text style={t10.emptyText}>{emptyText}</Text>
          {emptyAction}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={t10.strip}
          style={t10.stripScroll}
        >
          {items.map((item, idx) => {
            const rank = rankFromPosition ? item.position : idx + 1
            return (
              <TouchableOpacity
                key={item.id}
                style={t10.stripItem}
                onPress={() => onBookPress(item.book.google_books_id, item.book.id)}
                activeOpacity={0.8}
              >
                <View style={[t10.rankBadge, rank === 1 && rankFromPosition && t10.rankBadgeGold]}>
                  <Text style={[t10.rankText, rank === 1 && rankFromPosition && t10.rankTextGold]}>
                    #{rank}
                  </Text>
                </View>
                <BookCover
                  uri={item.book.cover_image_url}
                  title={item.book.title}
                  author={item.book.author_name}
                  width={90}
                  borderRadius={10}
                />
                <Text style={t10.bookTitle} numberOfLines={2}>{item.book.title}</Text>
                <Text style={t10.bookAuthor} numberOfLines={1}>{item.book.author_name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

function ListsCard({
  top10,
  lists,
  isOwnProfile,
  onEdit,
  onLike,
  onBookPress,
  onNew,
  onOpen,
}: {
  top10: UserList | null
  lists: UserList[]
  isOwnProfile: boolean
  onEdit: () => void
  onLike: () => void
  onBookPress: (googleBooksId: string | undefined, bookId: number) => void
  onNew: () => void
  onOpen: (id: number) => void
}) {
  const customLists = lists.filter((l) => l.list_type !== 'top_10')
  const t10Items = top10?.items ?? []

  return (
    <View style={ls.outerCard}>

      {/* ── Top 10 entry ── */}
      <ListEntry
        title={
          <>
            <List size={15} color={Colors.accent} />
            <Text style={t10.title}>My Top 10</Text>
            {top10 && top10.likes_count > 0 && (
              <View style={t10.likesBadge}>
                <HeartIcon size={10} color={Colors.accent} fill={Colors.accent} />
                <Text style={t10.likesCount}>{top10.likes_count}</Text>
              </View>
            )}
          </>
        }
        titleRight={
          isOwnProfile ? (
            <TouchableOpacity style={t10.editBtn} onPress={onEdit} hitSlop={8}>
              <Pencil size={13} color={Colors.lit2} />
              <Text style={t10.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : top10 ? (
            <TouchableOpacity
              style={[t10.likeBtn, top10.liked_by_current_user && t10.likeBtnActive]}
              onPress={onLike}
              hitSlop={8}
            >
              <HeartIcon
                size={13}
                color={top10.liked_by_current_user ? Colors.accentOn : Colors.lit2}
                fill={top10.liked_by_current_user ? Colors.accent : 'transparent'}
              />
              <Text style={[t10.likeBtnText, top10.liked_by_current_user && t10.likeBtnTextActive]}>
                {top10.liked_by_current_user ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        items={t10Items}
        onBookPress={onBookPress}
        rankFromPosition
        emptyText={
          isOwnProfile
            ? 'Add your all-time favourite books here!'
            : "This user hasn't added any books yet."
        }
        emptyAction={
          isOwnProfile ? (
            <TouchableOpacity style={t10.emptyBtn} onPress={onEdit}>
              <Text style={t10.emptyBtnText}>Add Books</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* ── Divider + My Lists header ── */}
      <View style={ls.divider} />

      <View style={ls.myListsHeader}>
        <View style={t10.headerLeft}>
          <List size={15} color={Colors.accent} />
          <Text style={t10.title}>My Lists</Text>
        </View>
        <TouchableOpacity style={ls.newBtn} onPress={onNew} activeOpacity={0.8}>
          <Plus size={13} color={Colors.accentOn} />
          <Text style={ls.newBtnText}>New List</Text>
        </TouchableOpacity>
      </View>

      {/* ── Custom lists or empty state ── */}
      {customLists.length === 0 ? (
        <>
          <View style={ls.divider} />
          <TouchableOpacity style={ls.emptyEntry} onPress={onNew} activeOpacity={0.8}>
            <Plus size={18} color={Colors.lit3} />
            <Text style={ls.emptyEntryText}>Create your first list</Text>
            <Text style={ls.emptyEntrySub}>Top 5 Romance, Favourite Series…</Text>
          </TouchableOpacity>
        </>
      ) : (
        customLists.map((list) => {
          const items = list.items ?? []
          return (
            <View key={list.id}>
              <View style={ls.divider} />
              <ListEntry
                title={
                  <>
                    <List size={15} color={Colors.accent} />
                    <Text style={t10.title} numberOfLines={1}>{list.name}</Text>
                    {list.visibility === 'private' && (
                      <View style={ls.privateBadge}>
                        <Lock size={9} color={Colors.lit3} />
                        <Text style={ls.privateBadgeText}>Private</Text>
                      </View>
                    )}
                  </>
                }
                titleRight={
                  <TouchableOpacity style={t10.editBtn} onPress={() => onOpen(list.id)} hitSlop={8}>
                    <Pencil size={13} color={Colors.lit2} />
                    <Text style={t10.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                }
                items={items}
                onBookPress={onBookPress}
                emptyText="No books yet — tap Edit to add some!"
              />
            </View>
          )
        })
      )}

    </View>
  )
}

// ── Author bar chart ──────────────────────────────────────────────────────────

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

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user }   = useAuth()
  const router     = useRouter()
  const insets     = useSafeAreaInsets()

  const { friends, pendingRequests, loading: friendsLoading,
          acceptRequest, declineRequest } = useFriends()
  const { groupedLibrary, loading: libLoading } = useUserLibrary(user?.id)
  const { lists, top10, refresh: refreshLists } = useUserLists(user?.id)

  const [stats,         setStats]         = useState<ProfileStats | null>(null)
  const [readingStats,  setReadingStats]  = useState<ReadingStats | null>(null)
  const [following,     setFollowing]     = useState<Follow[]>([])
  const [followers,     setFollowers]     = useState<User[]>([])
  const [statsLoading,  setStatsLoading]  = useState(true)
  const [socialLoading, setSocialLoading] = useState(true)
  const [activeTab,     setActiveTab]     = useState<SocialTab>('friends')
  const [refreshing,    setRefreshing]    = useState(false)
  // Track accepting/declining per request id
  const [accepting, setAccepting] = useState<number | null>(null)
  const [declining, setDeclining] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user?.id) return
    try {
      const [profileRes, readingRes, followingRes, followersRes] = await Promise.allSettled([
        apiClient.getUserProfile(user.id),
        apiClient.getUserStats(user.id),
        apiClient.getUserFollowing(user.id),
        apiClient.getUserFollowers(user.id),
      ])
      if (profileRes.status === 'fulfilled')  setStats(profileRes.value.stats ?? null)
      if (readingRes.status === 'fulfilled')  setReadingStats(readingRes.value)
      if (followingRes.status === 'fulfilled') setFollowing(followingRes.value)
      if (followersRes.status === 'fulfilled') setFollowers(followersRes.value)
    } finally {
      setStatsLoading(false)
      setSocialLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchAll(), refreshLists()])
    setRefreshing(false)
  }, [fetchAll, refreshLists])

  const handleAccept = async (id: number) => {
    setAccepting(id)
    try { await acceptRequest(id) }
    finally { setAccepting(null) }
  }

  const handleDecline = async (id: number) => {
    setDeclining(id)
    try { await declineRequest(id) }
    finally { setDeclining(null) }
  }

  const name    = user?.display_name || user?.username || ''
  const readBooks = groupedLibrary?.read ?? []
  const tabs: { key: SocialTab; label: string; count: number }[] = [
    { key: 'friends',   label: 'Friends',   count: friends.length           },
    { key: 'following', label: 'Following', count: following.length          },
    { key: 'followers', label: 'Followers', count: followers.length          },
  ]

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
    >
      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Avatar uri={user?.avatar_url} name={name} size={72} />
          <View style={styles.headerInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{name}</Text>
            {user?.display_name && (
              <Text style={styles.username}>@{user.username}</Text>
            )}
            {user?.bio ? (
              <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
            ) : null}
            {/* Stats row — show real pills once loaded, shimmer while loading */}
            {statsLoading && !stats ? (
              <View style={styles.statsRow}>
                {[72, 60, 68].map((w, i) => (
                  <View key={i} style={[styles.statSkeletonPill, { width: w }]} />
                ))}
              </View>
            ) : stats ? (
              <View style={styles.statsRow}>
                <SocialStatPill value={friends.length}        label="Friends"   />
                <SocialStatPill value={stats.followers_count} label="Followers" />
                <SocialStatPill value={stats.following_count} label="Following" />
              </View>
            ) : null}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
          >
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Settings size={15} color={Colors.lit2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Pending friend requests ── */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FRIEND REQUESTS</Text>
          <View style={styles.sectionBody}>
            {pendingRequests.map((req) => (
              <PendingRequestCard
                key={req.id}
                request={req}
                onAccept={handleAccept}
                onDecline={handleDecline}
                accepting={accepting === req.id}
                declining={declining === req.id}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Lists (Top 10 + My Lists) ── */}
      <ListsCard
        top10={top10}
        lists={lists}
        isOwnProfile={true}
        onEdit={() => router.push('/edit-list')}
        onLike={() => {}}
        onNew={() => router.push('/create-list')}
        onOpen={(id) => router.push(`/list/${id}`)}
        onBookPress={(googleBooksId, bookId) =>
          router.push(`/book/${googleBooksId ?? bookId}`)
        }
      />

      {/* ── Reading stats ── */}
      {!statsLoading && (readingStats?.genres?.length || readingStats?.top_authors?.length || user?.favourite_authors?.length) ? (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <BarChart2 size={15} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Reading Stats</Text>
          </View>
          <View style={styles.sectionBody}>
            {readingStats?.genres && readingStats.genres.length > 0 && (
              <GenrePieChart items={readingStats.genres} />
            )}
            {readingStats?.top_authors && readingStats.top_authors.length > 0 && (
              <StatBars
                title="Top Authors"
                icon={<Users size={13} color={Colors.lit3} />}
                items={readingStats.top_authors}
              />
            )}
            {user?.favourite_authors && user.favourite_authors.length > 0 && (
              <View style={styles.statBarsCard}>
                <View style={styles.statBarsHeader}>
                  <Heart size={13} color={Colors.lit3} />
                  <Text style={styles.statBarsTitle}>Favourite Authors</Text>
                </View>
                <View style={styles.authorChips}>
                  {user.favourite_authors.map((a) => (
                    <View key={a.id} style={styles.authorChip}>
                      <Text style={styles.authorChipText}>{a.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* ── Library preview ── */}
      {readBooks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <BookOpen size={15} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Recently Finished</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library')}
              hitSlop={8}
              style={styles.sectionLink}
            >
              <Text style={styles.sectionLinkText}>All books →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookStrip}
          >
            {readBooks.slice(0, 10).map((ub) =>
              ub.book ? (
                <TouchableOpacity
                  key={ub.id}
                  onPress={() => router.push(`/book/${ub.book!.google_books_id ?? ub.book!.id}`)}
                  activeOpacity={0.85}
                >
                  <BookCover
                    uri={ub.book.cover_image_url}
                    title={ub.book.title}
                    author={ub.book.author_name}
                    width={64}
                    borderRadius={9}
                  />
                </TouchableOpacity>
              ) : null
            )}
          </ScrollView>
        </View>
      )}

      {/* ── Social tabs ── */}
      <View style={styles.section}>
        <SocialTabBar
          tabs={tabs}
          activeTab={activeTab}
          onSelect={setActiveTab}
        />

        {/* Tab body */}
        <View style={styles.tabBody}>
          {socialLoading ? (
            <ActivityIndicator style={{ paddingVertical: 24 }} color={Colors.accent} />
          ) : activeTab === 'friends' ? (
            friends.length === 0 ? (
              <View style={styles.tabEmpty}>
                <Users size={24} color={Colors.lit3} />
                <Text style={styles.tabEmptyText}>No friends yet — find someone to connect with!</Text>
              </View>
            ) : (
              <View style={styles.userList}>
                {friends.map((f) => (
                  <UserRow key={f.id} user={f} actionLabel="View" onAction={() => router.push(`/users/${f.id}`)} />
                ))}
              </View>
            )
          ) : activeTab === 'following' ? (
            following.length === 0 ? (
              <View style={styles.tabEmpty}>
                <Text style={styles.tabEmptyText}>Not following anyone yet</Text>
              </View>
            ) : (
              <View style={styles.userList}>
                {following.map((f) => {
                  if (f.followable_type === 'User' && f.followable) {
                    return (
                      <UserRow
                        key={f.id}
                        user={f.followable as User}
                        actionLabel="View"
                        onAction={() => router.push(`/users/${(f.followable as User).id}`)}
                      />
                    )
                  }
                  if (f.followable_type === 'Author' && f.followable) {
                    const a = f.followable as { id: number; name: string; avatar_url?: string }
                    return (
                      <View key={f.id} style={styles.authorRow}>
                        <View style={styles.authorRowLeft}>
                          <View style={styles.authorDot} />
                          <Text style={styles.authorRowName} numberOfLines={1}>{a.name}</Text>
                          <View style={styles.authorTypeBadge}>
                            <Text style={styles.authorTypeBadgeText}>Author</Text>
                          </View>
                        </View>
                      </View>
                    )
                  }
                  return null
                })}
              </View>
            )
          ) : (
            followers.length === 0 ? (
              <View style={styles.tabEmpty}>
                <Text style={styles.tabEmptyText}>No followers yet</Text>
              </View>
            ) : (
              <View style={styles.userList}>
                {followers.map((f) => (
                  <UserRow key={f.id} user={f} actionLabel="View" onAction={() => router.push(`/users/${f.id}`)} />
                ))}
              </View>
            )
          )}
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  content:   { padding: 16, paddingBottom: 48, gap: 16 },

  // Header card
  headerCard: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 16, gap: 14,
  },
  headerRow:   { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headerInfo:  { flex: 1, gap: 4 },
  displayName: { fontSize: 22, fontWeight: '800', color: Colors.lit, letterSpacing: -0.5 },
  username:    { fontSize: 13, color: Colors.lit2 },
  bio:         { fontSize: 13, color: Colors.lit2, lineHeight: 18, marginTop: 2 },
  statsRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editProfileBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  editProfileBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },

  // Sections
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: Colors.lit3,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: Colors.lit, flex: 1 },
  sectionLink:     { marginLeft: 'auto' },
  sectionLinkText: { fontSize: 12, color: Colors.accent },
  sectionBody:     { gap: 8 },

  // Favourite authors
  authorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  authorChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  authorChipText: { fontSize: 13, fontWeight: '600', color: Colors.lit },

  // Stat bars / pie card shared
  statBarsCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim, padding: 18, gap: 14,
  },
  statBarsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statBarsTitle:  { fontSize: 14, fontWeight: '700', color: Colors.lit },
  statBarRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statBarLabel:   { fontSize: 13, color: Colors.lit2, width: 100 },
  statBarTrack:   { flex: 1, height: 6, borderRadius: 99, backgroundColor: Colors.grove, overflow: 'hidden' },
  statBarFill:    { height: 6, borderRadius: 99, backgroundColor: Colors.accent },
  statBarCount:   { fontSize: 12, fontWeight: '700', color: Colors.accent, width: 22, textAlign: 'right' },

  // Book strip
  bookStrip: { gap: 8, paddingBottom: 4 },

  tabBody:         {},
  tabEmpty:        { alignItems: 'center', paddingVertical: 24, gap: 8 },
  tabEmptyText:    { fontSize: 13, color: Colors.lit2, textAlign: 'center' },
  userList:        { gap: 8 },

  // Author following rows (not User type)
  authorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.grove, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  authorRowLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  authorDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  authorRowName:    { fontSize: 14, fontWeight: '600', color: Colors.lit, flex: 1 },
  authorTypeBadge:  { backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: Colors.rim },
  authorTypeBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.lit2 },

  // Stat skeleton pills shown while stats load
  statSkeletonPill: {
    height: 36, borderRadius: 10,
    backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
})

// ── Lists card (unified) styles ───────────────────────────────────────────────
const ls = StyleSheet.create({
  outerCard: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.rim,
    overflow: 'hidden',
  },
  entry: { padding: 16, gap: 14 },
  divider: { height: 1, backgroundColor: Colors.rim },

  myListsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  newBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accentOn },

  emptyEntry: {
    alignItems: 'center', gap: 4,
    paddingVertical: 24, paddingHorizontal: 16,
  },
  emptyEntryText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
  emptyEntrySub:  { fontSize: 12, color: Colors.lit3 },

  privateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.grove, borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.rim,
  },
  privateBadgeText: { fontSize: 10, color: Colors.lit3 },
})

// ── Top 10 / list entry styles ────────────────────────────────────────────────
const t10 = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:      { fontSize: 15, fontWeight: '700', color: Colors.lit },

  likesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.grove, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.rim,
  },
  likesCount: { fontSize: 11, fontWeight: '700', color: Colors.accent },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },

  likeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
  },
  likeBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  likeBtnText:       { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  likeBtnTextActive: { color: Colors.accentOn },

  empty:       { alignItems: 'center', paddingVertical: 16, gap: 10 },
  emptyText:   { fontSize: 13, color: Colors.lit3, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },

  // Horizontal scroll strip
  stripScroll: { marginHorizontal: -16 },
  strip: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  stripItem: { width: 90, gap: 5, position: 'relative' },

  rankBadge: {
    position: 'absolute', top: 6, left: 6, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  rankBadgeGold: { backgroundColor: 'rgba(255,180,0,0.85)' },
  rankText:      { fontSize: 11, fontWeight: '800', color: '#fff' },
  rankTextGold:  { color: '#1a1000' },

  bookTitle:  { fontSize: 11, fontWeight: '600', color: Colors.lit, lineHeight: 15 },
  bookAuthor: { fontSize: 10, color: Colors.lit3 },
})
