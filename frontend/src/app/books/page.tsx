'use client'

// Books Library Page - User's personal library organized by shelves
// Shows: To Read, Reading, Read sections
// Mobile-first design with TailwindCSS

import Link from 'next/link'
import { useAuth, usePrivateLibrary, useUserLibrary } from '@book-app/shared'
import BookCard from '@/components/BookCard'
import Button from '@/components/Button'

/**
 * Books Library Page
 * 
 * Features:
 * - Shows user's books organized by shelf
 * - Three sections: To Read, Reading, Read
 * - Progress indicators for books being read
 * - Quick access to search for more books
 * 
 * Route: /books
 * 
 * For React Native:
 * - Replace Next.js Link with React Navigation
 * - Use FlatList for better performance
 * - Adjust className to StyleSheet
 */
export default function BooksLibraryPage() {
  const { isAuthenticated } = useAuth()
  const {
    toReadBooks,
    readingBooks,
    readBooks,
    dnfBooks,
    loading: libraryLoading,
    error: libraryError,
  } = useUserLibrary()
  const { privateBooks, loading: privateLoading, error: privateError } =
    usePrivateLibrary()

  if (!isAuthenticated) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">My Library</h1>
          <p className="text-slate-600 mb-6">
            Sign in to see your personal book collection and track your reading progress.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalPublicBooks =
    toReadBooks.length + readingBooks.length + readBooks.length + dnfBooks.length

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Library</h1>
            <p className="text-slate-600">
              {totalPublicBooks === 0
                ? 'Start building your reading collection'
                : `${totalPublicBooks} ${totalPublicBooks === 1 ? 'book' : 'books'} in your library`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/recommendations">
              <Button variant="outline" size="sm">
                Recommendations
              </Button>
            </Link>
            <Link href="/books/search">
              <Button variant="primary">
                + Add Books
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {libraryError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{libraryError}</p>
          </div>
        )}

        {/* Loading State */}
        {libraryLoading && totalPublicBooks === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Loading your library...</p>
          </div>
        )}

        {/* Empty State */}
        {!libraryLoading && totalPublicBooks === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No books yet</h2>
            <p className="text-slate-600 mb-6">
              Start adding books to track your reading journey
            </p>
            <Link href="/books/search">
              <Button variant="primary">
                Search for Books
              </Button>
            </Link>
          </div>
        )}

        {/* Reading Section */}
        {readingBooks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Currently Reading
              </h2>
              <span className="text-sm text-slate-500">{readingBooks.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {readingBooks.map((userBook) => (
                <div key={userBook.id} className="relative">
                  {userBook.book && (
                    <BookCard book={userBook.book} showDescription={false} userBook={userBook} />
                  )}
                  {/* Progress Badge */}
                  {userBook.completion_percentage !== undefined && userBook.completion_percentage > 0 && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                      {userBook.completion_percentage}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DNF Section */}
        { (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <span className="text-2xl">🚫</span>
                  Did Not Finish
                </h2>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mt-1">
                  These books stay out of your read total.
                </p>
              </div>
              <span className="text-sm text-slate-500">{dnfBooks.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {dnfBooks.map((userBook) => (
                userBook.book && (
                  <BookCard
                    key={userBook.id}
                    book={userBook.book}
                    showDescription={false}
                    userBook={userBook}
                  />
                )
              ))}
            </div>
          </section>
        )}

        {/* To Read Section */}
        {toReadBooks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                To Read
              </h2>
              <span className="text-sm text-slate-500">{toReadBooks.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {toReadBooks.map((userBook) => (
                userBook.book && (
                  <BookCard
                    key={userBook.id}
                    book={userBook.book}
                    showDescription={false}
                    userBook={userBook}
                  />
                )
              ))}
            </div>
          </section>
        )}

        {/* Read Section */}
        {readBooks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">✓</span>
                Read
              </h2>
              <span className="text-sm text-slate-500">{readBooks.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {readBooks.map((userBook) => (
                <div key={userBook.id} className="relative">
                  {userBook.book && (
                    <BookCard book={userBook.book} showDescription={false} userBook={userBook} />
                  )}
                  {/* Rating Badge */}
                  {userBook.rating && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                      ⭐ {userBook.rating}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Private Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Private
              </h2>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mt-1">
                Only you can see this list
              </p>
            </div>
            <span className="text-sm text-slate-500">{privateBooks.length}</span>
          </div>
          {privateError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-700">
              {privateError}
            </div>
          )}
          {privateLoading ? (
            <p className="text-sm text-slate-500">Loading private books...</p>
          ) : privateBooks.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500">
              No private books yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {privateBooks.map((userBook) => (
                userBook.book && (
                  <BookCard
                    key={userBook.id}
                    book={userBook.book}
                    showDescription={false}
                    userBook={userBook}
                  />
                )
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

