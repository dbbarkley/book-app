'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRecommendedBooks, useRecommendedAuthors, useBooksStore, type Book } from '@book-app/shared'
import { Button, SkeletonLoader, RecommendedBookCard, RecommendedAuthorCard } from '@/components'

export default function RecommendationsPage() {
  const { books, loading: booksLoading, error: booksError, refresh: refreshRecommendations } =
    useRecommendedBooks()
  const { authors, loading: authorsLoading, error: authorsError } = useRecommendedAuthors()
  const addToShelf = useBooksStore((state) => state.addToShelf)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshRecommendations()
    } finally {
      setRefreshing(false)
    }
  }

  const createAddToShelfHandler = (book: Book) => {
    return async () => {
      try {
        await addToShelf(book.id, 'to_read', book)
      } catch (error) {
        console.warn('Failed to add recommended book to shelf', error)
      }
    }
  }

  const renderBookSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div key={`book-skeleton-${index}`} className="min-w-[240px] max-w-xs flex-shrink-0 space-y-3">
        <SkeletonLoader className="h-40 rounded-xl" />
        <SkeletonLoader className="h-5 w-3/4" />
        <SkeletonLoader className="h-4 w-1/2" />
        <SkeletonLoader className="h-12 w-full rounded-xl" />
      </div>
    ))
  }

  const renderAuthorSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div key={`author-skeleton-${index}`} className="min-w-[240px] max-w-xs flex-shrink-0 space-y-3">
        <SkeletonLoader className="h-12 w-12 rounded-full" />
        <SkeletonLoader className="h-5 w-1/2" />
        <SkeletonLoader className="h-4 w-3/4" />
        <SkeletonLoader className="h-12 w-full rounded-xl" />
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-mobile py-8 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.25em] uppercase text-slate-400 mb-1">
                  Personalized Feed
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Recommendations for you
                </h1>
                <p className="text-slate-600 max-w-xl">
                  Discover books and authors Tailored to your tastes, reading history, and follows.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="md"
                  isLoading={refreshing}
                >
                  Refresh
                </Button>
                <Link href="/feed" className="text-sm font-medium text-primary-600 hover:underline">
                  Back to feed
                </Link>
              </div>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
              <Link href="/library" className="underline">
                Library
              </Link>
              <span>·</span>
              <Link href="/onboarding" className="underline">
                Onboarding tips
              </Link>
            </div>
          </header>

          <section className="space-y-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Section</p>
                <h2 className="text-2xl font-semibold text-slate-900">Recommended Books</h2>
                <p className="text-sm text-slate-500">
                  Curated from your shelves, recent activity, and reading signals.
                </p>
              </div>
            </div>

            {booksError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
                {booksError}
              </div>
            )}

            {booksLoading && books.length === 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">{renderBookSkeletons()}</div>
            ) : books.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-500">
                <p className="text-lg font-semibold text-slate-900 mb-2">Nothing new right now</p>
                <p className="text-sm">
                  Finish a book or follow more authors to unlock more personalized suggestions.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {books.map((recommendation) => (
                  <RecommendedBookCard
                    key={`book-${recommendation.id}`}
                    recommendation={recommendation}
                    onAddToShelf={createAddToShelfHandler(recommendation.book)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Section</p>
                <h2 className="text-2xl font-semibold text-slate-900">Recommended Authors</h2>
                <p className="text-sm text-slate-500">
                  Discover authors aligned with your favorite genres and friends.
                </p>
              </div>
            </div>

            {authorsError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
                {authorsError}
              </div>
            )}

            {authorsLoading && authors.length === 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">{renderAuthorSkeletons()}</div>
            ) : authors.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-500">
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  No authors to recommend yet
                </p>
                <p className="text-sm">
                  Follow more authors or import more reading history to get better matches.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {authors.map((recommendation) => (
                  <RecommendedAuthorCard
                    key={`author-${recommendation.id}`}
                    recommendation={recommendation}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">Extending recommendations</h3>
            <p className="text-sm text-slate-600">
              These recommendations are a starting point. For richer personalization:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>Include events and release timelines to surface timely reads.</li>
              <li>Aggregate friends-based signals (what they add, follow, or rate).</li>
              <li>Layer in ML-based ranking to weigh signals by recency and affinity.</li>
              <li>Stream updates via real-time sockets or background sync so suggestions stay fresh.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

