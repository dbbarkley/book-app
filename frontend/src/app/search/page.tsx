'use client'

// Unified Search Page - Search for books, events, and people
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  useAuth, 
  useUserSearch, 
  useBookSearch,
  useEvents,
  useVenues,
  useMilestones
} from '@book-app/shared'
import { mockGenres } from '@/utils/onboardingData'

import BookCard from '@/components/BookCard'
import EventCard from '@/components/EventCard'
import VenueCard from '@/components/VenueCard'
import Button from '@/components/Button'
import Avatar from '@/components/Avatar'
import { Spotlight } from '@/components/onboarding/Spotlight'
import Link from 'next/link'
import type { Venue } from '@book-app/shared'
import { Search, Users, Calendar, MapPin, BookOpen, X, Sparkles } from 'lucide-react'

type SearchType = 'all' | 'books' | 'events' | 'bookstores' | 'people'

/**
 * Unified Search Page Content (wrapped in Suspense for useSearchParams)
 */
function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTab = (searchParams.get('type') as SearchType) || 'all'
  
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

  const isAllTab = activeTab === 'all'
  const isSearching = searchInput.trim().length > 0 || (zipcodeInput && (activeTab === 'events' || activeTab === 'bookstores'))

  // 1. Book search
  const {
    books,
    loading: booksLoading,
    query: booksQuery,
    search: searchBooks,
    loadMore: loadMoreBooks,
    hasMore: hasMoreBooks,
  } = useBookSearch({
    debounceMs: 500,
    initialQuery: (activeTab === 'books' || isAllTab) ? initialQuery : '',
    perPage: isAllTab ? 4 : 20,
  })

  // 2. User (People) search
  const {
    users,
    loading: usersLoading,
    query: usersQuery,
    search: searchUsers,
    loadMore: loadMoreUsers,
    hasMore: hasMoreUsers,
  } = useUserSearch({
    debounceMs: 500,
    initialQuery: (activeTab === 'people' || isAllTab) ? initialQuery : '',
    pageSize: isAllTab ? 4 : 20,
  })
  const filteredUsers = users.filter((user) => user.id !== currentUser?.id)

  // 3. Events search
  const eventParams = useMemo(() => ({
    autoFetch: activeTab === 'events' || isAllTab,
    zipcode: zipcodeInput || undefined,
    radius: zipcodeInput ? 50 : undefined,
    per_page: isAllTab ? 4 : 20,
  }), [activeTab, isAllTab, zipcodeInput])

  const {
    events,
    isLoading: eventsLoading,
    loadMore: loadMoreEvents,
    hasMore: hasMoreEvents,
  } = useEvents(eventParams)

  // 4. Venues (Bookstores) search
  const venueParams = useMemo(() => ({
    zipcode: (activeTab === 'bookstores' || isAllTab) ? zipcodeInput : undefined,
    radius: (activeTab === 'bookstores' || isAllTab) && zipcodeInput ? 50 : undefined,
  }), [activeTab, isAllTab, zipcodeInput])

  const {
    venues,
    isLoading: venuesLoading,
  } = useVenues(venueParams)
  const bookstores = venues.filter((v: Venue) => v.venue_type === 'bookstore')

  const { 
    hasViewedMilestone, 
    markMilestoneViewed 
  } = useMilestones()

  // Sync search input with active tab's query
  useEffect(() => {
    let currentQuery = ''
    if (activeTab === 'books') currentQuery = booksQuery
    else if (activeTab === 'people') currentQuery = usersQuery
    else if (isAllTab) currentQuery = booksQuery || usersQuery // Use either as baseline
    
    if (currentQuery !== searchInput && (activeTab === 'books' || activeTab === 'people' || isAllTab)) {
      if (!searchInput && currentQuery) setSearchInput(currentQuery)
    }
  }, [activeTab, booksQuery, usersQuery, isAllTab, searchInput])

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    
    // Trigger all searches if in 'all' tab
    if (isAllTab || activeTab === 'books') searchBooks(value)
    if (isAllTab || activeTab === 'people') searchUsers(value)

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
    if (searchInput.trim()) {
      params.set('q', searchInput)
    }
    router.replace(`/search?${params.toString()}`, { scroll: false })

    // Trigger search for the new tab
    if (searchInput.trim()) {
      if (tab === 'all' || tab === 'books') searchBooks(searchInput)
      if (tab === 'all' || tab === 'people') searchUsers(searchInput)
    }
  }

  const tabs: { id: SearchType; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'people', label: 'People', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'bookstores', label: 'Bookstores', icon: MapPin },
  ]

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-2 text-center sm:text-left">
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Discover</h1>
          <p className="text-text-secondary text-lg">Find books, events, and book lovers near you.</p>
        </div>

        {/* Search Bar & Filters */}
        <div className="sticky top-[72px] z-40 bg-background-default/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-8 border-b border-border-default/50 sm:relative sm:top-0 sm:bg-transparent sm:backdrop-none sm:p-0 sm:border-none sm:mb-12">
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-indigo transition-colors" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search titles, authors, genres..."
                className="w-full pl-12 pr-4 py-4 bg-background-elevated border-2 border-border-default rounded-3xl focus:border-brand-indigo outline-none transition-all text-text-primary text-lg shadow-sm focus:shadow-md"
              />
              {searchInput && (
                <button 
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background-muted rounded-full transition-colors"
                >
                  <X size={18} className="text-text-muted" />
                </button>
              )}
            </div>
            
            {(activeTab === 'events' || activeTab === 'bookstores' || isAllTab) && (
              <div className="sm:w-48 relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-indigo transition-colors" size={20} />
                <input
                  type="text"
                  value={zipcodeInput}
                  onChange={(e) => handleZipcodeChange(e.target.value)}
                  placeholder="Zipcode"
                  className="w-full pl-12 pr-4 py-4 bg-background-elevated border-2 border-border-default rounded-3xl focus:border-brand-indigo outline-none transition-all text-text-primary text-lg shadow-sm focus:shadow-md"
                />
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isEventTab = tab.id === 'events'

              const tabButton = (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all whitespace-nowrap border-2 ${
                    isActive 
                      ? 'bg-brand-indigo text-white border-brand-indigo shadow-md scale-105' 
                      : 'bg-background-elevated text-text-secondary border-transparent hover:border-border-default'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )

              if (isEventTab) {
                return (
                  <Spotlight
                    key={tab.id}
                    isVisible={!hasViewedMilestone('local_connection')}
                    message="Find more than just books—look for local signings and indie bookstores here."
                    onDismiss={() => markMilestoneViewed('local_connection')}
                    position="bottom"
                  >
                    {tabButton}
                  </Spotlight>
                )
              }

              return tabButton
            })}
          </div>
        </div>

        {/* Dynamic Content */}
        {!isSearching ? (
          /* DULLED DOWN DASHBOARD VIEW (Recommendations hidden) */
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Intro */}
            <section className="text-center py-12 px-6 bg-gradient-to-br from-brand-indigo/10 via-brand-purple/5 to-transparent rounded-[40px] border border-brand-indigo/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-indigo rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-purple rounded-full blur-[100px]" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-brand-indigo text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl rotate-3 mb-6">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-text-primary">What are you looking for today?</h2>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                  Search for your next favorite book, find local literary events, or connect with other readers.
                </p>
              </div>
            </section>

            {/* Explore Genres - Always visible and useful */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
                  <Sparkles className="text-brand-indigo" size={28} />
                  Explore Genres
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mockGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleSearchChange(genre.name)}
                    className="group relative h-32 rounded-3xl overflow-hidden bg-background-elevated border border-border-default hover:border-brand-indigo transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-brand-indigo/5 transition-colors group-hover:bg-brand-indigo/10" />
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <span className="text-white font-black text-sm uppercase tracking-wider">{genre.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Local Gem Hint - Only if no zipcode */}
            {!zipcodeInput && (
              <section className="bg-background-muted p-8 rounded-[32px] text-center border-2 border-dashed border-border-default">
                <div className="max-w-md mx-auto space-y-4">
                  <MapPin className="mx-auto text-text-muted" size={48} />
                  <h3 className="text-xl font-bold text-text-primary">Want to find local bookstores?</h3>
                  <p className="text-text-secondary">Enter your zipcode above to discover independent bookshops and events happening near you.</p>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* SEARCH RESULTS VIEW */
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Results Grid - Tab Sensitive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Books Results */}
              {(isAllTab || activeTab === 'books') && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                      <BookOpen size={24} className="text-brand-indigo" />
                      Books
                    </h3>
                    {!isAllTab && <span className="text-sm font-bold text-text-muted bg-background-muted px-3 py-1 rounded-full">{books.length} results</span>}
                  </div>
                  
                  <div className="space-y-4">
                    {booksLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="h-28 bg-background-elevated animate-pulse rounded-3xl" />)
                    ) : books.length > 0 ? (
                      books.map((book) => (
                        <div key={book.google_books_id || book.id}>
                          <BookCard book={book} />
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-background-muted rounded-3xl text-center">
                        <p className="text-text-secondary font-medium">No books found matching &quot;{searchInput}&quot;</p>
                      </div>
                    )}
                    
                    {activeTab === 'books' && hasMoreBooks && (
                      <Button variant="outline" onClick={loadMoreBooks} className="w-full rounded-2xl py-4">Load More Books</Button>
                    )}
                    {isAllTab && books.length >= 4 && (
                      <button onClick={() => handleTabChange('books')} className="w-full text-center py-2 text-brand-indigo font-bold hover:underline">View all book results</button>
                    )}
                  </div>
                </section>
              )}

              {/* People Results */}
              {(isAllTab || activeTab === 'people') && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                      <Users size={24} className="text-brand-indigo" />
                      People
                    </h3>
                    {!isAllTab && <span className="text-sm font-bold text-text-muted bg-background-muted px-3 py-1 rounded-full">{filteredUsers.length} results</span>}
                  </div>

                  <div className="space-y-4">
                    {usersLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="h-20 bg-background-elevated animate-pulse rounded-3xl" />)
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <Link key={user.id} href={`/users/${user.id}`} className="flex items-center gap-4 bg-background-card p-4 rounded-3xl border border-border-default hover:shadow-lg transition-all group">
                          <Avatar src={user.avatar_url} name={user.display_name || user.username} size="md" className="!rounded-2xl" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-text-primary truncate group-hover:text-brand-indigo transition-colors">{user.display_name || user.username}</h4>
                            <p className="text-xs text-text-secondary font-medium">@{user.username}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 bg-background-muted rounded-3xl text-center">
                        <p className="text-text-secondary font-medium">No people found matching &quot;{searchInput}&quot;</p>
                      </div>
                    )}

                    {activeTab === 'people' && hasMoreUsers && (
                      <Button variant="outline" onClick={loadMoreUsers} className="w-full rounded-2xl py-4">Load More People</Button>
                    )}
                    {isAllTab && filteredUsers.length >= 4 && (
                      <button onClick={() => handleTabChange('people')} className="w-full text-center py-2 text-brand-indigo font-bold hover:underline">View all people results</button>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Events Results (Full Width) */}
            {(isAllTab || activeTab === 'events') && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                    <Calendar size={24} className="text-brand-indigo" />
                    Events {zipcodeInput && <span className="text-text-muted font-normal text-sm">near {zipcodeInput}</span>}
                  </h3>
                  {!isAllTab && <span className="text-sm font-bold text-text-muted bg-background-muted px-3 py-1 rounded-full">{events.length} results</span>}
                </div>

                {eventsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-background-elevated animate-pulse rounded-[32px]" />)}
                  </div>
                ) : events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                      <div key={event.id}>
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 bg-background-muted rounded-[40px] text-center border-2 border-dashed border-border-default">
                    <Calendar className="mx-auto text-text-muted mb-4" size={48} />
                    <p className="text-text-primary font-bold text-lg">No events found</p>
                    <p className="text-text-secondary">Try a different search or check back later.</p>
                  </div>
                )}

                {activeTab === 'events' && hasMoreEvents && (
                  <Button variant="outline" onClick={loadMoreEvents} className="w-fit mx-auto px-8 rounded-2xl py-4">Load More Events</Button>
                )}
                {isAllTab && events.length >= 4 && (
                  <button onClick={() => handleTabChange('events')} className="w-full text-center py-2 text-brand-indigo font-bold hover:underline">View all events</button>
                )}
              </section>
            )}

            {/* Bookstore Results (Full Width) */}
            {(isAllTab || activeTab === 'bookstores') && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                    <MapPin size={24} className="text-brand-indigo" />
                    Bookstores {zipcodeInput && <span className="text-text-muted font-normal text-sm">near {zipcodeInput}</span>}
                  </h3>
                  {!isAllTab && <span className="text-sm font-bold text-text-muted bg-background-muted px-3 py-1 rounded-full">{bookstores.length} results</span>}
                </div>

                {venuesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-background-elevated animate-pulse rounded-[32px]" />)}
                  </div>
                ) : bookstores.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookstores.map((venue: any) => (
                      <div key={venue.id}>
                        <VenueCard venue={venue} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 bg-background-muted rounded-[40px] text-center border-2 border-dashed border-border-default">
                    <MapPin className="mx-auto text-text-muted mb-4" size={48} />
                    <p className="text-text-primary font-bold text-lg">No bookstores found</p>
                    <p className="text-text-secondary">Enter a zipcode above to see bookstores in your area.</p>
                  </div>
                )}
                
                {isAllTab && bookstores.length >= 3 && (
                  <button onClick={() => handleTabChange('bookstores')} className="w-full text-center py-2 text-brand-indigo font-bold hover:underline">View all bookstores</button>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="container-mobile py-8 animate-pulse">
        <div className="h-12 w-48 bg-background-elevated rounded-2xl mb-12" />
        <div className="h-16 w-full max-w-3xl bg-background-elevated rounded-3xl mb-12" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-video bg-background-elevated rounded-3xl" />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
