'use client'

// User Profile Page - Shows user information, follows, and stats
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useAuth, useFollows } from '@book-app/shared'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    }
  },
}
import { apiClient } from '@book-app/shared'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatNumber, formatDate } from '@/utils/format'
import type { User, Follow } from '@book-app/shared'
import AuthorCard from '@/components/AuthorCard'
import BookCard from '@/components/BookCard'
import FollowButton from '@/components/FollowButton'
import Button from '@/components/Button'
import UserLibrary from '@/components/UserLibrary'
import GenreChart from '@/components/charts/GenreChart'
import TopAuthorsChart from '@/components/charts/TopAuthorsChart'

interface UserProfileData {
  user: User | null
  stats: {
    followers_count: number
    following_count: number
  } | null
  following: Follow[]
  followers: User[]
  currentUserFollow: {
    following: boolean
    follow_id?: number | null
  } | null
}

interface ReadingStats {
  genres: Array<{ name: string; count: number }>
  top_authors: Array<{ name: string; count: number }>
}

/**
 * User Profile Page
 * 
 * Features:
 * - User details (username, display name, bio, avatar)
 * - Follow/Unfollow button (if viewing another user)
 * - Stats (followers, following)
 * - List of following (authors, books, users)
 * - List of followers
 * 
 * For React Native:
 * - Replace Next.js navigation with React Navigation
 * - Use ScrollView or FlatList for better performance
 * - Adjust styling to StyleSheet
 */
function UserProfileContent() {
  const params = useParams()
  const router = useRouter()
  const userId = parseInt(params.id as string, 10)
  const { user: currentUser, isAuthenticated } = useAuth()
  const { unfollow, follow } = useFollows()

  const [profileData, setProfileData] = useState<UserProfileData>({
    user: null,
    stats: null,
    following: [],
    followers: [],
    currentUserFollow: null,
  })
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following')
  const [followLoading, setFollowLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchReadingStats = async () => {
    try {
      const stats = await apiClient.getUserStats(userId)
      setReadingStats(stats)
    } catch (err) {
      console.error('Failed to fetch reading stats:', err)
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
      // Refresh profile to update stats
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData.user) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Profile Not Found</h1>
          <p className="text-slate-600 mb-4">{error || "The user you're looking for doesn't exist."}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { user, stats, following, followers } = profileData

  return (
    <div className="container-mobile py-6 sm:py-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {error && (
          <motion.div variants={itemVariants} className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </motion.div>
        )}
        {message && (
          <motion.div variants={itemVariants} className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </motion.div>
        )}
        {/* User Header Card */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {user.avatar_url && (
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={user.avatar_url}
                  alt={user.display_name || user.username}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-md"
                />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                {user.display_name || user.username}
              </h1>
              {user.display_name && (
                <p className="text-slate-600 mb-4">@{user.username}</p>
              )}
              
              {stats && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-6 text-sm text-slate-600">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <span className="font-bold text-slate-900">{formatNumber(stats.followers_count)}</span> followers
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <span className="font-bold text-slate-900">{formatNumber(stats.following_count)}</span> following
                  </div>
                  {user.created_at && (
                    <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      Joined {formatDate(user.created_at)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {!isOwnProfile && (
                  <>
                    {profileData.currentUserFollow ? (
                      <Button
                        variant={alreadyFollowing ? 'secondary' : 'primary'}
                        onClick={handleFollowToggle}
                        isLoading={followLoading}
                        disabled={followLoading}
                      >
                        {alreadyFollowing ? '✓ Following' : '+ Follow'}
                      </Button>
                    ) : (
                      <div className="px-6 py-3 text-sm text-text-muted border border-border-default rounded-lg">
                        Checking follow status...
                      </div>
                    )}
                  </>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/settings')}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section - Visual Charts */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
            <GenreChart data={readingStats?.genres || []} />
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
            <TopAuthorsChart data={readingStats?.top_authors || []} />
          </div>
        </motion.div>

        {/* User Library Section */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
          <UserLibrary userId={userId} username={user.display_name || user.username} />
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex space-x-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('following')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Following ({following.length})
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Followers ({followers.length})
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={itemVariants}>
          {/* Following Tab */}
          {activeTab === 'following' && (
            <div>
              {following.length === 0 ? (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
                  <p className="text-slate-600">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {following.map((follow) => {
                    if (follow.followable_type === 'Author' && follow.followable) {
                      return (
                        <AuthorCard
                          key={follow.id}
                          author={follow.followable as any}
                          showFollowButton={!isOwnProfile}
                        />
                      )
                    }
                    if (follow.followable_type === 'Book' && follow.followable) {
                      return (
                        <BookCard
                          key={follow.id}
                          book={follow.followable as any}
                          showDescription={true}
                        />
                      )
                    }
                    if (follow.followable_type === 'User' && follow.followable) {
                      const followedUser = follow.followable as User
                      return (
                        <div
                          key={follow.id}
                          className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            {followedUser.avatar_url && (
                              <img
                                src={followedUser.avatar_url}
                                alt={followedUser.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                {followedUser.display_name || followedUser.username}
                              </h3>
                              {followedUser.display_name && (
                                <p className="text-sm text-slate-600">@{followedUser.username}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/users/${followedUser.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div>
              {followers.length === 0 ? (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
                  <p className="text-slate-600">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followers.map((follower) => (
                    <div
                      key={follower.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {follower.avatar_url && (
                          <img
                            src={follower.avatar_url}
                            alt={follower.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {follower.display_name || follower.username}
                          </h3>
                          {follower.display_name && (
                            <p className="text-sm text-slate-600">@{follower.username}</p>
                          )}
                          {follower.bio && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{follower.bio}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/users/${follower.id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

