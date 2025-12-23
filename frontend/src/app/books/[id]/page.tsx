'use client'

// Book Detail Page - Shows book information, shelf status, reading progress, and reviews
// Uses shared hooks and components
// Mobile-first design with TailwindCSS
// Integrated with Rails API backend

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  useBookDetails, 
  useFollows, 
  useAuth, 
  useBooksStore,
} from '@book-app/shared'
import { useBookFriends } from '@book-app/shared/hooks/useBookFriends'
import { 
  ReviewForm, 
  BookCoverImage, 
  Button,
  QuickUpdateModal
} from '@/components'
import { formatDate } from '@/utils/format'
import { 
  Calendar, 
  Users, 
  Book as BookIcon, 
  Star, 
  ExternalLink,
  Plus,
  Check,
  ChevronRight,
  BookOpen,
  Lock,
  Globe
} from 'lucide-react'

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
  const { friends, loading: friendsLoading } = useBookFriends(bookId)
  const { isAuthenticated } = useAuth()
  const { isFollowing, follow, unfollow, getFollowId } = useFollows()
  
  const [isFollowingBook, setIsFollowingBook] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  
  const router = useRouter()
  const redirectBookId = useBooksStore((state) => state.bookIdRedirectMap[bookId])

  // Check if this is a Google Books result (negative ID)
  const isGoogleBooksResult = bookId < 0

  useEffect(() => {
    if (book && book.id > 0) {
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

  useEffect(() => {
    if (book && book.id < 0 && redirectBookId) {
      router.replace(`/books/${redirectBookId}`)
    }
  }, [book, redirectBookId, router])

  // Fix: Ensure page starts at the top when navigating or after loading
  useEffect(() => {
    if (!loading && book) {
      window.scrollTo(0, 0)
    }
  }, [bookId, loading, !!book])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 font-medium tracking-wide">Loading your book...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container-mobile py-24">
        <div className="text-center max-w-md mx-auto">
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Book Not Found</h1>
          <p className="text-slate-600 mb-8 text-lg">We couldn't find the book you're looking for.</p>
          <Link href="/books/search">
            <Button variant="primary" size="lg">Search for Books</Button>
          </Link>
        </div>
      </div>
    )
  }

  const shelfLabels: Record<string, string> = {
    'reading': 'Currently Reading',
    'to_read': 'Want to Read',
    'read': 'Finished Reading',
    'dnf': 'Did Not Finish'
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Immersive Header Background */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        {/* Blurred Background Cover */}
        {book.cover_image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
            style={{ backgroundImage: `url(${book.cover_image_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/30" />
      </div>

      <div className="container-mobile -mt-48 sm:-mt-56 relative z-10 pb-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          
          {/* Left Column: Cover & Actions */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="w-56 sm:w-64 shadow-2xl rounded-2xl overflow-hidden mb-8 transform transition-transform hover:scale-[1.02] duration-300">
              <BookCoverImage
                src={book.cover_image_url}
                title={book.title}
                author={book.author_name}
                size="large"
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {isAuthenticated ? (
              <div className="w-full space-y-3">
                {userBook ? (
                  <Button 
                    onClick={() => setIsUpdateModalOpen(true)}
                    variant="primary" 
                    fullWidth 
                    size="lg"
                    className="rounded-2xl shadow-xl shadow-primary-600/20 py-4 font-bold flex gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {shelfLabels[userBook.status] || 'On My Shelf'}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => setIsUpdateModalOpen(true)}
                      variant="primary" 
                      fullWidth 
                      size="lg"
                      className="rounded-2xl shadow-xl shadow-primary-600/20 py-4 font-bold flex gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add to Shelf
                    </Button>
                    
                    <Button 
                      onClick={handleFollowToggle}
                      variant="outline" 
                      fullWidth 
                      size="lg"
                      disabled={followLoading || isGoogleBooksResult}
                      className="rounded-2xl bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex gap-2"
                    >
                      {isFollowingBook ? (
                        <>✓ Following Updates</>
                      ) : (
                        <>+ Follow Book Updates</>
                      )}
                    </Button>
                  </>
                )}

                {userBook && (
                  <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Check className="w-3 h-3 text-green-500" /> Receiving Updates
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
              <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
                <p className="text-slate-600 text-sm mb-4 font-medium">Sign in to track this book</p>
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
            {/* Title Section */}
            <div className="text-center lg:text-left space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
                {book.title}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start">
                <Link 
                  href={book.author ? `/authors/${book.author.id}` : '#'}
                  className="text-xl sm:text-2xl font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-2 group"
                >
                  by {book.author_name}
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -ml-1" />
                </Link>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Calendar className="w-4 h-4" />
                  {formatDate(book.release_date)}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Followers</p>
                <p className="text-xl font-black text-slate-900">{book.followers_count || 0}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pages</p>
                <p className="text-xl font-black text-slate-900">{book.page_count || '---'}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ISBN</p>
                <p className="text-sm font-bold text-slate-900 truncate px-2">{book.isbn || 'N/A'}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Format</p>
                <p className="text-xl font-black text-slate-900">Hardcover</p>
              </div>
            </div>

            {/* Friends Section */}
            {isAuthenticated && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Friends who have this
                </h3>
                {friendsLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />)}
                  </div>
                ) : friends.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {friends.map(friend => (
                      <Link 
                        key={friend.id} 
                        href={`/users/${friend.id}`}
                        className="group flex items-center gap-2 bg-white border border-slate-100 rounded-full pl-1 pr-4 py-1 hover:border-primary-200 hover:shadow-md transition-all shadow-sm"
                        title={`${friend.display_name || friend.username} is ${shelfLabels[friend.status] || friend.status}`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {friend.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-primary-600 transition-colors">
                          {friend.display_name || friend.username}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
                    None of your friends have added this book yet.
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Description</h3>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                {book.description || "No description available for this book."}
              </p>
            </div>

            {/* Author Section */}
            {book.author && (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-lg border-4 border-white flex-none">
                    {book.author.avatar_url ? (
                      <img src={book.author.avatar_url} alt={book.author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-300">
                        {book.author.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">About the Author</p>
                    <h3 className="text-2xl font-black text-slate-900">{book.author.name}</h3>
                    <Link 
                      href={`/authors/${book.author.id}`}
                      className="text-sm font-bold text-primary-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View Profile <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                {book.author.bio && (
                  <p className="text-slate-600 leading-relaxed line-clamp-4 italic">
                    "{book.author.bio}"
                  </p>
                )}
              </div>
            )}

            {/* Review Section */}
            {isAuthenticated && (
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h3 className="text-2xl font-black text-slate-900">Write a Review</h3>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <ReviewForm userBook={userBook} onReviewSubmit={refetch} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Update Modal */}
      {isUpdateModalOpen && (
        <QuickUpdateModal
          userBook={userBook || { id: 0, book_id: book.id, book: book, status: 'to_read' } as any}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={refetch}
        />
      )}
    </div>
  )
}
