'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, X, Edit2, Share2, SlidersHorizontal } from 'lucide-react'
import { apiClient } from '@book-app/shared/api/client'
import { useAuth } from '@book-app/shared'
import type { UserBook } from '@book-app/shared/types'
import { BookCoverImage } from '@/components/BookCoverImage'
import QuickUpdateModal from '@/components/QuickUpdateModal'
import SuggestToFriendModal from '@/components/SuggestToFriendModal'

type SortKey = 'date_finished' | 'title' | 'author' | 'rating'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_finished', label: 'Date Finished' },
  { key: 'title',         label: 'Title (A–Z)' },
  { key: 'author',        label: 'Author (A–Z)' },
  { key: 'rating',        label: 'Rating' },
]

function sortBooks(books: UserBook[], key: SortKey): UserBook[] {
  return [...books].sort((a, b) => {
    switch (key) {
      case 'title':
        return (a.book?.title ?? '').localeCompare(b.book?.title ?? '')
      case 'author':
        return (a.book?.author_name ?? '').localeCompare(b.book?.author_name ?? '')
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      default:
        return new Date(b.finished_at ?? 0).getTime() - new Date(a.finished_at ?? 0).getTime()
    }
  })
}

export default function CompletedThisYearPage() {
  const year = new Date().getFullYear()
  const { isAuthenticated } = useAuth()

  const [books,       setBooks]       = useState<UserBook[]>([])
  const [loading,     setLoading]     = useState(true)
  const [sortKey,     setSortKey]     = useState<SortKey>('date_finished')
  const [search,      setSearch]      = useState('')
  const [showSort,    setShowSort]    = useState(false)
  const [modalBook,   setModalBook]   = useState<UserBook | null>(null)
  const [suggestBook, setSuggestBook] = useState<{ bookId: number; bookTitle: string } | null>(null)

  const fetchBooks = () => {
    apiClient.getUserBooks({ shelf: 'read' })
      .then(({ user_books }) => {
        const thisYear = user_books.filter(ub => {
          if (!ub.finished_at) return false
          return new Date(ub.finished_at).getFullYear() === year
        })
        setBooks(thisYear)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchBooks()
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    const sorted = sortBooks(books, sortKey)
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(ub =>
      ub.book?.title?.toLowerCase().includes(q) ||
      ub.book?.author_name?.toLowerCase().includes(q)
    )
  }, [books, sortKey, search])

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-10">

          {/* Back link */}
          <Link
            href="/library"
            className="inline-flex items-center gap-2 mb-8 text-[13px] font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-ink-3)' }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Library
          </Link>

          {/* Header */}
          <div className="mb-10">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2"
              style={{ color: 'var(--color-accent-teal)' }}
            >
              {year} Reading Goal
            </p>
            <h1
              className="font-serif font-bold leading-[1.03] tracking-tight mb-2"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', color: 'var(--color-ink)' }}
            >
              Completed{' '}
              <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>{year}</em>
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--color-ink-3)' }}>
              Every book you finished this year
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-ink-3)' }}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full text-[14px] font-medium"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '11px 16px 11px 36px',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                >
                  <X size={14} style={{ color: 'var(--color-ink-3)' }} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
                style={{
                  border: '2px solid var(--color-ink)',
                  borderRadius: 999,
                  padding: '11px 16px',
                  backgroundColor: showSort ? 'var(--color-ink)' : 'transparent',
                  color: showSort ? 'var(--color-canvas)' : 'var(--color-ink)',
                }}
              >
                <SlidersHorizontal size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">{activeSortLabel}</span>
              </button>

              {showSort && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 min-w-[170px]"
                  style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 12,
                    boxShadow: '4px 4px 0px var(--color-ink)',
                    overflow: 'hidden',
                  }}
                >
                  {SORT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setShowSort(false) }}
                      className="w-full text-left px-4 py-3 text-[13px] font-bold transition-colors hover:opacity-70"
                      style={{
                        color: sortKey === opt.key ? 'var(--color-accent-teal)' : 'var(--color-ink)',
                        borderTop: i > 0 ? '1.5px dashed var(--color-rim)' : 'none',
                        backgroundColor: sortKey === opt.key ? 'var(--color-surface)' : 'transparent',
                      }}
                    >
                      {sortKey === opt.key && <span className="mr-2">✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Count pill */}
            <span
              className="text-[11px] font-bold uppercase tracking-[0.15em] flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-canvas)',
                borderRadius: 999,
                padding: '11px 16px',
              }}
            >
              {loading ? '…' : `${books.length} Book${books.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div
                    className="w-full mb-3"
                    style={{ aspectRatio: '2/3', borderRadius: 8, backgroundColor: 'var(--color-cave)' }}
                  />
                  <div style={{ height: 14, width: '80%', borderRadius: 4, backgroundColor: 'var(--color-cave)', marginBottom: 6 }} />
                  <div style={{ height: 12, width: '55%', borderRadius: 4, backgroundColor: 'var(--color-cave)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && books.length === 0 && (
            <div
              className="py-20 text-center"
              style={{ border: '2px dashed var(--color-rim)', borderRadius: 16 }}
            >
              <p className="font-serif font-bold text-[1.4rem] mb-2" style={{ color: 'var(--color-ink)' }}>
                Nothing finished yet in {year}.
              </p>
              <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
                Mark a book as Completed and it'll appear here.
              </p>
            </div>
          )}

          {/* No search results */}
          {!loading && books.length > 0 && filtered.length === 0 && (
            <div
              className="py-14 text-center"
              style={{ border: '2px dashed var(--color-rim)', borderRadius: 16 }}
            >
              <p className="text-[14px]" style={{ color: 'var(--color-ink-3)' }}>
                No books match &ldquo;{search}&rdquo;
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
              {filtered.map(userBook => {
                if (!userBook.book) return null
                const bookHref = `/books/${userBook.book.google_books_id ?? userBook.book.id}`
                const finishedDate = userBook.finished_at
                  ? new Date(userBook.finished_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : null

                return (
                  <div key={userBook.id} className="group/card">
                    <div className="relative mb-3">
                      <Link href={bookHref}>
                        <div
                          className="w-full overflow-hidden transition-transform group-hover/card:scale-[1.02]"
                          style={{
                            aspectRatio: '2/3',
                            borderRadius: 8,
                            border: '1px solid rgba(0,0,0,0.15)',
                            boxShadow: '3px 5px 14px rgba(0,0,0,0.18)',
                          }}
                        >
                          <BookCoverImage
                            src={userBook.book.cover_image_url}
                            title={userBook.book.title}
                            author={userBook.book.author_name}
                            size="medium"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModalBook(userBook)}
                          className="flex items-center justify-center"
                          title="Log progress"
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: 'var(--color-canvas)',
                            border: '2px solid var(--color-ink)',
                            boxShadow: '2px 2px 0 var(--color-ink)',
                            color: 'var(--color-ink)',
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        {userBook.book?.id != null && (
                          <button
                            onClick={() => setSuggestBook({ bookId: userBook.book!.id as number, bookTitle: userBook.book!.title })}
                            className="flex items-center justify-center"
                            title="Suggest to a friend"
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              backgroundColor: 'var(--color-canvas)',
                              border: '2px solid var(--color-ink)',
                              boxShadow: '2px 2px 0 var(--color-ink)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            <Share2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Rating badge */}
                      {userBook.rating && (
                        <div
                          className="absolute bottom-2 left-2 text-[11px] font-bold"
                          style={{
                            backgroundColor: 'var(--color-canvas)',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 6,
                            padding: '3px 8px',
                            color: 'var(--color-accent)',
                            boxShadow: '2px 2px 0 var(--color-ink)',
                          }}
                        >
                          ★ {userBook.rating}/5
                        </div>
                      )}
                    </div>

                    <Link href={bookHref} className="block hover:opacity-70 transition-opacity">
                      <p
                        className="font-bold leading-snug line-clamp-2 text-[14px] mb-0.5"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {userBook.book.title}
                      </p>
                      {userBook.book.author_name && (
                        <p className="text-[12px] truncate" style={{ color: 'var(--color-ink-3)' }}>
                          {userBook.book.author_name}
                        </p>
                      )}
                      {finishedDate && (
                        <p className="text-[11px] mt-0.5 font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
                          Finished {finishedDate}
                        </p>
                      )}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      <QuickUpdateModal
        userBook={modalBook || { id: 0, book_id: 0, status: 'read' } as any}
        isOpen={!!modalBook}
        onClose={() => setModalBook(null)}
        onUpdate={() => { setModalBook(null); fetchBooks() }}
      />

      {suggestBook && (
        <SuggestToFriendModal
          isOpen={!!suggestBook}
          onClose={() => setSuggestBook(null)}
          bookId={suggestBook.bookId}
          bookTitle={suggestBook.bookTitle}
        />
      )}
    </>
  )
}
