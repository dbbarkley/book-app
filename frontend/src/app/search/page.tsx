'use client'

// Unified Search Page - Search for users and authors
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { 
  useAuth, 
  useUserSearch, 
  useEnhancedAuthorSearch, 
  useBookSearch,
  useEvents,
  useVenues
} from '@book-app/shared'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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
import AuthorCard from '@/components/AuthorCard'
import BookCard from '@/components/BookCard'
import EventCard from '@/components/EventCard'
import VenueCard from '@/components/VenueCard'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import Link from 'next/link'
import type { User, Venue, Event } from '@book-app/shared'
import { Search, Users, UserCircle, Calendar, MapPin, BookOpen, X } from 'lucide-react'

type SearchType = 'books' | 'events' | 'bookstores' | 'people' | 'authors'

/**
 * Unified Search Page Content (wrapped in Suspense for useSearchParams)
 */
function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTab = (searchParams.get('type') as SearchType) || 'books'
  
  const { user: currentUser } = useAuth()
  const initialZipcode = searchParams.get('zipcode') || currentUser?.zipcode || ''

  const [activeTab, setActiveTab] = useState<SearchType>(initialTab)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [zipcodeInput, setZipcodeInput] = useState(initialZipcode)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-fill zipcode from user profile when it becomes available
  useEffect(() => {
    if (!zipcodeInput && currentUser?.zipcode) {
      setZipcodeInput(currentUser.zipcode)
    }
  }, [currentUser?.zipcode, zipcodeInput])

  // 1. Book search
  const {
    books,
    loading: booksLoading,
    error: booksError,
    query: booksQuery,
    search: searchBooks,
    loadMore: loadMoreBooks,
    hasMore: hasMoreBooks,
  } = useBookSearch({
    debounceMs: 500,
    initialQuery: activeTab === 'books' ? initialQuery : '',
    perPage: 20,
  })

  // 2. Author search (with Google Books)
  const {
    authors,
    loading: authorsLoading,
    error: authorsError,
    query: authorsQuery,
    search: searchAuthors,
    loadMore: loadMoreAuthors,
    hasMore: hasMoreAuthors,
    source: authorsSource,
  } = useEnhancedAuthorSearch({
    debounceMs: 500,
    initialQuery: activeTab === 'authors' ? initialQuery : '',
    pageSize: 20,
    includeGoogleBooks: true,
  })

  // 3. User (People) search
  const {
    users,
    loading: usersLoading,
    error: usersError,
    query: usersQuery,
    search: searchUsers,
    loadMore: loadMoreUsers,
    hasMore: hasMoreUsers,
  } = useUserSearch({
    debounceMs: 500,
    initialQuery: activeTab === 'people' ? initialQuery : '',
    pageSize: 20,
  })
  const filteredUsers = users.filter((user) => user.id !== currentUser?.id)

  // 4. Events search
  const eventParams = useMemo(() => ({
    autoFetch: activeTab === 'events',
    zipcode: zipcodeInput || undefined,
    radius: zipcodeInput ? 50 : undefined,
    per_page: 20,
  }), [activeTab, zipcodeInput])

  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    loadMore: loadMoreEvents,
    hasMore: hasMoreEvents,
  } = useEvents(eventParams)

  // 5. Venues (Bookstores) search
  const venueParams = useMemo(() => ({
    zipcode: activeTab === 'bookstores' ? zipcodeInput : undefined,
    radius: activeTab === 'bookstores' && zipcodeInput ? 50 : undefined,
  }), [activeTab, zipcodeInput])

  const {
    venues,
    isLoading: venuesLoading,
    error: venuesError,
  } = useVenues(venueParams)
  const bookstores = venues.filter((v: Venue) => v.venue_type === 'bookstore')

  // Sync search input with active tab's query
  useEffect(() => {
    let currentQuery = ''
    if (activeTab === 'books') currentQuery = booksQuery
    else if (activeTab === 'authors') currentQuery = authorsQuery
    else if (activeTab === 'people') currentQuery = usersQuery
    
    if (currentQuery !== searchInput && (activeTab === 'books' || activeTab === 'authors' || activeTab === 'people')) {
      setSearchInput(currentQuery)
    }
  }, [activeTab, booksQuery, authorsQuery, usersQuery])

  // Focus search input on mount
  useEffect(() => {
    if (activeTab !== 'bookstores' && activeTab !== 'events') {
      searchInputRef.current?.focus()
    }
  }, [activeTab])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    
    if (activeTab === 'books') searchBooks(value)
    else if (activeTab === 'people') searchUsers(value)
    else if (activeTab === 'authors') searchAuthors(value)

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set('q', value)
    else params.delete('q')
    params.set('type', activeTab)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const handleZipcodeChange = (value: string) => {
    setZipcodeInput(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set('zipcode', value)
    else params.delete('zipcode')
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', tab)
    if (searchInput.trim() && (tab === 'books' || tab === 'authors' || tab === 'people')) {
      params.set('q', searchInput)
    }
    router.replace(`/search?${params.toString()}`, { scroll: false })

    // Trigger search for the new tab
    if (searchInput.trim()) {
      if (tab === 'books') searchBooks(searchInput)
      else if (tab === 'people') searchUsers(searchInput)
      else if (tab === 'authors') searchAuthors(searchInput)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    if (activeTab === 'books') searchBooks('')
    else if (activeTab === 'people') searchUsers('')
    else if (activeTab === 'authors') searchAuthors('')
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const getLoading = () => {
    if (activeTab === 'books') return booksLoading
    if (activeTab === 'authors') return authorsLoading
    if (activeTab === 'people') return usersLoading
    if (activeTab === 'events') return eventsLoading
    if (activeTab === 'bookstores') return venuesLoading
    return false
  }

  const getError = () => {
    if (activeTab === 'books') return booksError
    if (activeTab === 'authors') return authorsError
    if (activeTab === 'people') return usersError
    if (activeTab === 'events') return eventsError
    if (activeTab === 'bookstores') return venuesError
    return null
  }

  const loading = getLoading()
  const error = getError()

  const tabs: { id: SearchType; label: string; icon: any }[] = [
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'authors', label: 'Authors', icon: UserCircle },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'bookstores', label: 'Bookstores', icon: MapPin },
    { id: 'people', label: 'People', icon: Users },
  ]

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Discover</h1>
          <p className="text-text-secondary text-lg">Find your next favorite book, author, or event.</p>
        </div>

        {/* Tabs - Scrolling on mobile */}
        <div className="flex overflow-x-auto pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${
                  activeTab === tab.id
                    ? 'bg-brand-indigo text-white border-brand-indigo'
                    : 'bg-background-card text-text-secondary border-border-default hover:border-brand-indigo/30 hover:text-text-primary'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Controls */}
        <div className="bg-background-card rounded-3xl border border-border-default p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Main Search Input */}
            <div className="flex-1 relative">
              <InputField
                ref={searchInputRef}
                type="text"
                placeholder={
                  activeTab === 'books' ? 'Search by title, ISBN, or description...' :
                  activeTab === 'authors' ? 'Search authors by name...' :
                  activeTab === 'people' ? 'Search users by name or bio...' :
                  activeTab === 'events' ? 'Search upcoming literary events...' :
                  'Search for bookstores near you...'
                }
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 pr-12 h-14 rounded-2xl bg-background-muted/50 border-none focus:ring-2 focus:ring-brand-indigo"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Zipcode Filter for Events/Bookstores */}
            {(activeTab === 'events' || activeTab === 'bookstores') && (
              <div className="md:w-64 relative">
                <InputField
                  type="text"
                  placeholder="Zipcode..."
                  value={zipcodeInput}
                  onChange={(e) => handleZipcodeChange(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-background-muted/50 border-none focus:ring-2 focus:ring-brand-indigo"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              </div>
            )}
          </div>
          
          {activeTab === 'authors' && authorsSource === 'google' && (
            <p className="mt-4 text-xs text-text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse"></span>
              Powered by Google Books API
            </p>
          )}

          {(activeTab === 'events' || activeTab === 'bookstores') && zipcodeInput && (
            <p className="mt-4 text-xs text-text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo"></span>
              Searching within 50 miles of {zipcodeInput}
              {activeTab === 'events' && events.length > 0 && events[0].venue?.city && (
                <span className="font-semibold"> ({events[0].venue.city})</span>
              )}
              {activeTab === 'bookstores' && bookstores.length > 0 && bookstores[0].city && (
                <span className="font-semibold"> ({bookstores[0].city})</span>
              )}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Results Area */}
        <div className="min-h-[400px]">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-indigo/20 border-t-brand-indigo rounded-full animate-spin mb-4"></div>
              <p className="text-text-secondary font-medium animate-pulse">
                Discovering {activeTab}...
              </p>
            </div>
          )}

          {/* Empty States */}
          {!loading && !error && (
            <>
              {/* Initial State */}
              {((activeTab === 'books' || activeTab === 'authors' || activeTab === 'people') && !searchInput.trim()) && (
                <div className="text-center py-20">
                  <div className="bg-background-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="text-text-muted" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Ready to explore?</h3>
                  <p className="text-text-secondary max-w-md mx-auto">
                    Start typing to search for {activeTab === 'people' ? 'friends' : activeTab}.
                  </p>
                </div>
              )}

              {/* No Results */}
              {((activeTab === 'books' && books.length === 0 && searchInput.trim()) ||
                (activeTab === 'authors' && authors.length === 0 && searchInput.trim()) ||
                (activeTab === 'people' && filteredUsers.length === 0 && searchInput.trim()) ||
                (activeTab === 'events' && events.length === 0) ||
                (activeTab === 'bookstores' && bookstores.length === 0)) && (
                <div className="text-center py-20 bg-background-card rounded-3xl border border-dashed border-border-default">
                  <h3 className="text-xl font-bold text-text-primary mb-2">No {activeTab} found</h3>
                  <p className="text-text-secondary">
                    {activeTab === 'events' || activeTab === 'bookstores' 
                      ? `Try searching in a different zipcode or clearing your filters.`
                      : "Try adjusting your search terms to find what you're looking for."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Results Lists */}
          {!loading && !error && (
            <div className="animate-in fade-in duration-500">
              {/* Books */}
              {activeTab === 'books' && books.length > 0 && (
                <motion.div 
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {books.map((book) => (
                    <motion.div key={book.google_books_id || book.id} variants={itemVariants}>
                      <BookCard book={book} />
                    </motion.div>
                  ))}
                  {hasMoreBooks && (
                    <div className="col-span-full pt-8 text-center">
                      <Button variant="outline" onClick={loadMoreBooks} className="rounded-2xl px-8 py-3">
                        Load More Books
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Authors */}
              {activeTab === 'authors' && authors.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {authors.map((author) => (
                    <motion.div key={author.id || `ext-${author.name}`} variants={itemVariants}>
                      <AuthorCard 
                        author={author} 
                        showFollowButton={author.id > 0}
                      />
                    </motion.div>
                  ))}
                  {hasMoreAuthors && (
                    <div className="col-span-full pt-8 text-center">
                      <Button variant="outline" onClick={loadMoreAuthors} className="rounded-2xl px-8 py-3">
                        Load More Authors
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* People */}
              {activeTab === 'people' && filteredUsers.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredUsers.map((user) => (
                    <motion.div key={user.id} variants={itemVariants}>
                      <Link
                        href={`/users/${user.id}`}
                        className="flex items-center gap-4 bg-background-card p-5 rounded-3xl border border-border-default hover:shadow-xl transition-all duration-300 group h-full"
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-background-muted flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-indigo font-bold text-2xl">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-text-primary text-lg truncate group-hover:text-brand-indigo transition-colors">
                            {user.display_name || user.username}
                          </h4>
                          <p className="text-text-secondary text-sm">@{user.username}</p>
                          {user.bio && <p className="text-text-muted text-xs mt-1 line-clamp-1 italic">{user.bio}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                  {hasMoreUsers && (
                    <div className="col-span-full pt-8 text-center">
                      <Button variant="outline" onClick={loadMoreUsers} className="rounded-2xl px-8 py-3">
                        Load More People
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Events */}
              {activeTab === 'events' && events.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {events.map((event) => (
                    <motion.div key={event.id} variants={itemVariants}>
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                  {hasMoreEvents && (
                    <div className="col-span-full pt-8 text-center">
                      <Button variant="outline" onClick={loadMoreEvents} className="rounded-2xl px-8 py-3">
                        Load More Events
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Bookstores */}
              {activeTab === 'bookstores' && bookstores.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {bookstores.map((venue: Venue) => (
                    <motion.div key={venue.id} variants={itemVariants}>
                      <VenueCard venue={venue} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


/**
 * Unified Search Page
 * 
 * Features:
 * - Search for users (local database)
 * - Search for authors (local database + Google Books API)
 * - Tab-based navigation
 * - Debounced search input
 * - URL query parameter sync
 * - Mobile-first responsive layout
 * 
 * For React Native:
 * - Replace Next.js navigation with React Navigation
 * - Replace InputField with TextInput
 * - Use FlatList for better performance
 * - Adjust styling to StyleSheet
 */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-mobile py-20 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-indigo/20 border-t-brand-indigo rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary font-medium">Loading Discovery...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}

