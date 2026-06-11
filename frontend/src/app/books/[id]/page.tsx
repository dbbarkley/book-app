'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  useBookDetails,
  useFollows,
  useAuth,
  useBooksStore,
  getDisplayGenre,
  useBookNotes,
  apiClient,
} from '@book-app/shared'
import { useBookFriends } from '@book-app/shared/hooks/useBookFriends'
import {
  ReviewForm,
  BookCoverImage,
  Button,
  QuickUpdateModal,
  SuggestToFriendModal,
  ReadingBuddyBookSection,
} from '@/components'
import { formatDate } from '@/utils/format'
import {
  Calendar,
  Star,
  Plus,
  Check,
  ChevronLeft,
  ChevronDown,
  Lock,
  Globe,
  Share2,
} from 'lucide-react'


export default function BookPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const fromScanner = searchParams.get('scanner') === 'true'
  const rawParam = params.id as string

  // ISBNs look like integers but must be routed as strings so useBookDetails
  // hits the by_isbn endpoint rather than the books/:id endpoint.
  const isIsbn = /^\d{13}$/.test(rawParam) || /^\d{9}[\dX]$/i.test(rawParam)
  const numericId = parseInt(rawParam, 10)
  const isNumeric = !isNaN(numericId) && String(numericId) === rawParam && !isIsbn
  // The identifier we pass to useBookDetails: number for DB books, string for Google Books / ISBN
  const bookIdentifier: number | string = isNumeric ? numericId : rawParam

  const { book, userBook, loading, error, refetch } = useBookDetails(bookIdentifier)
  const { friends, loading: friendsLoading } = useBookFriends(book?.id ?? 0)
  const { isAuthenticated } = useAuth()
  const { isFollowing, follow, unfollow, getFollowId } = useFollows()
  const { saveNotes, loading: notesLoading } = useBookNotes()

  const [isFollowingBook, setIsFollowingBook] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [otherWorks, setOtherWorks] = useState<{ key: string; title: string; year: number | null; cover_url: string | null; ratings_average: number | null }[]>([])
  const [otherWorksLoading, setOtherWorksLoading] = useState(false)
  const [navigatingKey, setNavigatingKey] = useState<string | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Only show back button if there's actual browser history to go back to
    setCanGoBack(window.history.length > 1)
  }, [])
  // A book is "in DB" when it has a positive numeric id
  const internalBookId = book?.id && book.id > 0 ? book.id : null

  useEffect(() => {
    if (internalBookId) {
      setIsFollowingBook(isFollowing('Book', internalBookId))
    } else {
      setIsFollowingBook(false)
    }
  }, [book, isFollowing, internalBookId])

  useEffect(() => {
    setNotes(userBook?.notes || '')
    setNotesSaved(false)
  }, [userBook?.notes])

  // Auto-open the shelf modal when arriving from the barcode scanner.
  // Wait until the book has loaded and the user is authenticated.
  const scannerModalOpenedRef = useRef(false)
  useEffect(() => {
    if (fromScanner && !loading && book && isAuthenticated && !scannerModalOpenedRef.current) {
      scannerModalOpenedRef.current = true
      setIsUpdateModalOpen(true)
    }
  }, [fromScanner, loading, book, isAuthenticated])

  const handleFollowToggle = async () => {
    if (!internalBookId) return
    setFollowLoading(true)
    try {
      if (isFollowingBook) {
        const followId = getFollowId('Book', internalBookId)
        if (followId) { await unfollow(followId); setIsFollowingBook(false) }
      } else {
        await follow('Book', internalBookId)
        setIsFollowingBook(true)
      }
    } catch (err) {
      console.error('Failed to update follow status:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && book) window.scrollTo(0, 0)
  }, [rawParam, loading, !!book])

  // Fetch other works by the same author
  useEffect(() => {
    if (!book?.author_name) return
    let cancelled = false
    const fetchOtherWorks = async () => {
      setOtherWorksLoading(true)
      try {
        const works = await apiClient.getAuthorWorks(book.author_name!, book.title)
        if (!cancelled) {
          setOtherWorks(works.map(w => ({
            key:             w.google_books_id ?? '',
            title:           w.title,
            year:            w.release_date ? parseInt(w.release_date.substring(0, 4), 10) || null : null,
            cover_url:       w.cover_image_url ?? null,
            ratings_average: null,
          })))
        }
      } catch (err) {
        console.error('Failed to fetch other works:', err)
      } finally {
        if (!cancelled) setOtherWorksLoading(false)
      }
    }
    fetchOtherWorks()
    return () => { cancelled = true }
  }, [book?.author_name, book?.title])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          <p className="mt-4 text-lit-2 font-medium tracking-wide">Loading your book...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container-mobile py-24">
        <div className="text-center max-w-md mx-auto">
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="font-serif text-3xl font-bold text-lit mb-4">Book Not Found</h1>
          <p className="text-lit-2 mb-8 text-lg">
            {error || "We couldn\u2019t find the book you\u2019re looking for."}
          </p>
          <Link href="/search">
            <Button variant="primary" size="lg">Search for Books</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Navigate to a work from the "More by Author" strip.
  // key is now a Google Books volume ID — navigate directly, no extra fetch needed.
  const handleWorkClick = (work: { key: string; title: string; cover_url: string | null; year: number | null }) => {
    if (navigatingKey) return
    setNavigatingKey(work.key)
    router.push(`/books/${work.key}`)
  }

  const handleBack = () => {
    if (canGoBack) {
      router.back()
    } else {
      router.push('/search')
    }
  }

  const shelfLabels: Record<string, string> = {
    'reading': 'Currently Reading',
    'to_read': 'Want to Read',
    'read':    'Finished Reading',
    'dnf':     'Did Not Finish',
  }

  const catalogNo       = String(book.id ?? '').padStart(3, '0') || '—'
  const avgRating       = (book as any).average_rating != null ? parseFloat(String((book as any).average_rating)) || undefined : undefined
  const ratingsCount    = (book as any).ratings_count  != null ? parseInt(String((book as any).ratings_count), 10) || undefined : undefined
  const genre           = getDisplayGenre(book.categories)
  const subGenres       = book.categories?.slice(1, 3) ?? []
  const friendsFinished = friends.filter((f: { status: string }) => f.status === 'read').length
  const friendsReading  = friends.filter((f: { status: string }) => f.status === 'reading').length
  const friendsToRead   = friends.filter((f: { status: string }) => f.status === 'to_read').length
  const progress        = userBook?.completion_percentage
    ?? (userBook?.pages_read && book.page_count
          ? Math.round((userBook.pages_read / book.page_count) * 100)
          : undefined)

  const timeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    return `${mins} mins ago`
  }

  // Pill button shared style
  const pillBtn = (filled: boolean): React.CSSProperties => ({
    fontSize: 11, letterSpacing: '0.12em',
    border: '2px solid var(--color-ink)',
    borderRadius: 999,
    padding: '10px 18px',
    backgroundColor: filled ? 'var(--color-accent)' : 'transparent',
    color: filled ? '#FAF6EB' : 'var(--color-ink)',
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 8,
  })

  const renderActionButtons = () => isAuthenticated ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {userBook ? (
        <button
          onClick={() => setIsUpdateModalOpen(true)}
          className="font-bold uppercase transition-opacity hover:opacity-80"
          style={{ ...pillBtn(true), justifyContent: 'space-between' }}
        >
          <span className="flex items-center gap-2">
            <Check size={13} strokeWidth={2.5} />
            {shelfLabels[userBook.status] || 'On My Shelf'}
          </span>
          <ChevronDown size={13} strokeWidth={2.5} />
        </button>
      ) : (
        <button
          onClick={() => setIsUpdateModalOpen(true)}
          className="font-bold uppercase transition-opacity hover:opacity-80"
          style={{ ...pillBtn(true), justifyContent: 'center' }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add to Shelf
        </button>
      )}
      {userBook && (
        <div
          className="font-bold uppercase"
          style={{ ...pillBtn(false), cursor: 'default', flexWrap: 'wrap', gap: 6 }}
        >
          <Check size={12} strokeWidth={2.5} />
          Receiving Updates
          <span style={{ color: 'var(--color-ink-3)' }}>·</span>
          {userBook.visibility === 'private'
            ? <><Lock size={12} /> Private</>
            : <><Globe size={12} /> Public</>}
        </div>
      )}
      {internalBookId && (
        <button
          onClick={handleFollowToggle}
          disabled={followLoading}
          className="font-bold uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ ...pillBtn(false) }}
        >
          {isFollowingBook
            ? <><Check size={12} strokeWidth={2.5} /> Following Updates</>
            : <><Plus size={12} strokeWidth={2.5} /> Follow Updates</>}
        </button>
      )}
      <button
        onClick={() => setIsSuggestModalOpen(true)}
        className="font-bold uppercase transition-opacity hover:opacity-70"
        style={{ ...pillBtn(false), justifyContent: 'center' }}
      >
        <Share2 size={12} strokeWidth={2} /> Suggest to Friend
      </button>
    </div>
  ) : (
    <div style={{ width: '100%' }}>
      <p className="font-medium mb-3" style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
        Sign in to track this book
      </p>
      <div className="flex gap-2">
        <Link href="/login" className="flex-1">
          <Button variant="primary" fullWidth size="sm">Login</Button>
        </Link>
        <Link href="/signup" className="flex-1">
          <Button variant="outline" fullWidth size="sm">Sign Up</Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)', position: 'relative' }}>

      {/* ── Cover-derived hero background — blurred cover fades to canvas ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 420, overflow: 'hidden',
          zIndex: 0, pointerEvents: 'none',
        }}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url.replace('http://', 'https://')}
            alt=""
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              filter: 'blur(48px) brightness(0.38) saturate(180%)',
              transform: 'scale(1.25)',
              transformOrigin: 'top center',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-accent-teal)' }} />
        )}
        {/* Fade to canvas at the bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 45%, var(--color-canvas) 100%)',
        }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>

          {/* ── Nav bar ── */}
          <div className="container-mobile max-w-6xl flex items-center justify-between pb-3 lg:pb-24" style={{ paddingTop: 20 }}>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 font-bold uppercase transition-opacity hover:opacity-70"
              style={{
                fontSize: 11, letterSpacing: '0.14em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999, padding: '6px 12px',
                backgroundColor: 'var(--color-canvas)',
                color: 'var(--color-ink)',
              }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Back to Discover</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div
              className="hidden sm:block font-bold uppercase"
              style={{
                fontSize: 11, letterSpacing: '0.14em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999, padding: '8px 16px',
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-canvas)',
              }}
            >
              The Catalogue · No. {catalogNo}
            </div>
          </div>

          {/* ── Newspaper meta bar — full page width, desktop only ── */}
          <div className="hidden sm:block" style={{ borderTop: '2px solid var(--color-ink)', borderBottom: '2px solid var(--color-ink)' }}>
            <div className="container-mobile max-w-6xl grid lg:grid-cols-[3fr_7fr] gap-10" style={{ paddingTop: 10, paddingBottom: 10 }}>
              {/* Left spacer — book cover overlaps here */}
              <div className="hidden lg:block" />
              {/* Right — meta text */}
              <div className="flex">
                <span className="font-bold uppercase flex-1" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--color-ink)' }}>
                  Released {formatDate(book.release_date)}
                </span>
                <span className="font-bold uppercase flex-1" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--color-ink)', borderLeft: '2px solid var(--color-ink)', paddingLeft: 16 }}>
                  {book.page_count ? `${book.page_count} Pages` : '— Pages'}
                </span>
                <span className="font-bold uppercase flex-1" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--color-ink)', borderLeft: '2px solid var(--color-ink)', paddingLeft: 16 }}>
                  ISBN {book.isbn || '—'}
                </span>
              </div>
            </div>
          </div>

        <div className="container-mobile max-w-6xl">

          {/* Mobile dateline strip */}
          <div className="sm:hidden" style={{ borderTop: '2px solid var(--color-ink)', borderBottom: '2px solid var(--color-ink)', marginBottom: 16 }}>
            <div className="flex items-center justify-center gap-3 flex-wrap" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {genre && <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-ink)' }}>{genre}</span>}
              {genre && book.release_date && <span style={{ color: 'var(--color-ink-3)' }}>·</span>}
              {book.release_date && <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-ink)' }}>{formatDate(book.release_date)}</span>}
              {book.page_count && <><span style={{ color: 'var(--color-ink-3)' }}>·</span><span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-ink)' }}>{book.page_count}pp</span></>}
            </div>
          </div>

          {/* ── Hero two-column ── */}
          <div className="grid grid-cols-[130px_1fr] lg:grid-cols-[3fr_7fr] gap-x-5 gap-y-4 lg:gap-10 items-start">

            {/* LEFT: Cover (+ desktop action buttons) */}
            <div className="flex flex-col items-start lg:-mt-[42px] lg:relative lg:z-[2]">
              <div
                className="w-full"
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '2px solid var(--color-ink)',
                  boxShadow: '8px 8px 0px rgba(0,0,0,0.45)',
                  marginBottom: 22,
                }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="large"
                  className="w-full aspect-[2/3] object-cover"
                  layoutId={`book-cover-${book.google_books_id ?? book.id}`}
                />
              </div>

              {/* Desktop-only action buttons */}
              <div className="hidden lg:block w-full">
                {renderActionButtons()}
              </div>
            </div>

            {/* RIGHT: title + stats */}
            <div className="flex flex-col justify-start">

              {/* Friends sticker */}
              {isAuthenticated && internalBookId && !friendsLoading && friendsFinished > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span
                    className="font-bold uppercase"
                    style={{
                      fontSize: 11, letterSpacing: '0.14em',
                      border: '2px solid var(--color-accent-teal)',
                      borderRadius: 6, padding: '5px 10px',
                      color: 'var(--color-accent-teal)',
                      display: 'inline-block',
                      transform: 'rotate(-1.2deg)',
                    }}
                  >
                    {friendsFinished} Friend{friendsFinished !== 1 ? 's' : ''} Finished
                  </span>
                </div>
              )}

              {/* Title */}
              <h1
                className="font-serif font-black leading-none"
                style={{
                  fontSize: 'clamp(1.4rem, 5.5vw, 5rem)',
                  color: 'var(--color-ink)',
                  marginBottom: 12,
                  lineHeight: 0.95,
                }}
              >
                {book.title}
              </h1>

              {/* Author + meta */}
              <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                <span
                  className="font-serif font-bold italic"
                  style={{ fontSize: 'clamp(14px, 4vw, 18px)', color: 'var(--color-accent)' }}
                >
                  by {book.author_name}
                </span>
                {book.release_date && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span style={{ color: 'var(--color-ink-3)' }}>·</span>
                    <span className="flex items-center gap-1.5" style={{ fontSize: 14, color: 'var(--color-ink-2)' }}>
                      <Calendar size={13} /> {formatDate(book.release_date)}
                    </span>
                  </div>
                )}
                {book.page_count && (
                  <div className="hidden sm:flex items-center gap-1">
                    <span style={{ color: 'var(--color-ink-3)' }}>·</span>
                    <span style={{ fontSize: 14, color: 'var(--color-ink-2)' }}>{book.page_count} pages</span>
                  </div>
                )}
              </div>

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                {/* Avg Rating */}
                {avgRating != null && (
                  <div
                    style={{
                      backgroundColor: '#C4521F',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0px var(--color-ink)',
                      padding: '14px 16px',
                    }}
                  >
                    <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                      Avg Rating
                    </p>
                    <p className="font-serif font-black" style={{ fontSize: 22, color: '#FAF6EB', lineHeight: 1 }}>
                      {avgRating.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>/5</span>
                    </p>
                    <div className="flex gap-0.5 mt-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} fill={avgRating >= s ? '#FAF6EB' : 'none'} style={{ color: '#FAF6EB' }} />
                      ))}
                    </div>
                    {ratingsCount !== undefined && (
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                        {ratingsCount.toLocaleString()} ratings
                      </p>
                    )}
                  </div>
                )}

                {/* Genre */}
                {genre && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-canvas)',
                      border: '2px solid var(--color-accent-teal)',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0px var(--color-accent-teal)',
                      padding: '14px 16px',
                    }}
                  >
                    <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--color-ink-3)', marginBottom: 6 }}>
                      Genre
                    </p>
                    <p className="font-serif font-bold" style={{ fontSize: 15, color: 'var(--color-accent-teal)', lineHeight: 1.2 }}>
                      {genre}
                    </p>
                    {subGenres.length > 0 && (
                      <p style={{ fontSize: 10, color: 'var(--color-ink-3)', marginTop: 5 }}>
                        Sub: {subGenres.join(' · ')}
                      </p>
                    )}
                  </div>
                )}

                {/* In your circle */}
                {isAuthenticated && internalBookId && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-canvas)',
                      border: '2px solid var(--color-accent-yellow)',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0px var(--color-accent-yellow)',
                      padding: '14px 16px',
                    }}
                  >
                    <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--color-ink-3)', marginBottom: 6 }}>
                      In Your Circle
                    </p>
                    <p className="font-serif font-black" style={{ fontSize: 32, color: 'var(--color-ink)', lineHeight: 1 }}>
                      {friendsLoading ? '…' : friends.length}
                    </p>
                    {!friendsLoading && (
                      <p style={{ fontSize: 10, color: 'var(--color-ink-3)', marginTop: 5, lineHeight: 1.4 }}>
                        {[
                          friendsFinished > 0 && `${friendsFinished} finished`,
                          friendsReading  > 0 && `${friendsReading} reading`,
                          friendsToRead   > 0 && `${friendsToRead} to-read`,
                        ].filter(Boolean).join(' · ') || 'No friends yet'}
                      </p>
                    )}
                  </div>
                )}

                {/* Your progress */}
                {isAuthenticated && userBook && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-canvas)',
                      border: '2px solid #2D6A4F',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0px #2D6A4F',
                      padding: '14px 16px',
                    }}
                  >
                    <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--color-ink-3)', marginBottom: 6 }}>
                      Your Progress
                    </p>
                    <p className="font-serif font-black" style={{ fontSize: 32, color: '#2D6A4F', lineHeight: 1 }}>
                      {progress !== undefined ? `${progress}%` : '—'}
                    </p>
                    {progress !== undefined && (
                      <div style={{ width: '100%', height: 6, borderRadius: 999, backgroundColor: 'var(--color-surface)', marginTop: 8 }}>
                        <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', borderRadius: 999, backgroundColor: '#2D6A4F', transition: 'width 0.5s ease' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile action buttons (full-width below the cover+title row) */}
          <div className="lg:hidden mt-5">
            {renderActionButtons()}
          </div>
        </div>

        {/* ── Lower content ── */}
        <div className="container-mobile max-w-6xl pt-8 lg:pt-[60px]" style={{ paddingBottom: 80 }}>

          {/* ── Friends circle ── */}
          {isAuthenticated && internalBookId && (
            <div style={{ marginBottom: 48 }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
                <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent)' }}>
                  Your Circle
                </span>
              </div>
              <h2 className="font-serif font-bold" style={{ fontSize: 22, color: 'var(--color-ink)', marginBottom: 20 }}>
                Friends who have this book
              </h2>

              {friendsLoading ? (
                <div className="flex gap-3 flex-wrap">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse rounded-full" style={{ height: 52, width: 160, backgroundColor: 'var(--color-surface)' }} />
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <p className="font-medium" style={{ fontSize: 14, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                  Be the first in your friend group to read this book.
                </p>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {friends.map((friend: { id: number; username: string; display_name?: string; status: string }) => {
                    const name      = friend.display_name || friend.username
                    const initial   = name.charAt(0).toUpperCase()
                    const colorIdx  = [...friend.username].reduce((acc, c) => acc + c.charCodeAt(0), 0)
                    const COLORS    = ['#C4521F', '#234A5A', '#2D6A4F', '#1A1F58', '#8B5E3C']
                    const avatarBg  = COLORS[colorIdx % COLORS.length]
                    const statusMap: Record<string, string> = {
                      reading: 'Reading', read: 'Finished', to_read: 'To-read', dnf: 'DNF',
                    }
                    const statusLabel = statusMap[friend.status] ?? friend.status

                    return (
                      <button
                        key={friend.id}
                        onClick={() => router.push(`/users/${friend.id}`)}
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-75"
                        style={{
                          border: '2px solid var(--color-ink)',
                          borderRadius: 999,
                          padding: '7px 14px 7px 7px',
                          backgroundColor: 'var(--color-canvas)',
                          boxShadow: '3px 3px 0px var(--color-ink)',
                        }}
                      >
                        <div
                          style={{
                            width: 34, height: 34, borderRadius: '50%',
                            backgroundColor: avatarBg,
                            border: '2px solid var(--color-ink)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="font-bold" style={{ fontSize: 13, color: '#FAF6EB' }}>{initial}</span>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p className="font-bold" style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.25 }}>
                            {name}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--color-ink-3)', lineHeight: 1.25 }}>
                            {statusLabel}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Reading Buddy ── */}
          {isAuthenticated && internalBookId && (
            <div style={{ marginBottom: 48 }}>
              <ReadingBuddyBookSection bookId={internalBookId} bookTitle={book.title} />
            </div>
          )}

          {/* ── Description ── */}
          <div className="grid lg:grid-cols-[2fr_3fr] gap-10 lg:gap-16" style={{ marginBottom: 48, borderTop: '2px dashed var(--color-rim)', paddingTop: 40 }}>

            {/* Left: heading block */}
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)' }} />
                <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent)' }}>
                  What it's about
                </span>
              </div>
              <h2 className="font-serif font-bold" style={{ fontSize: 34, color: 'var(--color-ink)', lineHeight: 1.05, marginBottom: 16 }}>
                The <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>blurb.</span>
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.65 }}>
                From the publisher's copy. No AI summary — we never paraphrase a book without the author's hand on it.
              </p>
            </div>

            {/* Right: drop-cap description card */}
            <div
              style={{
                backgroundColor: 'var(--color-canvas)',
                border: '2px solid var(--color-ink)',
                borderRadius: 16,
                boxShadow: '4px 4px 0px var(--color-ink)',
                padding: 'clamp(18px, 5vw, 28px) clamp(16px, 5vw, 32px)',
              }}
            >
              {(() => {
                const desc       = book.description || 'No description available for this book.'
                const paragraphs = desc.split(/\n\n+/)
                const firstPara  = paragraphs[0] ?? ''
                const restParas  = paragraphs.slice(1)
                const dropChar   = firstPara.charAt(0)
                const afterDrop  = firstPara.slice(1)
                return (
                  <>
                    <p style={{ fontSize: 16, color: 'var(--color-ink)', lineHeight: 1.75 }}>
                      <span
                        className="font-serif font-black"
                        style={{
                          float: 'left',
                          fontSize: '4.4rem',
                          color: 'var(--color-accent)',
                          lineHeight: 0.82,
                          marginRight: 8,
                          marginTop: 6,
                        }}
                      >
                        {dropChar}
                      </span>
                      {afterDrop}
                    </p>
                    {restParas.map((para, i) => (
                      <p key={i} style={{ fontSize: 16, color: 'var(--color-ink)', lineHeight: 1.75, marginTop: 20, clear: 'both' }}>
                        {para}
                      </p>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>

          {/* ── More by this author ── */}
          {(otherWorksLoading || otherWorks.length > 0) && (() => {
            const WORK_BG = [
              '#2C1654', '#4A3510', '#1A3D4F',
              '#1B3520', '#2A2010', '#1A1F58',
              '#200808', '#283018',
            ]
            const TILTS = [-1.8, 1.2, -0.4, 1.6, -1.2, 0.9, -2.1, 1.5]

            return (
              <div style={{ marginBottom: 48, borderTop: '2px dashed var(--color-rim)', paddingTop: 40 }}>

                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 28, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                      <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent)' }}>
                        More from the shelf
                      </span>
                    </div>
                    <h2 className="font-serif font-bold" style={{ fontSize: 28, color: 'var(--color-ink)', lineHeight: 1 }}>
                      More by{' '}
                      <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                        {book.author_name}
                      </span>
                    </h2>
                  </div>
                  {!otherWorksLoading && otherWorks.length > 0 && (
                    <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--color-ink-3)', flexShrink: 0 }}>
                      {otherWorks.length} Works
                    </span>
                  )}
                </div>

                {/* Shelf */}
                {otherWorksLoading ? (
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ paddingTop: 20 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex-none animate-pulse" style={{ width: 190 }}>
                        <div className="rounded-lg mb-3" style={{ width: 190, height: 285, backgroundColor: 'var(--color-surface)' }} />
                        <div className="h-3 rounded mb-1.5" style={{ width: '80%', backgroundColor: 'var(--color-surface)' }} />
                        <div className="h-2.5 rounded" style={{ width: '50%', backgroundColor: 'var(--color-surface)' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ paddingTop: 20, paddingLeft: 4, paddingRight: 4 }}>
                    {otherWorks.map((work, i) => {
                      const bgColor     = WORK_BG[i % WORK_BG.length]
                      const tilt        = TILTS[i % TILTS.length]
                      const isNavigating = navigatingKey === work.key
                      const spineType   = i % 5

                      return (
                        <button
                          key={work.key}
                          onClick={() => handleWorkClick(work)}
                          disabled={!!navigatingKey}
                          className="flex-none text-left transition-opacity hover:opacity-85 disabled:opacity-50"
                          style={{ width: 190 }}
                        >
                          {/* Tilted book card */}
                          <div
                            style={{
                              width: 190, height: 285,
                              position: 'relative',
                              borderRadius: 6,
                              overflow: 'hidden',
                              backgroundColor: bgColor,
                              border: '2px solid rgba(26,26,26,0.75)',
                              boxShadow: '5px 5px 0px rgba(0,0,0,0.55)',
                              transform: `rotate(${tilt}deg)`,
                              transformOrigin: 'bottom center',
                              transition: 'transform 0.25s ease',
                              marginBottom: 16,
                            }}
                          >
                            {/* Cover image */}
                            {work.cover_url && (
                              <img
                                src={work.cover_url}
                                alt={work.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            )}

                            {/* Gradient overlay */}
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 38%, rgba(0,0,0,0.78) 68%)',
                            }} />

                            {/* Spine decorations — deterministic by index */}
                            {spineType === 0 && (
                              <div style={{ position: 'absolute', left: 14, right: 14, top: '57%', height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                            )}
                            {spineType === 1 && (
                              <div style={{ position: 'absolute', top: 32, left: 14, width: 11, height: 11, borderRadius: '50%', backgroundColor: 'rgba(167,139,250,0.72)' }} />
                            )}
                            {spineType === 2 && (
                              <div style={{ position: 'absolute', top: 20, left: 14, right: 14, height: 100, border: '1.5px solid rgba(213,88,46,0.42)', borderRadius: 2 }} />
                            )}
                            {spineType === 3 && (
                              <div style={{ position: 'absolute', right: 14, top: 14, bottom: '34%', width: 1, backgroundColor: 'rgba(241,199,91,0.48)' }} />
                            )}
                            {spineType === 4 && (
                              <div style={{ position: 'absolute', right: 14, top: 14, bottom: '34%', width: 1, backgroundColor: 'rgba(241,199,91,0.48)' }} />
                            )}

                            {/* Author name */}
                            <p
                              className="absolute font-bold uppercase"
                              style={{
                                top: 12, left: 12, right: 12,
                                fontSize: 8, letterSpacing: '0.16em',
                                color: 'rgba(255,255,255,0.52)',
                                lineHeight: 1.3,
                              }}
                            >
                              {book.author_name}
                            </p>

                            {/* Title */}
                            <p
                              className="absolute font-serif font-bold"
                              style={{
                                bottom: 12, left: 12, right: 12,
                                fontSize: 15, lineHeight: 1.2,
                                color: '#FAF6EB',
                              }}
                            >
                              {work.title}
                            </p>

                            {isNavigating && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(250,246,235,0.82)' }}>
                                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
                              </div>
                            )}
                          </div>

                          {/* Below card */}
                          <p className="font-bold line-clamp-1" style={{ fontSize: 12, color: 'var(--color-ink)', marginBottom: 3 }}>
                            {work.title}
                          </p>
                          <div className="flex items-center gap-1">
                            {work.year && (
                              <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{work.year}</span>
                            )}
                            {work.ratings_average && (
                              <>
                                <span style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>·</span>
                                <Star size={10} fill="currentColor" style={{ color: 'var(--color-accent)' }} />
                                <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{work.ratings_average}</span>
                              </>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Review & Personal Notes — 50/50 ── */}
          {isAuthenticated && (
            <div className="grid lg:grid-cols-2 gap-6 items-start" style={{ borderTop: '2px dashed var(--color-rim)', paddingTop: 40 }}>

              {/* Review card */}
              <div
                style={{
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 16,
                  boxShadow: '5px 5px 0px var(--color-accent-teal)',
                  padding: '28px',
                }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 22 }}>
                  <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-teal)', flexShrink: 0 }} />
                  <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent-teal)' }}>
                    Your Take
                  </span>
                  <h2 className="font-serif font-bold" style={{ fontSize: 26, color: 'var(--color-ink)', lineHeight: 1 }}>
                    Write a review
                  </h2>
                </div>
                <ReviewForm userBook={userBook} onReviewSubmit={refetch} />
              </div>

              {/* Personal Notes card */}
              {userBook && (
                <div
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '2px solid #1A1A1A',
                    borderRadius: 16,
                    boxShadow: '5px 5px 0px var(--color-accent-yellow)',
                    padding: '28px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Warm shimmer — top right */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute', top: 0, right: 0,
                      width: '55%', height: '100%',
                      background: 'radial-gradient(ellipse at top right, rgba(241,199,91,0.14) 0%, transparent 58%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 12, position: 'relative' }}>
                    <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-yellow)', flexShrink: 0 }} />
                    <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--color-accent-yellow)' }}>
                      Only You
                    </span>
                    <h2 className="font-serif font-bold" style={{ fontSize: 26, color: '#FAF6EB', lineHeight: 1, flex: 1 }}>
                      Personal notes
                    </h2>
                    <span
                      className="font-bold uppercase"
                      style={{
                        fontSize: 9, letterSpacing: '0.18em',
                        color: 'var(--color-accent-yellow)',
                        border: '1.5px solid var(--color-accent-yellow)',
                        borderRadius: 4, padding: '3px 8px',
                        transform: 'rotate(-2deg)',
                        display: 'inline-flex',
                        alignItems: 'center', gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Lock size={9} /> Private
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'rgba(250,246,235,0.48)', lineHeight: 1.6, marginBottom: 18, position: 'relative' }}>
                    Your private space to capture thoughts, quotes, or anything you want to remember.{' '}
                    <strong style={{ color: 'rgba(250,246,235,0.78)', fontWeight: 700 }}>Never</strong> shown to anyone else. Encrypted at rest.
                  </p>

                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
                    rows={6}
                    placeholder="What struck you? A quote you loved? Write anything — this is just for you."
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(255,255,255,0.11)',
                      color: '#FAF6EB',
                      borderRadius: 10,
                      padding: '14px 16px',
                      fontSize: 14,
                      width: '100%',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.65,
                      transition: 'border-color 0.15s',
                      position: 'relative',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(241,199,91,0.38)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)')}
                  />

                  <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
                    <span style={{ fontSize: 11, color: 'rgba(250,246,235,0.3)' }}>
                      {lastSaved ? `saved ${timeAgo(lastSaved)}` : ''}
                    </span>
                    <button
                      onClick={async () => {
                        if (!userBook.id) return
                        try {
                          await saveNotes(userBook.id, notes)
                          setNotesSaved(true)
                          setLastSaved(new Date())
                        } catch {}
                      }}
                      disabled={notesLoading || notesSaved || !notes.trim()}
                      className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
                      style={{
                        fontSize: 11, letterSpacing: '0.12em',
                        border: '1.5px solid rgba(250,246,235,0.32)',
                        borderRadius: 999,
                        padding: '8px 18px',
                        backgroundColor: 'transparent',
                        color: '#FAF6EB',
                      }}
                    >
                      {notesSaved
                        ? <><Check size={11} /> Saved</>
                        : notesLoading ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <QuickUpdateModal
        userBook={userBook || { id: 0, book_id: book.id ?? 0, book: book, status: 'to_read' } as any}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={refetch}
      />
      <SuggestToFriendModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        bookId={internalBookId}
        bookTitle={book.title}
        bookData={book}
      />
    </div>
  )
}
