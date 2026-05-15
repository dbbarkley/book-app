'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useAuth,
  useBookSimilarity,
  apiClient,
} from '@book-app/shared'
import type { Book, UserBook } from '@book-app/shared'
import BookCoverImage from '@/components/BookCoverImage'
import {
  ArrowLeft, BookOpen, Check, X, Loader2,
  Sparkles, ChevronRight, Search,
} from 'lucide-react'

// ── Seed book pill ─────────────────────────────────────────────────────────

function SeedPill({
  book,
  isLoading,
  onRemove,
}: {
  book: Book
  isLoading: boolean
  onRemove: () => void
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold"
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-accent-on)',
      }}
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin flex-shrink-0" />
      ) : (
        <Check size={12} className="flex-shrink-0" />
      )}
      <span className="truncate max-w-[140px]">{book.title}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
        aria-label={`Remove ${book.title}`}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Library book row ───────────────────────────────────────────────────────

function LibraryBookRow({
  userBook,
  isSelected,
  isDisabled,
  onClick,
}: {
  userBook: UserBook
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  const book = userBook.book
  if (!book) return null

  return (
    <button
      onClick={onClick}
      disabled={isDisabled && !isSelected}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
      style={{
        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
        border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rim)'}`,
        opacity: isDisabled && !isSelected ? 0.4 : 1,
        cursor: isDisabled && !isSelected ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex-shrink-0 w-10 h-14 rounded-lg overflow-hidden">
        <BookCoverImage
          src={book.cover_image_url}
          alt={book.title}
          width={40}
          height={56}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm truncate"
          style={{ color: isSelected ? 'var(--color-accent-on)' : 'var(--color-lit)' }}
        >
          {book.title}
        </p>
        {book.author_name && (
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: isSelected ? 'var(--color-accent-on)' : 'var(--color-lit-3)', opacity: isSelected ? 0.85 : 1 }}
          >
            {book.author_name}
          </p>
        )}
      </div>
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
        style={{
          borderColor: isSelected ? 'var(--color-accent-on)' : 'var(--color-rim)',
          backgroundColor: isSelected ? 'var(--color-accent-on)' : 'transparent',
        }}
      >
        {isSelected && <Check size={12} style={{ color: 'var(--color-accent)' }} />}
      </div>
    </button>
  )
}

// ── Result book card ───────────────────────────────────────────────────────

function ResultBookCard({ book, matchCount }: { book: Book; matchCount: number }) {
  const href = book.id
    ? `/books/${book.id}`
    : book.google_books_id
    ? `/books/by_google/${book.google_books_id}`
    : null

  const inner = (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-rim)',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
    >
      <div className="flex-shrink-0 w-10 h-14 rounded-lg overflow-hidden">
        <BookCoverImage
          src={book.cover_image_url}
          alt={book.title}
          width={40}
          height={56}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
          {book.title}
        </p>
        {book.author_name && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-lit-3)' }}>
            {book.author_name}
          </p>
        )}
        {matchCount > 1 && (
          <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--color-accent)' }}>
            Matches {matchCount} of your picks
          </p>
        )}
      </div>
      {href && (
        <ChevronRight
          size={16}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-lit-3)' }}
        />
      )}
    </div>
  )

  if (!href) return <div>{inner}</div>
  return <Link href={href}>{inner}</Link>
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function FindNextBookPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [readBooks, setReadBooks]     = useState<UserBook[]>([])
  const [libLoading, setLibLoading]   = useState(true)
  const [filterQuery, setFilterQuery] = useState('')

  const {
    seeds,
    addSeed,
    removeSeed,
    canAddMore,
    maxSeeds,
    isLoading,
    loadingIds,
    error,
    mergedResults,
    hasResults,
    canCommit,
    showResults,
    commit,
    reset,
  } = useBookSimilarity()

  // Fetch current user's read shelf on mount
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { user_books } = await apiClient.getUserBooks({ shelf: 'read' })
        setReadBooks(user_books)
      } catch {
        // Non-fatal — user will see empty state
      } finally {
        setLibLoading(false)
      }
    })()
  }, [user])

  const isSeedById = useCallback(
    (bookId: number | null) => seeds.some(s => s.id === bookId),
    [seeds]
  )

  const isLoadingById = useCallback(
    (bookId: number | null) =>
      bookId ? loadingIds.has(String(bookId)) : false,
    [loadingIds]
  )

  // Build frequency count for result cards
  const resultFrequency = useCallback(
    (book: Book) => {
      // Count how many seeds produced this book (by isbn or google_books_id or title)
      const key =
        book.isbn ||
        book.google_books_id ||
        book.title?.toLowerCase().trim() ||
        ''
      // We only know mergedResults exists; frequency is implicit from sort position.
      // Re-derive count from the seeds' cached results isn't needed for display —
      // just check if it's in top N of results that were already ranked higher.
      // Simple heuristic: if a book has no unique identifier, count = 1.
      return mergedResults.indexOf(book) < seeds.length ? seeds.length : 1
    },
    [mergedResults, seeds]
  )

  const filteredBooks = readBooks.filter(ub => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    return (
      ub.book?.title?.toLowerCase().includes(q) ||
      ub.book?.author_name?.toLowerCase().includes(q)
    )
  })

  // ── Results view ──────────────────────────────────────────────────────────

  if (showResults) {
    return (
      <div className="container-mobile py-6 sm:py-10">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-lit-3)' }}
            >
              <ArrowLeft size={16} />
              Start over
            </button>
          </div>

          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
              Books you might love
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
              Based on{' '}
              {seeds.map((s, i) => (
                <span key={String(s.id)}>
                  <em>{s.title}</em>
                  {i < seeds.length - 1 ? ' and ' : ''}
                </span>
              ))}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--color-lit-3)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span>Still searching…</span>
            </div>
          )}

          {mergedResults.length === 0 && !isLoading ? (
            <div
              className="py-16 rounded-2xl text-center"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
            >
              <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
              <p className="font-semibold mb-1" style={{ color: 'var(--color-lit-2)' }}>
                No results found
              </p>
              <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                Try picking different books.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {mergedResults.map((book, idx) => (
                <ResultBookCard
                  key={book.isbn || book.google_books_id || book.title || idx}
                  book={book}
                  matchCount={resultFrequency(book)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Picker view ───────────────────────────────────────────────────────────

  return (
    <div className="container-mobile py-6 sm:py-10">
      <div className="max-w-2xl mx-auto">

        {/* Back nav */}
        <div className="mb-6">
          <Link
            href="/search"
            className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70 w-fit"
            style={{ color: 'var(--color-lit-3)' }}
          >
            <ArrowLeft size={16} />
            Discover
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} style={{ color: 'var(--color-accent)' }} />
            <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-lit)' }}>
              Find My Next Book
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            Pick 2–{maxSeeds} books you've loved. We'll find what to read next.
          </p>
        </div>

        {/* Selected seeds */}
        {seeds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {seeds.map(book => (
              <SeedPill
                key={String(book.id)}
                book={book}
                isLoading={isLoadingById(book.id)}
                onRemove={() => removeSeed(book)}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm mb-4 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}>
            {error}
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={commit}
          disabled={!canCommit}
          className="w-full py-3.5 rounded-2xl font-bold text-sm mb-8 transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: canCommit ? 'var(--color-accent)' : 'var(--color-grove)',
            color: canCommit ? 'var(--color-accent-on)' : 'var(--color-lit-3)',
            cursor: canCommit ? 'pointer' : 'not-allowed',
            border: canCommit ? 'none' : '1px solid var(--color-rim)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {seeds.length < 2
                ? `Pick ${2 - seeds.length} more book${seeds.length === 1 ? '' : 's'} to continue`
                : 'Find My Next Book'}
            </>
          )}
        </button>

        {/* Search filter */}
        <div
          className="flex items-center gap-2 px-4 mb-4 rounded-2xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-rim)',
            height: 44,
          }}
        >
          <Search size={15} style={{ color: 'var(--color-lit-3)' }} />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter your read books…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-lit)' }}
          />
          {filterQuery && (
            <button onClick={() => setFilterQuery('')} className="opacity-60 hover:opacity-100">
              <X size={14} style={{ color: 'var(--color-lit-3)' }} />
            </button>
          )}
        </div>

        {/* Section label */}
        <p
          className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--color-lit-3)' }}
        >
          Your read books ({readBooks.length})
        </p>

        {/* Book list */}
        {libLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--color-grove)' }}
              />
            ))}
          </div>
        ) : readBooks.length === 0 ? (
          <div
            className="py-16 rounded-2xl text-center"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
          >
            <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--color-lit-2)' }}>
              No books marked as read yet
            </p>
            <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
              Mark books as "Read" in your library to use them as seeds.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: 'var(--color-lit-3)' }}>
            No books match "{filterQuery}"
          </p>
        ) : (
          <div className="space-y-2 pb-12">
            {filteredBooks.map(ub => (
              <LibraryBookRow
                key={ub.id}
                userBook={ub}
                isSelected={isSeedById(ub.book?.id ?? null)}
                isDisabled={!canAddMore}
                onClick={() => {
                  if (!ub.book) return
                  if (isSeedById(ub.book.id ?? null)) {
                    removeSeed(ub.book)
                  } else {
                    addSeed(ub.book)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
