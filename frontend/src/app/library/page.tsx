'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Book as BookIcon, CheckCircle, XCircle, Lock, Search, X, Sparkles, Share2, ChevronRight } from 'lucide-react'
import {
  useAuth,
  usePrivateLibrary,
  useUserLibrary,
  useMilestones,
  useBookSuggestions,
} from '@book-app/shared'
import Button from '@/components/Button'
import Shelf from '@/components/Shelf'
import ReadingHero from '@/components/ReadingHero'
import LibraryStats from '@/components/LibraryStats'
import BookCard from '@/components/BookCard'
import GoalSettingModal from '@/components/library/GoalSettingModal'
import SuggestToFriendModal from '@/components/SuggestToFriendModal'
import { BookCoverImage } from '@/components/BookCoverImage'
import Avatar from '@/components/Avatar'
import type { BookSuggestion } from '@book-app/shared'

const SHELF_LABELS: Record<string, string> = {
  reading:  'Reading',
  to_read:  'To Read',
  read:     'Completed',
  dnf:      'Did Not Finish',
  private:  'Private',
}

export default function BooksLibraryPage() {
  const { user, isAuthenticated } = useAuth()
  const {
    groupedLibrary,
    loading: libraryLoading,
    error: libraryError,
    refresh: refreshLibrary,
  } = useUserLibrary(user?.id)

  const { privateBooks, loading: privateLoading, error: privateError, refreshPrivateLibrary } =
    usePrivateLibrary()

  const {
    hasViewedMilestone,
    markMilestoneViewed,
    readingGoal,
    setGoal,
    isLoading: isGoalLoading
  } = useMilestones()

  const { suggestions, loading: suggestionsLoading, dismissSuggestion } = useBookSuggestions()

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [hasAttemptedModal, setHasAttemptedModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestModal, setSuggestModal] = useState<{ bookId: number; bookTitle: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated && !hasViewedMilestone('goal_set') && !hasAttemptedModal) {
      const timer = setTimeout(() => {
        if (!hasViewedMilestone('goal_set')) {
          setIsGoalModalOpen(true)
          setHasAttemptedModal(true)
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, hasViewedMilestone, hasAttemptedModal])

  const handleUpdate = () => {
    refreshLibrary()
    refreshPrivateLibrary()
  }

  const readingBooks = groupedLibrary?.reading || []
  const toReadBooks  = groupedLibrary?.to_read  || []
  const readBooks    = groupedLibrary?.read      || []
  const dnfBooks     = groupedLibrary?.dnf       || []

  const currentYear = new Date().getFullYear()
  const readThisYear = readBooks.filter(ub => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === currentYear
  }).length

  const totalPublicBooks =
    (readingBooks?.length || 0) +
    (toReadBooks?.length  || 0) +
    (readBooks?.length    || 0) +
    (dnfBooks?.length     || 0)

  const stats = {
    reading:     readingBooks.length,
    toRead:      toReadBooks.length,
    read:        readBooks.length,
    readThisYear,
    dnf:         dnfBooks.length,
    private:     privateBooks.length,
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const isSearching = searchQuery.trim().length > 0

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const q = searchQuery.toLowerCase()
    const allBooks = [
      ...readingBooks.map(b => ({ ...b, _shelf: 'reading'  as const })),
      ...toReadBooks .map(b => ({ ...b, _shelf: 'to_read'  as const })),
      ...readBooks   .map(b => ({ ...b, _shelf: 'read'     as const })),
      ...dnfBooks    .map(b => ({ ...b, _shelf: 'dnf'      as const })),
      ...privateBooks.map(b => ({ ...b, _shelf: 'private'  as const })),
    ]
    return allBooks.filter(ub => {
      const title  = ub.book?.title?.toLowerCase()       || ''
      const author = ub.book?.author_name?.toLowerCase() || ''
      return title.includes(q) || author.includes(q)
    })
  }, [searchQuery, isSearching, readingBooks, toReadBooks, readBooks, dnfBooks, privateBooks])

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container-mobile py-24">
        <div className="text-center max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
              <BookIcon className="w-16 h-16 text-accent" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-lit mb-4">Your Library Awaits</h1>
          <p className="text-lit-2 mb-8 text-lg">
            Sign in to see your personal book collection and track your reading progress.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button variant="primary" size="lg" className="px-8">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="px-8">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen">
      <div className="container-mobile py-8 sm:py-12 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-lit">
              {user?.display_name || user?.username}'s Books
            </h1>
            {totalPublicBooks > 0 && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-lit-3)' }}>
                {totalPublicBooks} book{totalPublicBooks !== 1 ? 's' : ''} in your collection
              </p>
            )}
          </div>
          <Link href="/search?type=books" className="flex-none">
            <Button variant="primary" size="sm" className="shadow-md rounded-xl px-4 py-2 text-sm font-bold">
              + Add Books
            </Button>
          </Link>
        </div>

        {/* Search bar */}
        {totalPublicBooks > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-lit-3)' }}
              />
              <input
                type="text"
                placeholder="Search your library by title or author…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-grove)',
                  border: '1px solid var(--color-rim)',
                  color: 'var(--color-lit)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: 'var(--color-lit-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Result count — only shown while searching */}
            {isSearching && (
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-lit-3)' }}>
                {searchResults.length === 0
                  ? `No books match "${searchQuery}"`
                  : `${searchResults.length} book${searchResults.length === 1 ? '' : 's'} found`}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <LibraryStats stats={stats} goal={readingGoal} onGoalClick={() => setIsGoalModalOpen(true)} />

        <GoalSettingModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={setGoal}
          isLoading={isGoalLoading}
        />

        {/* Error */}
        {libraryError && (
          <div className="rounded-2xl p-4 mb-8 flex items-center gap-3" style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{libraryError}</p>
          </div>
        )}

        {/* Loading */}
        {libraryLoading && totalPublicBooks === 0 && (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent mb-4" />
            <p className="text-lit-2 font-medium">Arranging your bookshelves...</p>
          </div>
        )}

        {/* Empty library */}
        {!libraryLoading && totalPublicBooks === 0 && privateBooks.length === 0 && (
          <div className="text-center py-20 rounded-3xl mb-12" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-full" style={{ backgroundColor: 'var(--color-grove)' }}>
                <BookIcon className="w-16 h-16 text-ink-3" />
              </div>
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-3">Your library is empty</h2>
            <p className="text-ink-2 mb-8 max-w-sm mx-auto">
              Start adding books to track your reading journey, set goals, and organize your collection.
            </p>
            <Link href="/books/search">
              <Button variant="primary" size="lg" className="px-10 shadow-lg">Search for Books</Button>
            </Link>
          </div>
        )}

        {/* ── SEARCH RESULTS VIEW ─────────────────────────────────────── */}
        {isSearching && (
          <section>
            {searchResults.length === 0 ? (
              <div
                className="rounded-2xl px-6 py-16 text-center"
                style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
              >
                <Search size={32} className="mx-auto mb-4" style={{ color: 'var(--color-lit-3)' }} />
                <p className="font-semibold text-base" style={{ color: 'var(--color-lit-2)' }}>
                  No books match &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>
                  Try a different title or author name.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map(ub => (
                  ub.book ? (
                    <div key={ub.id} className="relative">
                      <BookCard
                        book={ub.book}
                        showDescription={false}
                        userBook={ub}
                        coverSize="medium"
                      />
                      {/* Shelf badge */}
                      <span
                        className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'rgba(13,26,15,0.85)',
                          color: 'var(--color-accent)',
                          border: '1px solid var(--color-rim-accent)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {SHELF_LABELS[ub._shelf]}
                      </span>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── NORMAL SHELF VIEW (hidden while searching) ───────────────── */}
        {!isSearching && (
          <>
            {/* Suggested for You */}
            {!suggestionsLoading && suggestions.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
                  <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--color-lit)' }}>
                    Suggested for You
                  </h2>
                  <span
                    className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    {suggestions.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s: BookSuggestion) => (
                    <div
                      key={s.id}
                      className="flex gap-4 p-4 rounded-2xl"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-rim-accent)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      }}
                    >
                      {/* Cover */}
                      <Link href={`/books/${s.book.google_books_id ?? s.book.id}`} className="flex-shrink-0">
                        <div className="w-14 rounded-xl overflow-hidden shadow-md" style={{ aspectRatio: '2/3' }}>
                          <BookCoverImage
                            src={s.book.cover_image_url}
                            title={s.book.title}
                            author={s.book.author_name}
                            size="small"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/books/${s.book.google_books_id ?? s.book.id}`}>
                          <p className="font-bold text-sm truncate hover:underline" style={{ color: 'var(--color-lit)' }}>
                            {s.book.title}
                          </p>
                        </Link>
                        {s.book.author_name && (
                          <p className="text-xs truncate mb-2" style={{ color: 'var(--color-lit-3)' }}>
                            {s.book.author_name}
                          </p>
                        )}

                        {/* Suggester */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Avatar
                            src={s.suggester.avatar_url}
                            name={s.suggester.display_name || s.suggester.username}
                            size="xs"
                          />
                          <span className="text-xs" style={{ color: 'var(--color-lit-2)' }}>
                            from <span className="font-semibold">{s.suggester.display_name || s.suggester.username}</span>
                          </span>
                        </div>

                        {/* Message */}
                        {s.message && (
                          <p className="text-xs italic mb-2 line-clamp-2" style={{ color: 'var(--color-lit-2)' }}>
                            &ldquo;{s.message}&rdquo;
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/books/${s.book.google_books_id ?? s.book.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                          >
                            View Book
                            <ChevronRight size={11} />
                          </Link>
                          <button
                            onClick={() => dismissSuggestion(s.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                            style={{
                              backgroundColor: 'var(--color-grove)',
                              border: '1px solid var(--color-rim)',
                              color: 'var(--color-lit-3)',
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <ReadingHero books={readingBooks} onUpdate={handleUpdate} />

            <Shelf
              shelfId="to-read"
              title="To Read"
              icon={<BookIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={toReadBooks}
              subtitle="Your future adventures"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <Shelf
              shelfId="read"
              title="Completed"
              icon={<CheckCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={readBooks}
              subtitle="Books you've finished"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <Shelf
              shelfId="dnf"
              title="Did Not Finish"
              icon={<XCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={dnfBooks}
              subtitle="On hold or stopped"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <section id="private" className="mt-12 pt-12 scroll-mt-40" style={{ borderTop: '1px solid var(--color-rim)' }}>
              <Shelf
                shelfId="private-books"
                title="Private Collection"
                icon={<Lock className="w-5 h-5" style={{ color: 'var(--color-lit-2)' }} />}
                books={privateBooks}
                subtitle="Only visible to you"
                onUpdate={handleUpdate}
              />

              {privateBooks.length === 0 && !privateLoading && (
                <div className="rounded-3xl p-10 text-center" style={{ border: '1px dashed var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
                  <div className="flex justify-center mb-3">
                    <Lock className="w-8 h-8 text-ink-3" />
                  </div>
                  <p className="font-medium text-ink-2">No private books yet</p>
                  <p className="text-sm text-ink-3 mt-1">Books you mark as private will appear here.</p>
                </div>
              )}

              {privateError && (
                <div className="rounded-2xl p-4 mt-4 text-sm" style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim-accent)', color: 'var(--color-accent)' }}>
                  {privateError}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>

    {/* Suggest to Friend Modal */}
    {suggestModal && (
      <SuggestToFriendModal
        isOpen={!!suggestModal}
        onClose={() => setSuggestModal(null)}
        bookId={suggestModal.bookId}
        bookTitle={suggestModal.bookTitle}
      />
    )}
  </>
  )
}
