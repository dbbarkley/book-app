'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import Link from 'next/link'
import {
  Search, Users, BookOpen, X, AlertCircle,
  BookMarked, Newspaper, Eye, Zap, Heart, Rocket,
  Wand2, Skull, Landmark, User, PenLine, TrendingUp,
  Briefcase, Brain, Feather, Star, Smile, LayoutGrid,
  ScanLine,
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
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl text-base font-medium outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-grove)',
                border: '2px solid var(--color-rim)',
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all"
                style={{ color: 'var(--color-lit-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
              >
                <ScanLine size={18} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all"
                  style={active
                    ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
                    : { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }
                  }
                >
                  <Icon size={15} />
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

        {/* ── EMPTY STATE (no query, no genre selected) ── */}
        {!isSearching && !selectedGenre && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--color-lit)' }}>
              <BookMarked size={20} style={{ color: 'var(--color-accent)' }} />
              Explore Genres
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mockGenres.map(genre => {
                const Icon = GENRE_ICONS[genre.id] || BookOpen
                return (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreSelect(genre)}
                    className="group flex flex-col items-center justify-center gap-3 h-28 rounded-2xl transition-all"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-rim)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-rim-accent)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-rim)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Icon size={22} style={{ color: 'var(--color-accent)' }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-center px-2 leading-tight" style={{ color: 'var(--color-lit)' }}>
                      {genre.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {books.map(book => (
                        <BookCard key={book.google_books_id || book.id} book={book} showDescription={false} coverSize="medium" />
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
