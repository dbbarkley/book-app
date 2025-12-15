'use client'

// Book Detail Page - Shows book information, shelf status, reading progress, and reviews
// Uses shared hooks and components
// Mobile-first design with TailwindCSS
// Integrated with Rails API backend

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useBookDetails, useFollows, useAuth } from '@book-app/shared'
import { BookProgress, ShelfSelector, ReviewForm } from '@/components'
import { formatDate } from '@/utils/format'

/**
 * Book Detail Page
 * 
 * Features:
 * - Book details (title, author, description, cover)
 * - User reading status (shelf: to-read, reading, read)
 * - Reading progress (pages read or completion %)
 * - Rating and review
 * - Follow/unfollow book
 * 
 * Route: /books/[id]
 * 
 * For React Native:
 * - Replace Next.js Link with React Navigation
 * - Adjust className to StyleSheet
 * - Keep the same component structure
 */
export default function BookPage() {
  const params = useParams()
  const bookId = parseInt(params.id as string)
  const { book, userBook, loading, error, refetch } = useBookDetails(bookId)
  const { isAuthenticated } = useAuth()
  const { isFollowing, follow, unfollow, getFollowId } = useFollows()
  const [isFollowingBook, setIsFollowingBook] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Check if this is a Google Books result (negative ID)
  const isGoogleBooksResult = bookId < 0

  useEffect(() => {
    if (book && book.id > 0) {
      // Only check following status for books in our database (positive IDs)
      setIsFollowingBook(isFollowing('Book', book.id))
    } else {
      setIsFollowingBook(false)
    }
  }, [book, isFollowing])

  const handleFollowToggle = async () => {
    if (!book) return

    setFollowLoading(true)
    try {
      if (isFollowingBook) {
        const followId = getFollowId('Book', book.id)
        if (followId) {
          await unfollow(followId)
          setIsFollowingBook(false)
        }
      } else {
        await follow('Book', book.id)
        setIsFollowingBook(true)
      }
    } catch (err) {
      console.error('Failed to update follow status:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShelfChange = () => {
    refetch()
  }

  const handleProgressUpdate = () => {
    refetch()
  }

  const handleReviewSubmit = () => {
    refetch()
  }

  if (loading) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Loading book...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Book Not Found</h1>
          <p className="text-slate-600">The book you're looking for doesn't exist.</p>
          <Link
            href="/books/search"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Search for books
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {/* Google Books Notice */}
        {isGoogleBooksResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="text-2xl">ℹ️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Book from Google Books</h3>
                <p className="text-sm text-blue-800">
                  This book is from the Google Books API. When you add it to your shelf, it will be saved to your library.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Book Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {book.cover_image_url && (
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-48 h-72 sm:w-56 sm:h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{book.title}</h1>
              {book.author_name && (
                <p className="text-xl text-slate-600 mb-4">by {book.author_name}</p>
              )}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-500">
                <span>Released {formatDate(book.release_date)}</span>
                {book.isbn && <span>ISBN: {book.isbn}</span>}
                {book.followers_count !== undefined && (
                  <span>{book.followers_count} followers</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading || isGoogleBooksResult}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isFollowingBook
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isGoogleBooksResult ? 'Add to shelf first to follow' : ''}
                >
                  {followLoading
                    ? '...'
                    : isFollowingBook
                      ? '✓ Following'
                      : '+ Follow Book'}
                </button>
                {book.author && (
                  <Link
                    href={`/authors/${book.author.id}`}
                    className="px-6 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    View Author
                  </Link>
                )}
              </div>
            </div>
          </div>

          {book.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Description</h2>
              <p className="text-slate-700 leading-relaxed">{book.description}</p>
            </div>
          )}

          {book.author && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">About the Author</h2>
              <div className="flex gap-4">
                {book.author.avatar_url && (
                  <img
                    src={book.author.avatar_url}
                    alt={book.author.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{book.author.name}</h3>
                  {book.author.bio && <p className="text-slate-600 mt-1">{book.author.bio}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Actions (only if authenticated) */}
        {isAuthenticated && (
          <div className="space-y-6 mb-6">
            {/* Shelf Selector */}
            <ShelfSelector
              bookId={book.id}
              currentShelf={userBook?.shelf}
              bookData={book}
              onShelfChange={handleShelfChange}
            />

            {/* Reading Progress */}
            {userBook && (
              <BookProgress
                bookId={book.id}
                userBook={userBook}
                onUpdate={handleProgressUpdate}
              />
            )}

            {/* Review Form */}
            <ReviewForm
              bookId={book.id}
              userBook={userBook}
              onReviewSubmit={handleReviewSubmit}
            />
          </div>
        )}

        {/* Not Authenticated Message */}
        {!isAuthenticated && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <p className="text-slate-600 mb-4">
              Sign in to add this book to your shelf, track reading progress, and write reviews.
            </p>
            <div className="flex gap-3">
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
        )}

        {/* Reviews Section (placeholder for future social reviews) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Community Reviews</h2>
          <p className="text-slate-600">Community reviews feature coming soon!</p>
        </div>
      </div>
    </div>
  )
}
