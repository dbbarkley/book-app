'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useAuth, useFollows, useFriends } from '@book-app/shared'
import { Settings, RefreshCw, BarChart2, Heart, Users } from 'lucide-react'

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
import { formatNumber } from '@/utils/format'
import type { User, Follow, FriendshipStatus } from '@book-app/shared'
import AuthorCard from '@/components/AuthorCard'
import BookCard from '@/components/BookCard'
import Button from '@/components/Button'
import Avatar from '@/components/Avatar'
import UserLibrary from '@/components/UserLibrary'
import GenreChart from '@/components/charts/GenreChart'
import TopAuthorsChart from '@/components/charts/TopAuthorsChart'
import FriendButton from '@/components/FriendButton'
import FriendRequestsPanel from '@/components/FriendRequestsPanel'

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
      <div className="container-mobile py-12 max-w-4xl mx-auto">
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
        className="max-w-4xl mx-auto space-y-5"
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
        <motion.div variants={itemVariants} className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <Avatar src={user.avatar_url} name={user.display_name || user.username} size="2xl" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
                {user.display_name || user.username}
              </h1>
              {user.display_name && (
                <p className="mb-4 text-sm" style={{ color: 'var(--color-lit-2)' }}>@{user.username}</p>
              )}

              {stats && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
                  <div
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                  >
                    <span className="font-bold" style={{ color: 'var(--color-lit)' }}>
                      {formatNumber(friendsCount)}
                    </span>
                    <span style={{ color: 'var(--color-lit-2)' }}> friends</span>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                  >
                    <span className="font-bold" style={{ color: 'var(--color-lit)' }}>
                      {formatNumber(stats.followers_count)}
                    </span>
                    <span style={{ color: 'var(--color-lit-2)' }}> followers</span>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                  >
                    <span className="font-bold" style={{ color: 'var(--color-lit)' }}>
                      {formatNumber(stats.following_count)}
                    </span>
                    <span style={{ color: 'var(--color-lit-2)' }}> following</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {!isOwnProfile && (
                  <>
                    <FriendButton
                      userId={userId}
                      initialStatus={profileData.friendship?.status ?? 'none'}
                      initialFriendshipId={profileData.friendship?.friendship_id ?? null}
                    />
                    {profileData.currentUserFollow && (
                      <Button
                        variant={alreadyFollowing ? 'secondary' : 'primary'}
                        onClick={handleFollowToggle}
                        isLoading={followLoading}
                        disabled={followLoading}
                      >
                        {alreadyFollowing ? '✓ Following' : '+ Follow'}
                      </Button>
                    )}
                  </>
                )}
                {isOwnProfile && (
                  <Button variant="outline" onClick={() => router.push('/settings')} className="flex items-center gap-2">
                    <Settings size={15} />
                    Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
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
                <div className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
                  <GenreChart data={readingStats!.genres} />
                </div>
              )}
              {hasAuthors && (
                <div className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
                  <TopAuthorsChart data={readingStats!.top_authors} />
                </div>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* ── Favourite Authors ── */}
        {user.favourite_authors && user.favourite_authors.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
            <div className="flex items-center gap-2 mb-5">
              <Heart size={18} style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-lit)' }}>
                Favourite Authors
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.favourite_authors.map(author => (
                <span
                  key={author.id}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--color-grove)',
                    border: '1px solid var(--color-rim)',
                    color: 'var(--color-lit)',
                  }}
                >
                  {author.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Library ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] p-6 sm:p-8" style={cardStyle}>
          <UserLibrary userId={userId} username={user.display_name || user.username} />
        </motion.div>

        {/* ── Friends / Following / Followers ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden" style={cardStyle}>
          {/* Tab bar */}
          <div
            className="flex px-2 pt-2 gap-1"
            style={{ borderBottom: '1px solid var(--color-rim)' }}
          >
            {(['friends', 'following', 'followers'] as const).map(tab => {
              const active = activeTab === tab
              const count =
                tab === 'friends' ? friendsCount :
                tab === 'following' ? following.length :
                followers.length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative px-5 py-3 text-sm font-bold capitalize transition-colors rounded-t-xl"
                  style={{ color: active ? 'var(--color-accent)' : 'var(--color-lit-2)' }}
                >
                  {tab} <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-lit-3)' }}>({count})</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">

            {/* Friends tab */}
            {activeTab === 'friends' && (
              profileFriendsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
                  ))}
                </div>
              ) : friendsList.length === 0 ? (
                <div className="py-10 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>
                    {isOwnProfile ? 'No friends yet — add someone!' : 'No friends to show'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsList.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 p-3 rounded-2xl transition-colors"
                      style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                    >
                      <button onClick={() => router.push(`/users/${friend.id}`)} className="flex-shrink-0">
                        <Avatar src={friend.avatar_url} name={friend.display_name || friend.username} size="sm" />
                      </button>
                      <button onClick={() => router.push(`/users/${friend.id}`)} className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                          {friend.display_name || friend.username}
                        </p>
                        {friend.display_name && (
                          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{friend.username}</p>
                        )}
                      </button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/users/${friend.id}`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Following tab */}
            {activeTab === 'following' && (
              following.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--color-lit-2)' }}>
                  Not following anyone yet
                </p>
              ) : (
                <div className="space-y-3">
                  {following.map(f => {
                    if (f.followable_type === 'Author' && f.followable) {
                      return <AuthorCard key={f.id} author={f.followable as any} showFollowButton={!isOwnProfile} />
                    }
                    if (f.followable_type === 'Book' && f.followable) {
                      return <BookCard key={f.id} book={f.followable as any} showDescription={true} />
                    }
                    if (f.followable_type === 'User' && f.followable) {
                      const fu = f.followable as User
                      return (
                        <div key={f.id} className="flex items-center gap-4 p-3 rounded-2xl transition-colors"
                          style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
                          <Avatar src={fu.avatar_url} name={fu.display_name || fu.username} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                              {fu.display_name || fu.username}
                            </p>
                            {fu.display_name && (
                              <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{fu.username}</p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/users/${fu.id}`)}>
                            View
                          </Button>
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
                <p className="py-8 text-center text-sm" style={{ color: 'var(--color-lit-2)' }}>
                  No followers yet
                </p>
              ) : (
                <div className="space-y-3">
                  {followers.map(follower => (
                    <div key={follower.id} className="flex items-center gap-4 p-3 rounded-2xl transition-colors"
                      style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
                      <Avatar src={follower.avatar_url} name={follower.display_name || follower.username} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                          {follower.display_name || follower.username}
                        </p>
                        {follower.display_name && (
                          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{follower.username}</p>
                        )}
                        {follower.bio && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-lit-2)' }}>
                            {follower.bio}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/users/${follower.id}`)}>
                        View
                      </Button>
                    </div>
                  ))}
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
