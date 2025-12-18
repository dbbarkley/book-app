'use client'

// Unified Search Page - Search for users and authors
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserSearch, useEnhancedAuthorSearch } from '@book-app/shared'
import AuthorCard from '@/components/AuthorCard'
import InputField from '@/components/InputField'
import Button from '@/components/Button'
import Link from 'next/link'
import type { User } from '@book-app/shared'

/**
 * Unified Search Page Content (wrapped in Suspense for useSearchParams)
 */
function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTab = (searchParams.get('type') as 'users' | 'authors') || 'authors'

  const [activeTab, setActiveTab] = useState<'users' | 'authors'>(initialTab)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // User search
  const {
    users,
    loading: usersLoading,
    error: usersError,
    query: usersQuery,
    search: searchUsers,
    loadMore: loadMoreUsers,
    hasMore: hasMoreUsers,
  } = useUserSearch({
    debounceMs: 300,
    initialQuery: activeTab === 'users' ? initialQuery : '',
    pageSize: 20,
  })

  // Author search (with Google Books)
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
    debounceMs: 300,
    initialQuery: activeTab === 'authors' ? initialQuery : '',
    pageSize: 20,
    includeGoogleBooks: true,
  })

  // Sync search input with active tab's query
  useEffect(() => {
    const currentQuery = activeTab === 'users' ? usersQuery : authorsQuery
    if (currentQuery !== searchInput) {
      setSearchInput(currentQuery)
    }
  }, [activeTab, usersQuery, authorsQuery])

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    
    if (activeTab === 'users') {
      searchUsers(value)
    } else {
      searchAuthors(value)
    }

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    params.set('type', activeTab)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (tab: 'users' | 'authors') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', tab)
    if (searchInput.trim()) {
      params.set('q', searchInput)
    }
    router.replace(`/search?${params.toString()}`, { scroll: false })

    // Trigger search for the new tab
    if (searchInput.trim()) {
      if (tab === 'users') {
        searchUsers(searchInput)
      } else {
        searchAuthors(searchInput)
      }
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    if (activeTab === 'users') {
      searchUsers('')
    } else {
      searchAuthors('')
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const loading = activeTab === 'users' ? usersLoading : authorsLoading
  const error = activeTab === 'users' ? usersError : authorsError
  const hasMore = activeTab === 'users' ? hasMoreUsers : hasMoreAuthors
  const loadMore = activeTab === 'users' ? loadMoreUsers : loadMoreAuthors

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">Search</h1>
          <p className="text-text-secondary">Find users and authors</p>
        </div>

        {/* Tabs */}
        <div className="bg-background-card rounded-lg border border-border-default p-1 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => handleTabChange('authors')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo/60 ${
                activeTab === 'authors'
                  ? 'bg-brand-indigo text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
              }`}
            >
              Authors
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo/60 ${
                activeTab === 'users'
                  ? 'bg-brand-indigo text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <InputField
              ref={searchInputRef}
              type="text"
              placeholder={
                activeTab === 'users'
                  ? 'Search users by username, name, or bio...'
                  : 'Search authors by name...'
              }
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-10"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                aria-label="Clear search"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {activeTab === 'authors' && authorsSource === 'google' && (
            <p className="mt-2 text-xs text-text-muted">
              Powered by Google Books API
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (activeTab === 'users' ? users.length === 0 : authors.length === 0) && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-indigo"></div>
            <p className="mt-4 text-text-secondary">
              Searching {activeTab === 'users' ? 'users' : 'authors'}...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && searchInput.trim() && (activeTab === 'users' ? users.length === 0 : authors.length === 0) && (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-2">No {activeTab} found</p>
            <p className="text-sm text-text-muted">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !searchInput.trim() && (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-2">Start typing to search for {activeTab}</p>
            <p className="text-sm text-text-muted">
              {activeTab === 'users'
                ? 'Search by username, display name, or bio'
                : 'Search by author name (includes Google Books results)'}
            </p>
          </div>
        )}

        {/* Results */}
        {activeTab === 'authors' && authors.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {authors.map((author) => (
                <AuthorCard
                  key={author.id || `external-${author.name}`}
                  author={author}
                  showFollowButton={author.id > 0} // Only show follow button for local authors
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  isLoading={loading}
                  disabled={loading}
                >
                  Load More
                </Button>
              </div>
            )}

            {/* Results Count */}
            {searchInput.trim() && (
              <div className="text-center mt-4 text-sm text-text-muted">
                Showing {authors.length} result{authors.length !== 1 ? 's' : ''}
                {authorsSource === 'google' && ' (from Google Books)'}
                {authorsSource === 'both' && ' (local + Google Books)'}
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && users.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {users.map((user: User) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="flex gap-4 rounded-2xl border border-border-default bg-background-card p-4 hover:shadow-lg transition-shadow"
                >
                  {user.avatar_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {user.display_name || user.username}
                    </h3>
                    {user.display_name && (
                      <p className="text-sm text-text-secondary mb-2">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  isLoading={loading}
                  disabled={loading}
                >
                  Load More
                </Button>
              </div>
            )}

            {/* Results Count */}
            {searchInput.trim() && (
              <div className="text-center mt-4 text-sm text-text-muted">
                Showing {users.length} result{users.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
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
        <div className="container-mobile py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}

