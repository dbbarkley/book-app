'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useAuth, useFollows, useFriends, useUserLists, useUserList } from '@book-app/shared'
import { RefreshCw, BarChart2, Heart } from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

import { apiClient } from '@book-app/shared'
import ProtectedRoute from '@/components/ProtectedRoute'
import type { User, Follow, FriendshipStatus } from '@book-app/shared'
import Button from '@/components/Button'
import SocialTabBar from '@/components/SocialTabBar'
import UserListsCard from '@/components/UserListsCard'
import UserLibrary from '@/components/UserLibrary'
import GenreChart from '@/components/charts/GenreChart'
import TopAuthorsChart from '@/components/charts/TopAuthorsChart'
import FriendButton from '@/components/FriendButton'
import FriendRequestsPanel from '@/components/FriendRequestsPanel'
import ProfileHeroCard from '@/components/ProfileHeroCard'

interface UserProfileData {
  user: User | null
  stats: { followers_count: number; following_count: number; friends_count: number } | null
  following: Follow[]
  followers: User[]
  currentUserFollow: { following: boolean; follow_id?: number | null } | null
  friendship: { status: FriendshipStatus; friendship_id: number | null } | null
}

interface ReadingStats {
  genres: Array<{ name: string; count: number }>
  top_authors: Array<{ name: string; count: number }>
}

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

const SOCIAL_AVATAR_COLORS = ['#D5582E', '#234A5A', '#2D6A4F', '#8B6914', '#8B3A2A', '#5B7FA6']
function socialAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return SOCIAL_AVATAR_COLORS[Math.abs(h) % SOCIAL_AVATAR_COLORS.length]
}
function SocialAvatar({ name, initial }: { name: string; initial: string }) {
  return (
    <div
      className="flex items-center justify-center font-serif font-black flex-shrink-0"
      style={{
        width: 44, height: 44,
        borderRadius: '50%',
        backgroundColor: socialAvatarColor(name),
        border: '2px solid var(--color-ink)',
        color: '#FAF6EB',
        fontSize: 18,
      }}
    >
      {initial}
    </div>
  )
}

function UserProfileContent() {
  const params = useParams()
  const router = useRouter()
  const userId = parseInt(params.id as string, 10)
  const { user: currentUser } = useAuth()
  const { unfollow, follow } = useFollows()
  const {
    pendingRequests,
    friends: myFriends,
    acceptRequest: acceptFriendRequest,
    declineRequest: declineFriendRequest,
  } = useFriends()

  const [profileData, setProfileData] = useState<UserProfileData>({
    user: null, stats: null, following: [], followers: [], currentUserFollow: null, friendship: null,
  })
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null)

  // Lists
  const { lists, top10, refresh: refreshLists } = useUserLists(isNaN(userId) ? undefined : userId)
  const { toggleLike: toggleTop10Like } = useUserList(
    isNaN(userId) ? undefined : userId,
    top10 ? top10.id : undefined
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'friends' | 'following' | 'followers'>('friends')
  const [followLoading, setFollowLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [profileFriends, setProfileFriends] = useState<User[]>([])
  const [profileFriendsLoading, setProfileFriendsLoading] = useState(false)

  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    if (!isNaN(userId)) {
      fetchProfile()
      fetchReadingStats()
    } else {
      setError('Invalid user ID')
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!loading && profileData.user) {
      fetchProfileFriends()
    }
  }, [loading, userId])

  const currentFollow = profileData.currentUserFollow
  const alreadyFollowing = currentFollow?.following ?? false
  const currentFollowId = currentFollow?.follow_id ?? null

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const [profile, following, followers] = await Promise.all([
        apiClient.getUserProfile(userId),
        apiClient.getUserFollowing(userId).catch(() => []),
        apiClient.getUserFollowers(userId).catch(() => []),
      ])
      setProfileData({
        user: profile.user,
        stats: profile.stats,
        following,
        followers,
        currentUserFollow: profile.current_user_follow || { following: false },
        friendship: profile.friendship || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfileFriends = async () => {
    setProfileFriendsLoading(true)
    try {
      const friends = await apiClient.getFriends(userId)
      setProfileFriends(friends)
    } catch {
      // non-fatal
    } finally {
      setProfileFriendsLoading(false)
    }
  }

  const fetchReadingStats = async () => {
    setStatsLoading(true)
    setStatsError(false)
    try {
      const stats = await apiClient.getUserStats(userId)
      setReadingStats(stats)
    } catch (err) {
      console.error('Failed to fetch reading stats:', err)
      setStatsError(true)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!profileData.user || isOwnProfile) return
    setFollowLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (alreadyFollowing && currentFollowId) {
        await unfollow(currentFollowId)
        setMessage(`Unfollowed ${profileData.user.display_name || profileData.user.username}`)
      } else {
        await follow('User', profileData.user.id)
        setMessage(`Now following ${profileData.user.display_name || profileData.user.username}`)
      }
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container-mobile py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
          <div className="h-64 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
        </div>
      </div>
    )
  }

  if (!profileData.user) {
    return (
      <div className="container-mobile py-12 text-center">
        <h1 className="font-serif text-2xl font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
          Profile Not Found
        </h1>
        <p className="mb-6" style={{ color: 'var(--color-lit-2)' }}>
          {error || "The user you're looking for doesn't exist."}
        </p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    )
  }

  const { user, stats, following, followers } = profileData
  const friendsCount = isOwnProfile ? myFriends.length : (profileFriends.length || stats?.friends_count || 0)
  const friendsList = isOwnProfile ? myFriends : profileFriends

  const hasGenres = readingStats?.genres && readingStats.genres.length > 0
  const hasAuthors = readingStats?.top_authors && readingStats.top_authors.length > 0

  return (
    <div className="container-mobile py-6 sm:py-8">
      <motion.div
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Toasts */}
        {error && (
          <motion.div variants={itemVariants} className="rounded-2xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
            {error}
          </motion.div>
        )}
        {message && (
          <motion.div variants={itemVariants} className="rounded-2xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}>
            {message}
          </motion.div>
        )}

        {/* ── Friend Requests (own profile only) ── */}
        {isOwnProfile && pendingRequests.length > 0 && (
          <motion.div variants={itemVariants}>
            <FriendRequestsPanel
              requests={pendingRequests}
              onAccept={acceptFriendRequest}
              onDecline={declineFriendRequest}
            />
          </motion.div>
        )}

        {/* ── Header Card ── */}
        <motion.div variants={itemVariants}>
          <ProfileHeroCard
            user={user}
            stats={stats ? {
              friends_count:   friendsCount,
              followers_count: stats.followers_count,
              following_count: stats.following_count,
            } : null}
            isOwnProfile={isOwnProfile}
            onEditProfile={() => router.push('/settings')}
            friendshipStatus={profileData.friendship?.status ?? 'none'}
            friendshipId={profileData.friendship?.friendship_id ?? null}
            isFollowing={alreadyFollowing}
            onFollowToggle={isOwnProfile ? undefined : handleFollowToggle}
            followLoading={followLoading}
          />
        </motion.div>

        {/* ── Charts ── */}
        <motion.div variants={itemVariants}>
          {statsLoading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {[1, 2].map(i => (
                <div key={i} className="rounded-[28px] p-6 sm:p-8 animate-pulse" style={cardStyle}>
                  <div className="h-4 w-32 rounded-full mb-6" style={{ backgroundColor: 'var(--color-grove)' }} />
                  <div className="h-48 rounded-2xl" style={{ backgroundColor: 'var(--color-grove)' }} />
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div
              className="rounded-[28px] p-6 flex items-center justify-between gap-4"
              style={cardStyle}
            >
              <div className="flex items-center gap-3">
                <BarChart2 size={18} style={{ color: 'var(--color-lit-3)' }} />
                <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
                  Couldn't load reading stats
                </p>
              </div>
              <button
                onClick={fetchReadingStats}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : (hasGenres || hasAuthors) ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {hasGenres && (
                <GenreChart data={readingStats!.genres} />
              )}
              {hasAuthors && (
                <TopAuthorsChart data={readingStats!.top_authors} />
              )}
            </div>
          ) : null}
        </motion.div>

        {/* ── Favourite Authors ── */}
        {user.favourite_authors && user.favourite_authors.length > 0 && (
          <motion.div
            variants={itemVariants}
            style={{
              backgroundColor: 'var(--color-canvas)',
              border: '2px solid var(--color-ink)',
              borderRadius: 16,
              boxShadow: '5px 5px 0px var(--color-accent-yellow)',
              padding: '22px 24px 24px',
            }}
          >
            <p
              className="font-bold uppercase"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}
            >
              Favourites
            </p>
            <h3
              className="font-serif font-bold leading-tight mb-5"
              style={{ fontSize: 22, color: 'var(--color-ink)' }}
            >
              Writers I&apos;d <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>defend</em> in a bar fight
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.favourite_authors.map((author, i) => {
                const dot = i % 2 === 0 ? 'var(--color-accent)' : 'var(--color-accent-teal)'
                const rotation = (i % 3 === 0 ? -1.5 : i % 3 === 1 ? 1.2 : -0.8)
                return (
                  <span
                    key={author.id}
                    className="inline-flex items-center gap-2 font-bold"
                    style={{
                      fontSize: 13,
                      color: 'var(--color-ink)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-canvas)',
                      transform: `rotate(${rotation}deg)`,
                      display: 'inline-flex',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
                    {author.name}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Lists (Top 10 + custom) ── */}
        {(top10 || lists.length > 0 || isOwnProfile) && (
          <motion.div variants={itemVariants}>
            <UserListsCard
              lists={lists}
              top10={top10}
              isOwnProfile={isOwnProfile}
              onToggleTop10Like={toggleTop10Like}
            />
          </motion.div>
        )}

        {/* ── Library ── */}
        <motion.div variants={itemVariants}>
          <UserLibrary userId={userId} username={user.display_name || user.username} isOwnProfile={isOwnProfile} />
        </motion.div>

        {/* ── Friends / Following / Followers ── */}
        <motion.div variants={itemVariants}>
          <div
            style={{
              backgroundColor: 'var(--color-canvas)',
              border: '2px solid var(--color-ink)',
              borderRadius: 16,
              boxShadow: '5px 5px 0px var(--color-accent-teal)',
              padding: '22px 22px 24px',
            }}
          >
            {/* Header */}
            <p
              className="font-bold uppercase"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}
            >
              Social
            </p>
            <h3
              className="font-serif font-bold leading-tight mb-5"
              style={{ fontSize: 22, color: 'var(--color-ink)' }}
            >
              People in your stacks
            </h3>

            {/* Grouped tab pill */}
            <div className="mb-5">
              <SocialTabBar
                activeTab={activeTab}
                onSelect={(t) => setActiveTab(t)}
                tabs={[
                  { key: 'friends',   label: 'Friends',   count: friendsCount    },
                  { key: 'following', label: 'Following', count: following.length },
                  { key: 'followers', label: 'Followers', count: followers.length },
                ]}
              />
            </div>

            {/* Friends tab */}
            {activeTab === 'friends' && (
              profileFriendsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)' }} />
                  ))}
                </div>
              ) : friendsList.length === 0 ? (
                <div className="py-10 text-center">
                  <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                    {isOwnProfile ? 'No friends yet — add someone!' : 'No friends to show'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friendsList.map(friend => {
                    const name  = friend.display_name || friend.username
                    const initial = name.charAt(0).toUpperCase()
                    const subtext = [
                      `@${friend.username}`,
                      (friend as any).bio,
                    ].filter(Boolean).join(' · ')
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3"
                        style={{
                          border: '2px solid var(--color-ink)',
                          borderRadius: 12,
                          boxShadow: '3px 3px 0px var(--color-ink)',
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-canvas)',
                        }}
                      >
                        <SocialAvatar name={name} initial={initial} />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold truncate" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
                            {name}
                          </p>
                          <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 1 }}>
                            {subtext}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/users/${friend.id}`)}
                          className="font-bold uppercase flex-shrink-0 transition-opacity hover:opacity-70"
                          style={{
                            fontSize: 11, letterSpacing: '0.12em',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 999,
                            padding: '6px 14px',
                            color: 'var(--color-ink)',
                            backgroundColor: 'transparent',
                          }}
                        >
                          View
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Following tab */}
            {activeTab === 'following' && (
              following.length === 0 ? (
                <p className="py-8 text-center" style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                  Not following anyone yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {following.map(f => {
                    if (f.followable_type === 'Author' && f.followable) {
                      const author = f.followable as any
                      const name   = author.name || 'Unknown Author'
                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3"
                          style={{
                            border: '2px solid var(--color-ink)',
                            borderRadius: 12,
                            boxShadow: '3px 3px 0px var(--color-ink)',
                            padding: '10px 12px',
                            backgroundColor: 'var(--color-canvas)',
                          }}
                        >
                          <SocialAvatar name={name} initial={name.charAt(0).toUpperCase()} />
                          <div className="flex-1 min-w-0">
                            <p className="font-serif font-bold truncate" style={{ fontSize: 15, color: 'var(--color-ink)' }}>{name}</p>
                            <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 1 }}>Author</p>
                          </div>
                          {author.id && (
                            <button
                              onClick={() => router.push(`/authors/${author.id}`)}
                              className="font-bold uppercase flex-shrink-0 transition-opacity hover:opacity-70"
                              style={{
                                fontSize: 11, letterSpacing: '0.12em',
                                border: '2px solid var(--color-ink)',
                                borderRadius: 999,
                                padding: '6px 14px',
                                color: 'var(--color-ink)',
                                backgroundColor: 'transparent',
                              }}
                            >
                              View
                            </button>
                          )}
                        </div>
                      )
                    }
                    if (f.followable_type === 'User' && f.followable) {
                      const fu   = f.followable as User
                      const name = fu.display_name || fu.username
                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3"
                          style={{
                            border: '2px solid var(--color-ink)',
                            borderRadius: 12,
                            boxShadow: '3px 3px 0px var(--color-ink)',
                            padding: '10px 12px',
                            backgroundColor: 'var(--color-canvas)',
                          }}
                        >
                          <SocialAvatar name={name} initial={name.charAt(0).toUpperCase()} />
                          <div className="flex-1 min-w-0">
                            <p className="font-serif font-bold truncate" style={{ fontSize: 15, color: 'var(--color-ink)' }}>{name}</p>
                            <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 1 }}>
                              @{fu.username}{fu.bio ? ` · ${fu.bio}` : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/users/${fu.id}`)}
                            className="font-bold uppercase flex-shrink-0 transition-opacity hover:opacity-70"
                            style={{
                              fontSize: 11, letterSpacing: '0.12em',
                              border: '2px solid var(--color-ink)',
                              borderRadius: 999,
                              padding: '6px 14px',
                              color: 'var(--color-ink)',
                              backgroundColor: 'transparent',
                            }}
                          >
                            View
                          </button>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )
            )}

            {/* Followers tab */}
            {activeTab === 'followers' && (
              followers.length === 0 ? (
                <p className="py-8 text-center" style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                  No followers yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {followers.map(follower => {
                    const name = follower.display_name || follower.username
                    return (
                      <div
                        key={follower.id}
                        className="flex items-center gap-3"
                        style={{
                          border: '2px solid var(--color-ink)',
                          borderRadius: 12,
                          boxShadow: '3px 3px 0px var(--color-ink)',
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-canvas)',
                        }}
                      >
                        <SocialAvatar name={name} initial={name.charAt(0).toUpperCase()} />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold truncate" style={{ fontSize: 15, color: 'var(--color-ink)' }}>{name}</p>
                          <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 1 }}>
                            @{follower.username}{follower.bio ? ` · ${follower.bio}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/users/${follower.id}`)}
                          className="font-bold uppercase flex-shrink-0 transition-opacity hover:opacity-70"
                          style={{
                            fontSize: 11, letterSpacing: '0.12em',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 999,
                            padding: '6px 14px',
                            color: 'var(--color-ink)',
                            backgroundColor: 'transparent',
                          }}
                        >
                          View
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  )
}
