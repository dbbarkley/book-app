'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useAuth, apiClient, useUserList } from '@book-app/shared'
import {
  ChevronLeft, LogOut, Upload, X, Check,
  BookOpen, Download, User as UserIcon, List, Search, Plus, ChevronUp, ChevronDown,
} from 'lucide-react'
import type { UserBook } from '@book-app/shared'

import ProtectedRoute from '@/components/ProtectedRoute'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import Avatar from '@/components/Avatar'
import GenreSelector from '@/components/GenreSelector'
import AuthorSelector from '@/components/AuthorSelector'
import { mockGenres } from '@/utils/onboardingData'
import type { Author, Genre } from '@book-app/shared'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

interface ProfileFormData {
  display_name: string
  bio: string
  avatar_file: File | null
}

interface PreferencesFormData {
  genres: string[]
  author_ids: number[]
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
      <h2
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--color-lit-3)',
        }}
      >
        {title}
      </h2>
      {description && <p className="text-sm mt-1" style={{ color: 'var(--color-lit-2)' }}>{description}</p>}
    </div>
  )
}

function Toast({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm mb-4"
      style={type === 'success'
        ? { backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }
        : { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }
      }
    >
      {type === 'success' ? <Check size={15} /> : <X size={15} />}
      <span className="font-medium">{message}</span>
    </motion.div>
  )
}

function SettingsContent() {
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()

  const [loading, setLoading] = useState(true)

  // Top 10 list
  const { list: top10List, loading: top10Loading, saving: top10Saving,
          addBook: addToTop10, removeBook: removeFromTop10, reorder: reorderTop10 } =
    useUserList(user?.id, 'top_10')
  const [completedBooks, setCompletedBooks] = useState<UserBook[]>([])
  const [completedLoading, setCompletedLoading] = useState(false)
  const [bookQuery, setBookQuery] = useState('')
  const [top10Toast, setTop10Toast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Profile
  const [profileForm, setProfileForm] = useState<ProfileFormData>({ display_name: '', bio: '', avatar_file: null })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileToast, setProfileToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Preferences
  const [prefsForm, setPrefsForm] = useState<PreferencesFormData>({ genres: [], author_ids: [] })
  const [authors, setAuthors] = useState<Author[]>([])
  const [authorsLoading, setAuthorsLoading] = useState(true)
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false)
  const authorSearchId = useRef(0)
  // Stable ref holding the saved favourite authors so handleAuthorSearch
  // (a useCallback with no deps) can always merge them back in.
  const savedAuthorsRef = useRef<Author[]>([])
  const [genres] = useState<Genre[]>(mockGenres)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsToast, setPrefsToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfileForm({ display_name: user.display_name || '', bio: user.bio || '', avatar_file: null })
      fetchPreferencesAndAuthors()
    }
  }, [user])

  // Load completed books once (lazy — when the section first mounts)
  const fetchCompletedBooks = useCallback(async () => {
    if (completedBooks.length > 0) return  // already loaded
    setCompletedLoading(true)
    try {
      const { user_books } = await apiClient.getUserBooks({ shelf: 'read' })
      setCompletedBooks(user_books)
    } catch { /* non-fatal */ }
    finally { setCompletedLoading(false) }
  }, [completedBooks.length])

  // Trigger load when the list is first available (i.e. user is logged in)
  useEffect(() => {
    if (user?.id && !top10Loading) fetchCompletedBooks()
  }, [user?.id, top10Loading])

  // Client-side filter of completed books
  const filteredBooks = bookQuery.trim()
    ? completedBooks.filter(ub =>
        ub.book?.title?.toLowerCase().includes(bookQuery.toLowerCase()) ||
        ub.book?.author_name?.toLowerCase().includes(bookQuery.toLowerCase())
      )
    : completedBooks

  const handleTop10AddBook = async (userBook: UserBook) => {
    if (!userBook.book) return
    setBookQuery('')
    try {
      await addToTop10(userBook.book.id)
      setTop10Toast({ type: 'success', message: `"${userBook.book.title}" added to your Top 10` })
      setTimeout(() => setTop10Toast(null), 3000)
    } catch (e: any) {
      setTop10Toast({ type: 'error', message: e?.response?.data?.error ?? 'Failed to add book' })
    }
  }

  const handleTop10Remove = async (itemId: number) => {
    try {
      await removeFromTop10(itemId)
    } catch (e: any) {
      setTop10Toast({ type: 'error', message: e?.message ?? 'Failed to remove book' })
    }
  }

  const handleTop10MoveUp = async (index: number) => {
    const items = top10List?.items ?? []
    if (index === 0) return
    const above = items[index - 1]
    const current = items[index]
    await reorderTop10([
      { id: current.id, position: above.position },
      { id: above.id,   position: current.position },
    ])
  }

  const handleTop10MoveDown = async (index: number) => {
    const items = top10List?.items ?? []
    if (index === items.length - 1) return
    const below = items[index + 1]
    const current = items[index]
    await reorderTop10([
      { id: current.id, position: below.position },
      { id: below.id,   position: current.position },
    ])
  }

  const fetchPreferencesAndAuthors = async () => {
    try {
      const prefs = await apiClient.getPreferences()
      const authorIds = prefs.author_ids || []
      setPrefsForm({ genres: prefs.genres || [], author_ids: authorIds })
      // Pass saved author IDs so fetchAuthors can guarantee those are in the list
      await fetchAuthors(authorIds)
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async (savedAuthorIds: number[] = []) => {
    setAuthorsLoading(true)
    try {
      // Fetch the default browseable list and the saved favourites in parallel.
      // The favourites fetch ensures pills always show real names even if those
      // authors aren't in the top-100 alphabetical list.
      const [browseResult, savedResult] = await Promise.all([
        apiClient.getAuthors({ per_page: 100 }),
        savedAuthorIds.length ? apiClient.getAuthorsByIds(savedAuthorIds) : Promise.resolve({ authors: [] as Author[] }),
      ])
      const browse  = Array.isArray(browseResult) ? browseResult : browseResult.authors ?? []
      const saved   = savedResult.authors ?? []
      // Keep a stable copy so handleAuthorSearch can merge them back after a search reset
      savedAuthorsRef.current = saved
      const browseIds = new Set(browse.map((a: Author) => a.id))
      const missing = saved.filter((a: Author) => !browseIds.has(a.id))
      setAuthors([...browse, ...missing])
    } catch (err) {
      console.error('Failed to fetch authors:', err)
    } finally {
      setAuthorsLoading(false)
    }
  }

  const handleAuthorSearch = useCallback(async (query: string) => {
    const id = ++authorSearchId.current
    setAuthorSearchLoading(true)
    try {
      const result = query
        ? await apiClient.searchAuthors(query, 1, 50)
        : await apiClient.getAuthors({ per_page: 100 })
      if (id !== authorSearchId.current) return
      const fetched: Author[] = Array.isArray(result) ? result : result.authors || []
      if (query) {
        // During a search just show whatever the API returned — pills handle display
        setAuthors(fetched)
      } else {
        // When search is cleared, merge saved favourites back in so pills don't lose their names
        const fetchedIds = new Set(fetched.map((a: Author) => a.id))
        const missing = savedAuthorsRef.current.filter((a: Author) => !fetchedIds.has(a.id))
        setAuthors([...fetched, ...missing])
      }
    } catch (err) {
      console.error('Author search failed:', err)
    } finally {
      if (id === authorSearchId.current) setAuthorSearchLoading(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProfileToast({ type: 'error', message: 'Image too large — max 5 MB' })
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileToast({ type: 'error', message: 'Please upload a JPEG, PNG, or WebP image' })
      return
    }
    setProfileForm(prev => ({ ...prev, avatar_file: file }))
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    setProfileToast(null)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileToast(null)
    try {
      await apiClient.updateUser(user.id, {
        display_name: profileForm.display_name || undefined,
        bio: profileForm.bio || undefined,
        avatar: profileForm.avatar_file || undefined,
      })
      await refreshUser()
      setProfileForm(prev => ({ ...prev, avatar_file: null }))
      setAvatarPreview(null)
      setProfileToast({ type: 'success', message: 'Profile updated' })
    } catch (err) {
      setProfileToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update profile' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    setPrefsToast(null)
    try {
      await apiClient.savePreferences({ genres: prefsForm.genres, author_ids: prefsForm.author_ids })
      setPrefsToast({ type: 'success', message: 'Preferences saved' })
    } catch (err) {
      setPrefsToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save preferences' })
    } finally {
      setSavingPrefs(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="container-mobile py-8 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-24 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }} />
        <div className="h-64 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
        <div className="h-48 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
      </div>
    )
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <motion.div className="max-w-2xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
            style={{ color: 'var(--color-lit-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-2)')}
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--color-lit)' }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-lit-2)' }}>Manage your profile and preferences</p>
        </motion.div>

        {/* ── Public Profile ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden mb-5" style={cardStyle}>
          <SectionHeader title="Public Profile" description="Visible to other readers" />
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">

            {profileToast && <Toast type={profileToast.type} message={profileToast.message} />}

            {/* Avatar */}
            <div className="flex items-center gap-6 pb-6" style={{ borderBottom: '1px solid var(--color-rim)' }}>
              <Avatar
                src={avatarPreview || user.avatar_url}
                name={profileForm.display_name || user.username}
                size="xl"
              />
              <div className="space-y-2">
                <label className="cursor-pointer">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                  >
                    <Upload size={14} />
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </div>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarPreview(null); setProfileForm(prev => ({ ...prev, avatar_file: null })) }}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: 'var(--color-lit-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
                  >
                    <X size={12} /> Remove
                  </button>
                )}
                <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>JPG, PNG or WebP · max 5 MB</p>
              </div>
            </div>

            <InputField
              label="Display Name"
              type="text"
              value={profileForm.display_name}
              onChange={e => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="How you want to be known"
            />

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-lit-2)' }}>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell other readers about yourself…"
                rows={4}
                maxLength={500}
                className="block w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors resize-none"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-xs" style={{ color: profileForm.bio.length > 450 ? 'var(--color-accent)' : 'var(--color-lit-3)' }}>
                  {profileForm.bio.length}/500
                </span>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid var(--color-rim)' }}>
              <Button type="submit" variant="primary" isLoading={savingProfile} disabled={savingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </motion.div>

        {/* ── Preferences ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden mb-5" style={cardStyle}>
          <SectionHeader title="Preferences" description="Personalise your recommendations" />
          <div className="p-6 sm:p-8 space-y-8">

            {prefsToast && <Toast type={prefsToast.type} message={prefsToast.message} />}

            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
                <BookOpen size={15} style={{ color: 'var(--color-accent)' }} />
                Favourite Genres
              </h3>
              <GenreSelector genres={genres} selectedGenres={prefsForm.genres} onToggleGenre={id =>
                setPrefsForm(prev => ({
                  ...prev,
                  genres: prev.genres.includes(id) ? prev.genres.filter(g => g !== id) : [...prev.genres, id],
                }))
              } />
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
                <UserIcon size={15} style={{ color: 'var(--color-accent)' }} />
                Favourite Authors
              </h3>
              {authorsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
                  ))}
                </div>
              ) : (
                <AuthorSelector
                  authors={authors}
                  selectedAuthorIds={prefsForm.author_ids}
                  onSearch={handleAuthorSearch}
                  searchLoading={authorSearchLoading}
                  onToggleAuthor={id =>
                    setPrefsForm(prev => ({
                      ...prev,
                      author_ids: prev.author_ids.includes(id) ? prev.author_ids.filter(a => a !== id) : [...prev.author_ids, id],
                    }))
                  }
                />
              )}
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid var(--color-rim)' }}>
              <Button variant="primary" onClick={handleSavePrefs} isLoading={savingPrefs} disabled={savingPrefs}>
                Save Preferences
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── My Top 10 ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden mb-5" style={cardStyle}>
          <SectionHeader title="My Top 10" description="Your all-time favourite books, displayed on your profile" />
          <div className="p-6 sm:p-8 space-y-5">

            {top10Toast && <Toast type={top10Toast.type} message={top10Toast.message} />}

            {top10Loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
                ))}
              </div>
            ) : (
              <>
                {/* Item count */}
                <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                  {top10List?.items?.length ?? 0}/10 books added
                </p>

                {/* Current items */}
                {top10List?.items && top10List.items.length > 0 && (
                  <div className="space-y-2">
                    {top10List.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                        style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                      >
                        {/* Rank badge */}
                        <span
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                          style={{
                            backgroundColor: item.position === 1 ? 'rgba(201,168,76,0.15)' : 'var(--color-surface)',
                            border: `1px solid ${item.position === 1 ? 'var(--color-accent)' : 'var(--color-rim)'}`,
                            color: item.position === 1 ? 'var(--color-accent)' : 'var(--color-lit-2)',
                          }}
                        >
                          #{item.position}
                        </span>

                        {/* Cover */}
                        {item.book.cover_image_url ? (
                          <img
                            src={item.book.cover_image_url}
                            alt={item.book.title}
                            className="w-9 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-12 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-surface)' }}
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-lit)' }}>
                            {item.book.title}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-lit-3)' }}>
                            {item.book.author_name}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTop10MoveUp(index)}
                            disabled={index === 0 || top10Saving}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                            style={{ backgroundColor: 'var(--color-surface)' }}
                            title="Move up"
                          >
                            <ChevronUp size={14} style={{ color: 'var(--color-lit-2)' }} />
                          </button>
                          <button
                            onClick={() => handleTop10MoveDown(index)}
                            disabled={index === (top10List?.items?.length ?? 0) - 1 || top10Saving}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                            style={{ backgroundColor: 'var(--color-surface)' }}
                            title="Move down"
                          >
                            <ChevronDown size={14} style={{ color: 'var(--color-lit-2)' }} />
                          </button>
                          <button
                            onClick={() => handleTop10Remove(item.id)}
                            disabled={top10Saving}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-surface)' }}
                            title="Remove"
                          >
                            <X size={14} style={{ color: 'var(--color-lit-3)' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add book — pick from completed library */}
                {(top10List?.items?.length ?? 0) < 10 && (
                  <div className="space-y-3">
                    {/* Section label */}
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} style={{ color: 'var(--color-accent)' }} />
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-lit-2)' }}>
                        Add from your read books
                      </span>
                    </div>

                    {/* Filter input */}
                    <div
                      className="flex items-center gap-2 px-3 h-10 rounded-xl"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
                    >
                      <Search size={14} style={{ color: 'var(--color-lit-3)', flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Filter by title or author…"
                        value={bookQuery}
                        onChange={e => setBookQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: 'var(--color-lit)' }}
                      />
                      {bookQuery && (
                        <button onClick={() => setBookQuery('')} className="opacity-50 hover:opacity-100">
                          <X size={13} style={{ color: 'var(--color-lit-3)' }} />
                        </button>
                      )}
                    </div>

                    {/* Books grid */}
                    {completedLoading ? (
                      <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--color-lit-3)' }}>
                        <span className="text-sm animate-pulse">Loading your read books…</span>
                      </div>
                    ) : completedBooks.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: 'var(--color-lit-3)' }}>
                        No completed books yet — mark some books as Read in your library first!
                      </p>
                    ) : filteredBooks.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: 'var(--color-lit-3)' }}>
                        No books match "{bookQuery}"
                      </p>
                    ) : (
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{ border: '1px solid var(--color-rim)', backgroundColor: 'var(--color-surface)', maxHeight: '320px', overflowY: 'auto' }}
                      >
                        {filteredBooks.map((ub) => {
                          const book = ub.book
                          if (!book) return null
                          const alreadyAdded = top10List?.items?.some(i => i.book.id === book.id) ?? false
                          return (
                            <button
                              key={ub.id}
                              onClick={() => !alreadyAdded && handleTop10AddBook(ub)}
                              disabled={alreadyAdded || top10Saving}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                              style={{ borderBottom: '1px solid var(--color-rim)' }}
                              onMouseEnter={e => !alreadyAdded && (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                            >
                              {book.cover_image_url ? (
                                <img src={book.cover_image_url} alt={book.title} className="w-8 h-11 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-11 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--color-grove)' }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: alreadyAdded ? 'var(--color-lit-3)' : 'var(--color-lit)' }}>
                                  {book.title}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--color-lit-3)' }}>
                                  {book.author_name}
                                </p>
                                {ub.rating ? (
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-accent)' }}>
                                    {'★'.repeat(Math.round(ub.rating))}{'☆'.repeat(5 - Math.round(ub.rating))}
                                  </p>
                                ) : null}
                              </div>
                              {alreadyAdded ? (
                                <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg"
                                  style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)', border: '1px solid var(--color-rim)' }}>
                                  In list
                                </span>
                              ) : (
                                <Plus size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* ── Import ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden mb-5" style={cardStyle}>
          <SectionHeader title="Import Reading History" description="Bring your books over from other platforms" />
          <div className="p-6 sm:p-8 space-y-4">

            {/* Goodreads */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, var(--color-accent-subtle), rgba(201,168,76,0.04))', border: '1px solid var(--color-rim-accent)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  G
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-lit)' }}>Goodreads</h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-lit-2)' }}>Import your entire library, ratings and shelves in about a minute</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['All books', 'Ratings', 'Shelves'].map(label => (
                      <span key={label} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)' }}>
                        <Check size={11} style={{ color: 'var(--color-success)' }} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/import/goodreads')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    <Download size={14} />
                    Start Import
                  </button>
                </div>
              </div>
            </div>

            {/* StoryGraph — coming soon */}
            <div className="rounded-2xl p-5 opacity-40" style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  SG
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-lit)' }}>StoryGraph</h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-lit-2)' }}>Import your reading data from StoryGraph</p>
                  <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: 'var(--color-rim)', color: 'var(--color-lit-3)' }}>
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Account ── */}
        <motion.div variants={itemVariants} className="rounded-[28px] overflow-hidden mb-5" style={cardStyle}>
          <SectionHeader title="Account" />
          <div className="p-6 sm:p-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-rim)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>Username</span>
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-lit)' }}>@{user.username}</span>
              </div>
              <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-rim)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>Email</span>
                <span className="text-sm" style={{ color: 'var(--color-lit)' }}>{user.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>Member since</span>
                <span className="text-sm" style={{ color: 'var(--color-lit)' }}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => { logout(); router.push('/login') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-error)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-error)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
            >
              <LogOut size={15} />
              Sign out
            </button>
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
