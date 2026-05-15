'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  useAuth,
  useUserSearch,
  useBookSearch,
  apiClient,
} from '@book-app/shared'
import { mockGenres } from '@/utils/onboardingData'

import BookCard from '@/components/BookCard'
import Button from '@/components/Button'
import Avatar from '@/components/Avatar'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import { BookCoverImage } from '@/components/BookCoverImage'
import Link from 'next/link'
import {
  Search, Users, BookOpen, X, AlertCircle,
  Newspaper, Eye, Zap, Heart, Rocket,
  Wand2, Skull, Landmark, User, PenLine, TrendingUp,
  Briefcase, Brain, Feather, Star, Smile, LayoutGrid,
  ScanLine, CalendarDays, ChevronRight,
} from 'lucide-react'

type SearchType = 'books' | 'people'

// Map genre IDs to Lucide icons
const GENRE_ICONS: Record<string, React.ElementType> = {
  'fiction':      BookOpen,
  'non-fiction':  Newspaper,
  'mystery':      Eye,
  'thriller':     Zap,
  'romance':      Heart,
  'sci-fi':       Rocket,
  'fantasy':      Wand2,
  'horror':       Skull,
  'historical':   Landmark,
  'biography':    User,
  'memoir':       PenLine,
  'self-help':    TrendingUp,
  'business':     Briefcase,
  'philosophy':   Brain,
  'poetry':       Feather,
  'young-adult':  Star,
  'children':     Smile,
  'graphic-novel':LayoutGrid,
}

// Per-genre accent colors — used for category tile icon backgrounds and borders.
const GENRE_COLORS: Record<string, string> = {
  'fiction':       '#5B7FA6',
  'non-fiction':   '#5A9B72',
  'mystery':       '#8B6CC7',
  'thriller':      '#C9A84C',
  'romance':       '#D4872A',
  'sci-fi':        '#5B7FA6',
  'fantasy':       '#8B6CC7',
  'horror':        '#A14B4B',
  'historical':    '#A07830',
  'biography':     '#5A9B72',
  'memoir':        '#6BAD8B',
  'self-help':     '#5A9B72',
  'business':      '#5B7FA6',
  'philosophy':    '#8B6CC7',
  'poetry':        '#D4872A',
  'young-adult':   '#C9A84C',
  'children':      '#6BAD8B',
  'graphic-novel': '#8B6CC7',
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type')
  // Default to 'books' — drop the confusing 'all' tab
  const initialTab: SearchType =
    initialType === 'people' ? 'people' : 'books'

  const { user: currentUser } = useAuth()

  const [activeTab, setActiveTab] = useState<SearchType>(initialTab)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Genre browsing state — separate from text search
  const [selectedGenre, setSelectedGenre] = useState<{ id: string; name: string } | null>(null)
  const [genreBooks, setGenreBooks] = useState<any[]>([])
  const [genreSource, setGenreSource] = useState<string | null>(null)
  const [genreLoading, setGenreLoading] = useState(false)

  const isSearching = searchInput.trim().length > 0

  const {
    books,
    loading: booksLoading,
    error: booksError,
    search: searchBooks,
    loadMore: loadMoreBooks,
    hasMore: hasMoreBooks,
  } = useBookSearch({
    debounceMs: 600,
    initialQuery: activeTab === 'books' ? initialQuery : '',
    perPage: 20,
  })

  const {
    users,
    loading: usersLoading,
    search: searchUsers,
    loadMore: loadMoreUsers,
    hasMore: hasMoreUsers,
  } = useUserSearch({
    debounceMs: 600,
    initialQuery: activeTab === 'people' ? initialQuery : '',
    pageSize: 20,
  })

  const filteredUsers = users.filter(u => u.id !== currentUser?.id)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    // Typing clears any active genre browse
    if (selectedGenre) {
      setSelectedGenre(null)
      setGenreBooks([])
    }
    if (activeTab === 'books') searchBooks(value)
    if (activeTab === 'people') searchUsers(value)

    const params = new URLSearchParams()
    params.set('type', activeTab)
    if (value.trim()) params.set('q', value)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const handleGenreSelect = async (genre: { id: string; name: string }) => {
    setSelectedGenre(genre)
    setGenreBooks([])
    setGenreLoading(true)
    setSearchInput('')
    try {
      const token = apiClient.getToken()
      const res = await fetch(`/api/books/genre?id=${genre.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setGenreBooks(data.books ?? [])
      setGenreSource(data._source ?? null)
    } catch (err) {
      console.error('Genre fetch failed:', err)
    } finally {
      setGenreLoading(false)
    }
  }

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
    setSelectedGenre(null)
    setGenreBooks([])
    const params = new URLSearchParams()
    params.set('type', tab)
    if (searchInput.trim()) params.set('q', searchInput)
    router.replace(`/search?${params.toString()}`, { scroll: false })

    if (searchInput.trim()) {
      if (tab === 'books') searchBooks(searchInput)
      if (tab === 'people') searchUsers(searchInput)
    }
  }

  const tabs: { id: SearchType; label: string; icon: React.ElementType }[] = [
    { id: 'books',  label: 'Books',  icon: BookOpen },
    { id: 'people', label: 'People', icon: Users    },
  ]

  const isRateLimited =
    booksError?.includes('429') || booksError?.includes('Too Many')

  return (
    <div className="container-mobile py-6 sm:py-10">
      <div className="max-w-5xl mx-auto">

        {/* Search bar + tabs */}
        <div className="mb-10">
          {/* Input */}
          <div className="relative group mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-accent"
              size={20}
              style={{ color: 'var(--color-lit-3)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}

              placeholder={activeTab === 'books' ? 'Search titles, authors, ISBN…' : 'Search readers by name or username…'}
              className="w-full pl-12 text-base font-medium outline-none transition-all"
              style={{
                height: 48,
                paddingRight: activeTab === 'books' ? 52 : 44,
                borderRadius: 14,
                backgroundColor: 'var(--color-grove)',
                border: '1px solid var(--color-rim)',
                color: 'var(--color-lit)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
            />
            {searchInput ? (
              <button
                onClick={() => handleSearchChange('')}

                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors"
                style={{ color: 'var(--color-lit-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
              >
                <X size={16} />
              </button>
            ) : activeTab === 'books' && (
              <button
                onClick={() => setScannerOpen(true)}
                title="Scan book barcode"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  color: 'var(--color-accent)',
                }}
              >
                <ScanLine size={16} />
              </button>
            )}
          </div>

          {/* Segment toggle (Books / People) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              borderRadius: 12,
              padding: 3,
            }}
          >
            {tabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    backgroundColor: active ? 'var(--color-grove)' : 'transparent',
                    color: active ? 'var(--color-lit)' : 'var(--color-lit-2)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── GENRE BROWSE ── */}
        {!isSearching && selectedGenre && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setSelectedGenre(null); setGenreBooks([]) }}
                className="flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-lit-3)' }}
              >
                ← All Genres
              </button>
              <span style={{ color: 'var(--color-rim)' }}>·</span>
              <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--color-lit)' }}>
                {selectedGenre.name}
              </h2>
              {genreSource === 'nyt' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)', border: '1px solid var(--color-rim)' }}>
                  NYT Bestsellers
                </span>
              )}
            </div>

            {genreLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="rounded-[28px] overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
                    <div className="w-full" style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)' }} />
                    <div className="p-4 space-y-2">
                      <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-grove)' }} />
                      <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-grove)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : genreBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {genreBooks.map((book, i) => (
                  <BookCard key={book.google_books_id ?? book.isbn ?? i} book={book} showDescription={false} coverSize="medium" />
                ))}
              </div>
            ) : (
              <div className="py-16 rounded-2xl text-center" style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}>
                <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
                <p className="font-semibold" style={{ color: 'var(--color-lit-2)' }}>No books found for this genre</p>
              </div>
            )}
          </section>
        )}

        {/* ── DISCOVER HOME (no query, no genre selected) ── */}
        {!isSearching && !selectedGenre && (
          <div className="space-y-10">

            {/* ── Upcoming Releases entry card ── */}
            <Link
              href="/upcoming-releases"
              className="flex items-center gap-3 transition-all w-full"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 16,
                border: '1px solid rgba(74,124,89,0.375)',
                padding: 14,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: 'rgba(74,124,89,0.2)',
                }}
              >
                <CalendarDays size={22} style={{ color: '#6BAD8B' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ color: 'var(--color-lit)', fontSize: 15, fontWeight: 700 }}>
                  Upcoming Releases
                </h3>
                <p style={{ color: 'var(--color-lit-3)', fontSize: 11, marginTop: 2 }}>
                  Browse by week or month · Filter by genre
                </p>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-lit-3)' }} className="flex-shrink-0" />
            </Link>

            {/* ── Browse Categories ── */}
            <section>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-lit-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: 12,
                }}
              >
                Browse Categories
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mockGenres.map(genre => {
                  const Icon = GENRE_ICONS[genre.id] || BookOpen
                  const color = GENRE_COLORS[genre.id] || 'var(--color-accent)'
                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreSelect(genre)}
                      className="flex flex-col transition-all"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: `1px solid ${color}40`,
                        borderRadius: 16,
                        padding: 12,
                        gap: 6,
                        alignItems: 'flex-start',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: `${color}22`,
                        }}
                      >
                        <Icon size={20} style={{ color }} />
                      </div>
                      <span
                        className="text-left"
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-lit)', lineHeight: '16px' }}
                      >
                        {genre.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

          </div>
        )}

        {/* ── RESULTS ── */}
        {isSearching && (
          <div className="space-y-6">

            {/* Rate limit warning */}
            {isRateLimited && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-2xl text-sm"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim-accent)', color: 'var(--color-lit-2)' }}
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                <p>
                  <span className="font-semibold" style={{ color: 'var(--color-lit)' }}>Search temporarily unavailable.</span>
                  {' '}Google Books free-tier rate limit reached. Results will be available again shortly — try again in a few minutes.
                </p>
              </div>
            )}

            {/* Books results */}
            {activeTab === 'books' && (
              <section>
                <div className="flex items-center justify-between mb-5 px-1">
                  <h3 className="font-serif text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
                    <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
                    Books
                  </h3>
                  {!booksLoading && books.length > 0 && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
                      {books.length} results
                    </span>
                  )}
                </div>

                {booksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="rounded-[28px] overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
                        <div className="w-full" style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)' }} />
                        <div className="p-4 space-y-2">
                          <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-grove)' }} />
                          <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-grove)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : books.length > 0 ? (
                  <>
                    {/* List-view rows — cover + info, navigates to detail */}
                    <div>
                      {books.map((book, i) => (
                        <div key={book.google_books_id || book.id || i}>
                          {i > 0 && (
                            <div style={{ height: 1, backgroundColor: 'var(--color-rim)' }} />
                          )}
                          <button
                            onClick={() => router.push(`/books/${book.google_books_id ?? book.id}`)}
                            className="w-full flex items-center text-left"
                            style={{ gap: 12, padding: '12px 0' }}
                          >
                            {/* Cover */}
                            <div
                              className="flex-none overflow-hidden shadow-md"
                              style={{ width: 52, aspectRatio: '2/3', borderRadius: 8 }}
                            >
                              <BookCoverImage
                                src={book.cover_image_url}
                                title={book.title}
                                author={book.author_name}
                                size="small"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-lit)' }}>
                                {book.title}
                              </p>
                              {book.author_name && (
                                <p className="truncate" style={{ fontSize: 12, color: 'var(--color-lit-2)' }}>
                                  {book.author_name}
                                </p>
                              )}
                              {book.release_date && (
                                <p style={{ fontSize: 11, color: 'var(--color-lit-3)' }}>
                                  {String(book.release_date).slice(0, 4)}
                                </p>
                              )}
                            </div>
                            {/* Action */}
                            <span
                              className="flex items-center justify-center flex-none"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 9999,
                                backgroundColor: 'var(--color-accent)',
                              }}
                            >
                              <ChevronRight size={18} style={{ color: 'var(--color-accent-on)' }} />
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                    {hasMoreBooks && (
                      <div className="mt-6 text-center">
                        <Button variant="outline" onClick={loadMoreBooks} className="px-8 rounded-xl">
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                ) : !isRateLimited ? (
                  <div
                    className="py-16 rounded-2xl text-center"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
                  >
                    <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
                    <p className="font-semibold mb-1" style={{ color: 'var(--color-lit-2)' }}>
                      No books found for &ldquo;{searchInput}&rdquo;
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                      Try checking the spelling or searching by author name.
                    </p>
                  </div>
                ) : null}
              </section>
            )}

            {/* People results */}
            {activeTab === 'people' && (
              <section>
                <div className="flex items-center justify-between mb-5 px-1">
                  <h3 className="font-serif text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
                    <Users size={18} style={{ color: 'var(--color-accent)' }} />
                    People
                  </h3>
                  {!usersLoading && filteredUsers.length > 0 && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)' }}>
                      {filteredUsers.length} results
                    </span>
                  )}
                </div>

                {usersLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-grove)' }} />
                    ))}
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {filteredUsers.map(user => (
                        <Link
                          key={user.id}
                          href={`/users/${user.id}`}
                          className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
                          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                        >
                          <Avatar src={user.avatar_url} name={user.display_name || user.username} size="md" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate transition-colors group-hover:text-accent" style={{ color: 'var(--color-lit)' }}>
                              {user.display_name || user.username}
                            </h4>
                            <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{user.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {hasMoreUsers && (
                      <div className="mt-6 text-center">
                        <Button variant="outline" onClick={loadMoreUsers} className="px-8 rounded-xl">
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="py-16 rounded-2xl text-center"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
                  >
                    <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
                    <p className="font-semibold mb-1" style={{ color: 'var(--color-lit-2)' }}>
                      No readers found for &ldquo;{searchInput}&rdquo;
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                      Try searching by username or display name.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="container-mobile py-10 animate-pulse max-w-5xl mx-auto">
        <div className="h-10 w-40 rounded-2xl mb-10" style={{ backgroundColor: 'var(--color-grove)' }} />
        <div className="h-14 w-full rounded-2xl mb-6" style={{ backgroundColor: 'var(--color-grove)' }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--color-grove)' }} />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
