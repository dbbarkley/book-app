'use client'

// Settings Page - Edit user profile and preferences
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useAuth, apiClient } from '@book-app/shared'

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
import { LogOut } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import GenreSelector from '@/components/GenreSelector'
import AuthorSelector from '@/components/AuthorSelector'
import { mockGenres } from '@/utils/onboardingData'
import type { Author, Genre } from '@book-app/shared'

interface ProfileFormData {
  display_name: string
  bio: string
  avatar_url: string
  zipcode: string
}

interface PreferencesFormData {
  genres: string[]
  author_ids: number[]
}

/**
 * Settings Page - Edit User Profile
 * 
 * Features:
 * - Edit display name
 * - Edit bio
 * - Edit avatar URL
 * - Save changes
 * 
 * For React Native:
 * - Replace Next.js navigation with React Navigation
 * - Use ImagePicker for avatar upload instead of URL
 * - Adjust styling to StyleSheet
 */
function SettingsContent() {
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)

  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    zipcode: '',
  })

  const [preferencesData, setPreferencesData] = useState<PreferencesFormData>({
    genres: [],
    author_ids: [],
  })

  const [authors, setAuthors] = useState<Author[]>([])
  const [genres] = useState<Genre[]>(mockGenres)

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        zipcode: user.zipcode || '',
      })
      fetchPreferences()
      fetchAuthors()
    }
  }, [user])

  const fetchPreferences = async () => {
    try {
      const preferences = await apiClient.getPreferences()
      setPreferencesData({
        genres: preferences.genres || [],
        author_ids: preferences.author_ids || [],
      })
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      // Continue with empty preferences if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const result = await apiClient.getAuthors()
      // Handle both array and object response formats
      const authorsList = Array.isArray(result) ? result : result.authors || []
      setAuthors(authorsList)
    } catch (err) {
      console.error('Failed to fetch authors:', err)
      // Continue with empty authors if fetch fails
    }
  }

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updatedUser = await apiClient.updateUser(user.id, {
        display_name: formData.display_name || undefined,
        bio: formData.bio || undefined,
        avatar_url: formData.avatar_url || undefined,
        zipcode: formData.zipcode || undefined,
      })

      // Refresh user data in auth store
      await refreshUser()
      setSuccess(true)

      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push(`/users/${user.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    setError(null)
    setPreferencesSuccess(false)

    try {
      await apiClient.savePreferences({
        genres: preferencesData.genres,
        author_ids: preferencesData.author_ids,
      })
      setPreferencesSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleToggleGenre = (genreId: string) => {
    setPreferencesData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((id) => id !== genreId)
        : [...prev.genres, genreId],
    }))
    setPreferencesSuccess(false)
  }

  const handleToggleAuthor = (authorId: number) => {
    setPreferencesData((prev) => ({
      ...prev,
      author_ids: prev.author_ids.includes(authorId)
        ? prev.author_ids.filter((id) => id !== authorId)
        : [...prev.author_ids, authorId],
    }))
    setPreferencesSuccess(false)
  }

  if (loading || !user) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <motion.div 
        className="max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Edit your profile information</p>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div variants={itemVariants} className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Profile Form */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Public Profile</h2>
            <p className="text-sm text-slate-500">This information will be shown on your public profile</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Display Name */}
              <InputField
                label="Display Name"
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Your display name"
                helperText="How you want to be known on the platform"
              />

              {/* Bio */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us about your favorite books, authors, or anything else!"
                  rows={4}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white placeholder:text-gray-400 px-3 py-2 text-base sm:text-sm"
                />
                <div className="mt-1.5 flex justify-between text-sm">
                  <span className="text-slate-500">A brief description about yourself</span>
                  <span className={formData.bio.length > 450 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                    {formData.bio.length}/500
                  </span>
                </div>
              </div>

              {/* Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-6 items-start">
                <InputField
                  label="Avatar URL"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleChange('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  helperText="Link to your profile picture"
                />
                
                {/* Avatar Preview */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="relative">
                    <img
                      src={formData.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={saving}
                >
                  Update Public Profile
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Private Information Section */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Private Information</h2>
            <p className="text-sm text-slate-500">This information is only visible to you</p>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            {/* Zipcode */}
            <InputField
              label="Zipcode"
              type="text"
              value={formData.zipcode}
              onChange={(e) => handleChange('zipcode', e.target.value)}
              placeholder="e.g. 90210"
              helperText="Used to find literary events near you"
            />

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed">
                <span className="text-slate-400">@</span>
                <span className="text-sm font-medium">{user.username}</span>
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-slate-400">Fixed</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 italic">
                Contact support to change your username
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button
                onClick={handleSubmit}
                variant="outline"
                isLoading={saving}
                disabled={saving}
              >
                Save Private Details
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div variants={itemVariants} className="mt-6 bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Preferences</h2>
          <p className="text-sm text-slate-600 mb-6">
            Update your favorite genres and authors to personalize your feed
          </p>

          {/* Success Message */}
          {preferencesSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">Preferences updated successfully!</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Genres */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Favorite Genres</h3>
              <GenreSelector
                genres={genres}
                selectedGenres={preferencesData.genres}
                onToggleGenre={handleToggleGenre}
              />
            </div>

            {/* Authors */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Favorite Authors</h3>
              {authors.length > 0 ? (
                <AuthorSelector
                  authors={authors}
                  selectedAuthorIds={preferencesData.author_ids}
                  onToggleAuthor={handleToggleAuthor}
                />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Loading authors...</p>
                </div>
              )}
            </div>

            {/* Save Preferences Button */}
            <div className="pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                onClick={handleSavePreferences}
                isLoading={savingPreferences}
                disabled={savingPreferences}
                fullWidth
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Import Library Section */}
        <motion.div variants={itemVariants} className="mt-6 bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Import Reading History</h2>
          <p className="text-sm text-slate-600 mb-6">
            Import your books, ratings, and shelves from other platforms to quickly populate your library
          </p>

          <div className="space-y-4">
            {/* Goodreads Import */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold text-xl">G</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Import from Goodreads</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Bring over your entire library, ratings, and reading status in about a minute
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-4">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All books
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ratings
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Shelves
                    </span>
                  </div>
                  <button
                    onClick={() => router.push('/import/goodreads')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Start Import
                  </button>
                </div>
              </div>
            </div>

            {/* Coming Soon - StoryGraph */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-lg">SG</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Import from StoryGraph</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Import your reading data from StoryGraph
                  </p>
                  <span className="inline-block text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Section */}
        <motion.div variants={itemVariants} className="mt-6 bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Account</h2>
            <button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Email</p>
              <p className="text-sm text-slate-600">{user.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Member Since</p>
              <p className="text-sm text-slate-600">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

