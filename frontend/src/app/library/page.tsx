'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Book as BookIcon, CheckCircle, XCircle, Search, X, Share2, Check, Layers } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
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
import ReadingGoalCard from '@/components/ReadingGoalCard'
import SuggestToFriendModal from '@/components/SuggestToFriendModal'
import { BookCoverImage } from '@/components/BookCoverImage'
import SuggestionsSection from '@/components/SuggestionsSection'
import PrivateShelf from '@/components/PrivateShelf'
import LibraryNotesStrip from '@/components/library/LibraryNotesStrip'

const SHELF_LABELS: Record<string, string> = {
  reading:  'Reading',
  to_read:  'To Read',
  read:     'Completed',
  dnf:      'Did Not Finish',
  private:  'Private',
}

type LibrarySortKey = 'date_added' | 'title' | 'author' | 'rating'

const LIBRARY_SORT_OPTIONS: { key: LibrarySortKey; label: string }[] = [
  { key: 'date_added', label: 'Date Added' },
  { key: 'title',      label: 'Title (A–Z)' },
  { key: 'author',     label: 'Author (A–Z)' },
  { key: 'rating',     label: 'Rating' },
]

function sortLibraryBooks(books: UserBook[], sortKey: LibrarySortKey): UserBook[] {
  return [...books].sort((a, b) => {
    switch (sortKey) {
      case 'title':
        return (a.book?.title ?? '').localeCompare(b.book?.title ?? '')
      case 'author':
        return (a.book?.author_name ?? '').localeCompare(b.book?.author_name ?? '')
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'date_added':
      default:
        return (b.id ?? 0) - (a.id ?? 0)
    }
  })
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
    removeGoal,
    isLoading: isGoalLoading
  } = useMilestones()

  const { suggestions, loading: suggestionsLoading, dismissSuggestion } = useBookSuggestions()

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [hasAttemptedModal, setHasAttemptedModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestModal, setSuggestModal] = useState<{ bookId: number; bookTitle: string } | null>(null)
  const [sortKey, setSortKey] = useState<LibrarySortKey>('date_added')
  const [sortOpen, setSortOpen] = useState(false)

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

  const readingBooks = useMemo(() => sortLibraryBooks(groupedLibrary?.reading || [], sortKey), [groupedLibrary?.reading, sortKey])
  const toReadBooks  = useMemo(() => sortLibraryBooks(groupedLibrary?.to_read || [], sortKey), [groupedLibrary?.to_read, sortKey])
  const readBooks    = useMemo(() => sortLibraryBooks(groupedLibrary?.read || [], sortKey), [groupedLibrary?.read, sortKey])
  const dnfBooks     = useMemo(() => sortLibraryBooks(groupedLibrary?.dnf || [], sortKey), [groupedLibrary?.dnf, sortKey])

  const currentYear = new Date().getFullYear()
  const readThisYear = readBooks.filter(ub => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === currentYear
  }).length
  const lastYearCount = readBooks.filter(ub => {
    if (!ub.finished_at) return false
    return new Date(ub.finished_at).getFullYear() === currentYear - 1
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

  const totalAllBooks  = totalPublicBooks + privateBooks.length
  const shelvesWithBooks = [
    readingBooks.length > 0,
    toReadBooks.length  > 0,
    readBooks.length    > 0,
    dnfBooks.length     > 0,
    privateBooks.length > 0,
  ].filter(Boolean).length
  const joinYear       = user?.created_at ? new Date(user.created_at).getFullYear() : null
  const joinMonthYear  = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const currentSortLabel = LIBRARY_SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Date Added'

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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">

          {/* Left: eyebrow + headline + stats */}
          <div>
            <div className="zine-section-eyebrow mb-4">Your Library</div>

            <h1
              className="font-serif font-bold text-4xl sm:text-5xl lg:text-7xl leading-[1.03] tracking-tight mb-3"
              style={{ color: 'var(--color-ink)' }}
            >
              {user?.display_name?.split(' ')[0] || user?.username}&apos;s{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>shelf.</em>
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[15px]" style={{ color: 'var(--color-ink-2)' }}>
                <span className="font-bold" style={{ color: 'var(--color-ink)' }}>{totalAllBooks}</span>
                {' '}book{totalAllBooks !== 1 ? 's' : ''}
                {shelvesWithBooks > 0 && (
                  <> · <span className="font-bold" style={{ color: 'var(--color-ink)' }}>{shelvesWithBooks}</span> shelf{shelvesWithBooks !== 1 ? 'ves' : ''}</>
                )}
              </p>

              {joinYear && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 flex-shrink-0"
                  style={{
                    color: 'var(--color-ink)',
                    border: '2px solid var(--color-ink)',
                    fontWeight: '900',
                    borderRadius: 6,
                    backgroundColor: 'var(--color-canvas)',
                    rotate: '-3deg',
                  }}
                >
                  Reader · Est. {joinYear}
                </span>
              )}
            </div>
          </div>

          {/* Right: sort + add book */}
          <div className="flex items-center gap-3 flex-none">
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="zine-btn flex items-center gap-2"
                style={{
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '10px 18px',
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-ink)',
                  // boxShadow: '3px 3px 0px var(--color-ink)',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                }}
              >
                <Layers size={13} />
                Sort: {currentSortLabel}
              </button>

              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 z-20 py-1 min-w-[170px]"
                    style={{
                      backgroundColor: 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0px var(--color-ink)',
                    }}
                  >
                    {LIBRARY_SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortKey(opt.key); setSortOpen(false) }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-60"
                        style={{ color: sortKey === opt.key ? 'var(--color-accent)' : 'var(--color-ink)' }}
                      >
                        {opt.label}
                        {sortKey === opt.key && <Check size={13} style={{ color: 'var(--color-accent)' }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/search?type=books">
              <button className="zine-btn zine-btn-primary" style={{ padding: '10px 20px', fontSize: 11, letterSpacing: '0.15em' }}>
                + Add a Book
              </button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {totalPublicBooks > 0 && (
          <div className="mb-8">
            <div className="relative max-w-lg">
              <Search
                size={16}
                className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-ink-3)' }}
              />
              <input
                type="text"
                placeholder="Search your library by title or author…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 text-[14px] font-medium outline-none"
                style={{
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  color: 'var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-accent-yellow)',
                }}
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-ink-3)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isSearching && (
              <p className="mt-2 text-[12px] font-medium" style={{ color: 'var(--color-ink-3)' }}>
                {searchResults.length === 0
                  ? `No books match "${searchQuery}"`
                  : `${searchResults.length} book${searchResults.length === 1 ? '' : 's'} found`}
              </p>
            )}
          </div>
        )}

        {/* Goal + Shelf stats — 40/60 grid */}
        <div className="grid lg:grid-cols-[40%_1fr] gap-5 items-stretch mb-8">
          <ReadingGoalCard
            goal={readingGoal}
            completed={readThisYear}
            onEdit={() => setIsGoalModalOpen(true)}
          />
          <LibraryStats stats={stats} readingStreak={user?.reading_streak ?? 0} />
        </div>

        <GoalSettingModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={setGoal}
          onRemove={removeGoal}
          isLoading={isGoalLoading}
          currentGoal={readingGoal}
          completedThisYear={readThisYear}
          lastYearCount={lastYearCount > 0 ? lastYearCount : undefined}
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
            <ReadingHero books={readingBooks} onUpdate={handleUpdate} />

            <LibraryNotesStrip />

            <SuggestionsSection
              suggestions={suggestions}
              loading={suggestionsLoading}
              dismissSuggestion={dismissSuggestion}
              onUpdate={handleUpdate}
            />

            <Shelf
              shelfId="to-read"
              title="To Read"
              color="var(--color-accent)"
              icon={<BookIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={toReadBooks}
              subtitle="Your future adventures"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <Shelf
              shelfId="read"
              title="Completed"
              color="var(--color-accent-teal)"
              icon={<CheckCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={readBooks}
              subtitle="Books you've finished and what you thought of them"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <Shelf
              shelfId="dnf"
              title="Did Not Finish"
              color="#8b8278"
              icon={<XCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
              books={dnfBooks}
              subtitle="No guilt, just a record of where you stopped"
              onUpdate={handleUpdate}
              onSuggest={(bookId, bookTitle) => setSuggestModal({ bookId, bookTitle })}
            />

            <PrivateShelf
              books={privateBooks}
              loading={privateLoading}
              onUpdate={handleUpdate}
            />
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
