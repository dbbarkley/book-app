'use client'

// Author Search Page - Search and discover authors
// Mobile-first design with TailwindCSS
// Uses shared hooks for React Native compatibility

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEnhancedAuthorSearch } from '@book-app/shared'
import AuthorCard from '@/components/AuthorCard'
import InputField from '@/components/InputField'
import Button from '@/components/Button'

/**
 * Author Search Page Content (wrapped in Suspense for useSearchParams)
 */
function AuthorSearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const { authors, loading, error, query, search, loadMore, hasMore, source } = useEnhancedAuthorSearch({
    debounceMs: 300,
    initialQuery,
    pageSize: 20,
    includeGoogleBooks: true,
  })

  const [searchInput, setSearchInput] = useState(initialQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync search input with hook query
  useEffect(() => {
    if (query !== searchInput) {
      setSearchInput(query)
    }
  }, [query])

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    search(value)
    
    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.replace(`/authors/search?${params.toString()}`, { scroll: false })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    search('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/authors/search?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Authors</h1>
          <p className="text-slate-600">
            Discover and follow your favorite authors
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <InputField
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or bio..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-10"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
          {source === 'google' && (
            <p className="mt-2 text-xs text-slate-500">
              Powered by Google Books API
            </p>
          )}
          {source === 'both' && (
            <p className="mt-2 text-xs text-slate-500">
              Results from local database and Google Books
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
        {loading && authors.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Searching authors...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && query.trim() && authors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-2">No authors found</p>
            <p className="text-sm text-slate-500">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query.trim() && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-2">Start typing to search for authors</p>
            <p className="text-sm text-slate-500">
              Search by author name or bio
            </p>
          </div>
        )}

        {/* Author List */}
        {authors.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {authors.map((author) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  showFollowButton
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
            {query.trim() && (
              <div className="text-center mt-4 text-sm text-slate-500">
                Showing {authors.length} result{authors.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Author Search Page
 * 
 * Features:
 * - Debounced search input
 * - Author list with follow buttons
 * - Navigation to author profiles
 * - Mobile-first responsive layout
 * 
 * For React Native:
 * - Replace Next.js navigation with React Navigation
 * - Replace InputField with TextInput
 * - Use FlatList for better performance
 * - Adjust styling to StyleSheet
 */
export default function AuthorSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-mobile py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthorSearchContent />
    </Suspense>
  )
}

