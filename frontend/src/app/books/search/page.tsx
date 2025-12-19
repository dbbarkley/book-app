'use client'

// Book Search Page - Search books with debounced input and pagination
// Mobile-first design with TailwindCSS
// Integrated with Rails API backend

import { useBookSearch } from '@book-app/shared'
import BookCard from '@/components/BookCard'
import Button from '@/components/Button'
import { useEffect, useRef } from 'react'

/**
 * Book Search Page
 * 
 * Features:
 * - Debounced search input (300ms delay)
 * - Pagination/infinite scroll
 * - Mobile-first responsive design
 * - Integration with Google Books API (client-side)
 * 
 * Route: /books/search
 * 
 * For React Native:
 * - Replace Next.js Link with React Navigation
 * - Replace input with TextInput
 * - Adjust className to StyleSheet
 */
export default function BookSearchPage() {
  const { books, loading, query, setQuery, loadMore, hasMore, error } = useBookSearch({
    debounceMs: 300,
    perPage: 20,
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Books</h1>
          <p className="text-slate-600">Find your next great read</p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Powered by Google Books API
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {query.trim() && (
          <>
            {books.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-slate-600">No books found. Try a different search term.</p>
              </div>
            )}

            {books.length > 0 && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-slate-600">
                    Found {books.length} {books.length === 1 ? 'book' : 'books'}
                  </p>
                </div>

                {/* Book Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} showDescription={false} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center">
                    <Button
                      onClick={loadMore}
                      isLoading={loading}
                      variant="outline"
                      disabled={loading}
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {!hasMore && books.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">No more books to load</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty State */}
        {!query.trim() && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Start Searching</h2>
            <p className="text-slate-600">
              Enter a book title, author name, or ISBN to find books
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

