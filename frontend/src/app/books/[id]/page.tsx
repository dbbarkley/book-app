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
  Avatar,
  QuickUpdateModal
} from '@/components'
import { formatDate } from '@/utils/format'
import {
  Calendar,
  Users,
  Star,
  Plus,
  Check,
  ChevronLeft,
  BookOpen,
  Lock,
  Globe,
  NotebookPen,
} from 'lucide-react'

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

export default function BookPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const fromScanner = searchParams.get('scanner') === 'true'
  const rawParam = params.id as string

  // Detect whether this is a numeric internal ID or a Google Books ID string
  const numericId = parseInt(rawParam, 10)
  const isNumeric = !isNaN(numericId) && String(numericId) === rawParam
  // The identifier we pass to useBookDetails: number for DB books, string for Google Books IDs
  const bookIdentifier: number | string = isNumeric ? numericId : rawParam

  const { book, userBook, loading, error, refetch } = useBookDetails(bookIdentifier)
  const { friends, loading: friendsLoading } = useBookFriends(book?.id ?? 0)
  const { isAuthenticated } = useAuth()
  const { isFollowing, follow, unfollow, getFollowId } = useFollows()
  const { saveNotes, loading: notesLoading } = useBookNotes()

  const [isFollowingBook, setIsFollowingBook] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [otherWorks, setOtherWorks] = useState<{ key: string; title: string; year: number | null; cover_url: string | null; ratings_average: number | null; readinglog_count: number }[]>([])
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

  // Fetch other works by the same author via Open Library (sorted by popularity)
  useEffect(() => {
    if (!book?.author_name) return
    let cancelled = false
    const fetchOtherWorks = async () => {
      setOtherWorksLoading(true)
      try {
        const p = new URLSearchParams({
          author: book.author_name!,
          exclude: book.title,
        })
        const token = apiClient.getToken()
        const res = await fetch(`/api/books/author-works?${p}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setOtherWorks(data.works || [])
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
    'read': 'Finished Reading',
    'dnf': 'Did Not Finish'
  }

  return (
    <div className="min-h-screen">
      {/* Immersive blurred header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        {book.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-15 scale-110"
            style={{ backgroundImage: `url(${book.cover_image_url})` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-canvas))' }} />
      </div>

      <div className="container-mobile -mt-48 sm:-mt-56 relative z-10 pb-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">

          {/* Left Column: Cover & Actions */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            {/* Back button sits just above the cover, left-aligned with it */}
            <button
              onClick={handleBack}
              className="self-start mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95"
              style={{
                color: 'var(--color-lit-3)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="w-56 sm:w-64 shadow-2xl rounded-2xl overflow-hidden mb-8 transform transition-transform hover:scale-[1.02] duration-300">
              <BookCoverImage
                src={book.cover_image_url}
                title={book.title}
                author={book.author_name}
                size="large"
                className="w-full aspect-[2/3] object-cover"
                layoutId={`book-cover-${book.google_books_id ?? book.id}`}
              />
            </div>

            {isAuthenticated ? (
              <div className="w-full space-y-3">
                {userBook ? (
                  <Button onClick={() => setIsUpdateModalOpen(true)} variant="primary" fullWidth size="lg" className="rounded-2xl py-4 font-bold flex gap-2">
                    <Check className="w-5 h-5" />
                    {shelfLabels[userBook.status] || 'On My Shelf'}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setIsUpdateModalOpen(true)} variant="primary" fullWidth size="lg" className="rounded-2xl py-4 font-bold flex gap-2">
                      <Plus className="w-5 h-5" />
                      Add to Shelf
                    </Button>
                    {/* Follow only available for books already in our DB */}
                    {internalBookId && (
                      <Button
                        onClick={handleFollowToggle}
                        variant="outline"
                        fullWidth
                        size="lg"
                        disabled={followLoading}
                        className="rounded-2xl font-bold flex gap-2"
                      >
                        {isFollowingBook ? <>✓ Following Updates</> : <>+ Follow Book Updates</>}
                      </Button>
                    )}
                  </>
                )}

                {userBook && (
                  <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold uppercase tracking-widest text-lit-3">
                    <Check className="w-3 h-3 text-success" /> Receiving Updates
                    <span className="mx-1">•</span>
                    {userBook.visibility === 'private' ? (
                      <><Lock className="w-3 h-3" /> Private</>
                    ) : (
                      <><Globe className="w-3 h-3" /> Public</>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full rounded-3xl p-6 text-center" style={cardStyle}>
                <p className="text-lit-2 text-sm mb-4 font-medium">Sign in to track this book</p>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="primary" fullWidth size="sm" className="rounded-xl">Login</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button variant="outline" fullWidth size="sm" className="rounded-xl">Sign Up</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Title */}
            <div className="text-center lg:text-left space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-lit leading-tight">
                {book.title}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start">
                <span className="text-xl sm:text-2xl font-medium text-accent">
                  by {book.author_name}
                </span>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-lit-3)' }} />
                <div className="flex items-center gap-2 text-lit-2 font-medium">
                  <Calendar className="w-4 h-4" />
                  {formatDate(book.release_date)}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pages', value: book.page_count || '---' },
                { label: 'ISBN', value: book.isbn || 'N/A', small: true },
                { label: 'Genre', value: getDisplayGenre(book.categories), small: true },
              ].map(({ label, value, small }) => (
                <div key={label} className="rounded-2xl p-4 text-center" style={cardStyle}>
                  <p className="text-[10px] font-bold text-lit-3 uppercase tracking-widest mb-1">{label}</p>
                  <p className={`font-bold text-lit truncate px-2 ${small ? 'text-sm' : 'text-xl'}`}>{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Friends who have this — only available for DB books */}
            {isAuthenticated && internalBookId && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-lit flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Friends who have this
                </h3>
                {friendsLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />)}
                  </div>
                ) : friends.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {friends.map((friend: { id: number; username: string; display_name?: string; avatar_url?: string; status: string }) => (
                      <Link
                        key={friend.id}
                        href={`/users/${friend.id}`}
                        className="group flex items-center gap-2 pl-1 pr-4 py-1 rounded-full transition-all"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}
                        title={`${friend.display_name || friend.username} is ${shelfLabels[friend.status] || friend.status}`}
                      >
                        <Avatar src={friend.avatar_url} name={friend.display_name || friend.username} size="sm" />
                        <span className="text-xs font-bold text-lit-2 group-hover:text-accent transition-colors">
                          {friend.display_name || friend.username}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-lit-3 italic rounded-2xl p-4 text-center" style={{ border: '1px dashed var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
                    None of your friends have added this book yet.
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-lit">Description</h3>
              <p className="text-lit-2 leading-relaxed text-lg whitespace-pre-wrap">
                {book.description || "No description available for this book."}
              </p>
            </div>


            {/* Other works by this author — sorted by Open Library popularity */}
            {(otherWorksLoading || otherWorks.length > 0) && (
              <div className="space-y-5 pt-10" style={{ borderTop: '1px solid var(--color-rim)' }}>
                <div className="flex items-baseline gap-3">
                  <h3 className="font-serif text-2xl font-bold text-lit">
                    More by {book.author_name}
                  </h3>
                  {!otherWorksLoading && otherWorks.length > 0 && (
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
                      {otherWorks.length} works
                    </span>
                  )}
                </div>

                {otherWorksLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-none w-32 animate-pulse">
                        <div className="w-full rounded-xl mb-2" style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)' }} />
                        <div className="h-3 rounded-full w-3/4 mb-1.5" style={{ backgroundColor: 'var(--color-grove)' }} />
                        <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-grove)' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                    {otherWorks.map(work => {
                      const isNavigating = navigatingKey === work.key
                      return (
                        <button
                          key={work.key}
                          onClick={() => handleWorkClick(work)}
                          disabled={!!navigatingKey}
                          className="flex-none w-32 text-left group"
                        >
                          <div
                            className="w-full rounded-xl overflow-hidden mb-2 transition-transform duration-200 group-hover:scale-[1.03] relative"
                            style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                          >
                            {work.cover_url ? (
                              <img
                                src={work.cover_url}
                                alt={work.title}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen size={24} style={{ color: 'var(--color-lit-3)' }} />
                              </div>
                            )}
                            {/* Loading overlay */}
                            {isNavigating && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(13,26,15,0.7)' }}>
                                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold line-clamp-2 leading-tight group-hover:text-accent transition-colors" style={{ color: 'var(--color-lit)' }}>
                            {work.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {work.year && (
                              <span className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>{work.year}</span>
                            )}
                            {work.ratings_average && (
                              <>
                                <span style={{ color: 'var(--color-lit-3)' }}>·</span>
                                <Star size={10} style={{ color: 'var(--color-accent)' }} />
                                <span className="text-[11px]" style={{ color: 'var(--color-lit-3)' }}>{work.ratings_average}</span>
                              </>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Review Section */}
            {isAuthenticated && (
              <div className="space-y-6 pt-10" style={{ borderTop: '1px solid var(--color-rim)' }}>
                <h3 className="font-serif text-2xl font-bold text-lit">Write a Review</h3>
                <div className="rounded-3xl p-6 sm:p-8" style={cardStyle}>
                  <ReviewForm userBook={userBook} onReviewSubmit={refetch} />
                </div>
              </div>
            )}

            {/* Personal Notes — only visible to the owner, always private */}
            {isAuthenticated && userBook && (
              <div className="space-y-4 pt-10" style={{ borderTop: '1px solid var(--color-rim)' }}>
                <div className="flex items-center gap-2">
                  <NotebookPen className="w-5 h-5" style={{ color: 'var(--color-lit-3)' }} />
                  <h3 className="font-serif text-2xl font-bold text-lit">Personal Notes</h3>
                  <span
                    className="ml-1 flex items-center gap-1 text-xs font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                    style={{ color: 'var(--color-lit-3)', backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                  >
                    <Lock className="w-3 h-3" /> Only you
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                  Your private space to capture thoughts, quotes, or anything you want to remember. Never shown to anyone else.
                </p>
                <div className="rounded-3xl p-6 sm:p-8 space-y-4" style={cardStyle}>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }}
                    rows={6}
                    placeholder="What struck you about this book? A quote you loved? How it made you feel? Write anything — this is just for you."
                    style={{
                      backgroundColor: 'var(--color-grove)',
                      border: '1px solid var(--color-rim)',
                      color: 'var(--color-lit)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 14,
                      width: '100%',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.6,
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-lit-3)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                  />
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, color: 'var(--color-lit-3)' }}>
                      {notes.length} characters
                    </span>
                    <button
                      onClick={async () => {
                        if (!userBook.id) return
                        try {
                          await saveNotes(userBook.id, notes)
                          setNotesSaved(true)
                        } catch {}
                      }}
                      disabled={notesLoading}
                      className="px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: notesSaved ? 'transparent' : 'var(--color-accent)',
                        color: notesSaved ? 'var(--color-lit-3)' : 'var(--color-accent-on)',
                        border: notesSaved ? '1px solid var(--color-rim)' : '1px solid transparent',
                      }}
                    >
                      {notesLoading ? 'Saving…' : notesSaved ? '✓ Saved' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Update Modal */}
      <QuickUpdateModal
        userBook={userBook || { id: 0, book_id: book.id ?? 0, book: book, status: 'to_read' } as any}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={refetch}
      />
    </div>
  )
}
