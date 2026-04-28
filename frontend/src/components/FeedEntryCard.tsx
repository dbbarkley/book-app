'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Star, UserPlus, UserCheck, Sparkles, BookMarked, Rss } from 'lucide-react'
import Avatar from './Avatar'
import { BookCoverImage } from './BookCoverImage'
import type { FeedEntry } from '@book-app/shared'

interface FeedEntryCardProps {
  entry: FeedEntry
}

// Mini book cover used inside cards
function MiniCover({ src, title, author, bookId, googleBooksId }: {
  src?: string; title: string; author?: string; bookId?: number; googleBooksId?: string
}) {
  const router = useRouter()
  const href = googleBooksId ? `/books/${googleBooksId}` : bookId ? `/books/${bookId}` : null
  const el = (
    <div className="w-10 flex-shrink-0 rounded-lg overflow-hidden shadow-md" style={{ aspectRatio: '2/3' }}>
      <BookCoverImage src={src} title={title} author={author} size="small" className="w-full h-full object-cover" />
    </div>
  )
  if (!href) return el
  return <button onClick={() => router.push(href)} className="flex-shrink-0">{el}</button>
}

// Star rating dots
function Stars({ rating }: { rating?: number | null }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < full ? 'var(--color-accent)' : i === full && half ? 'var(--color-accent)' : 'none'}
          style={{ color: 'var(--color-accent)', opacity: i >= full && !(i === full && half) ? 0.3 : 1 }}
        />
      ))}
      <span className="text-xs ml-1 font-semibold" style={{ color: 'var(--color-accent)' }}>{rating}</span>
    </div>
  )
}

export default function FeedEntryCard({ entry }: FeedEntryCardProps) {
  const router = useRouter()
  const { activity_type, metadata, feedable, new: isNew } = entry

  const actor = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : null

  // Book info — prefer from feedable, fall back to metadata.book
  const fb = feedable as any
  const book = fb?.book || metadata?.book || (fb?.type === 'Book' ? fb : null)
  const googleBooksId = book?.google_books_id
  const bookHref = googleBooksId ? `/books/${googleBooksId}` : book?.id ? `/books/${book.id}` : null

  const cardBase = {
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${isNew ? 'var(--color-rim-accent)' : 'var(--color-rim)'}`,
    boxShadow: isNew ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
  }

  const ActorLink = ({ children }: { children: React.ReactNode }) =>
    actorHref ? (
      <button onClick={() => router.push(actorHref)} className="font-bold hover:underline" style={{ color: 'var(--color-lit)' }}>
        {children}
      </button>
    ) : <span className="font-bold" style={{ color: 'var(--color-lit)' }}>{children}</span>

  const BookLink = ({ children }: { children: React.ReactNode }) =>
    bookHref ? (
      <button onClick={() => router.push(bookHref)} className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
        {children}
      </button>
    ) : <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{children}</span>

  // ── FRIEND REQUEST ─────────────────────────────────────────────────────────
  if (activity_type === 'friend_request') {
    const user = metadata?.user
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={cardBase}>
        {isNew && <span className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />}
        <button onClick={() => user?.id && router.push(`/users/${user.id}`)} className="flex-shrink-0">
          <Avatar src={user?.avatar_url} name={user?.display_name || user?.username || '?'} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            <button onClick={() => user?.id && router.push(`/users/${user.id}`)} className="font-bold hover:underline" style={{ color: 'var(--color-lit)' }}>
              {user?.display_name || user?.username}
            </button>
            {' '}sent you a friend request
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <UserPlus size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── FRIEND ACCEPTED ────────────────────────────────────────────────────────
  if (activity_type === 'friend_accepted') {
    const user = metadata?.user
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => user?.id && router.push(`/users/${user.id}`)} className="flex-shrink-0">
          <Avatar src={user?.avatar_url} name={user?.display_name || user?.username || '?'} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            <button onClick={() => user?.id && router.push(`/users/${user.id}`)} className="font-bold hover:underline" style={{ color: 'var(--color-lit)' }}>
              {user?.display_name || user?.username}
            </button>
            {' '}accepted your friend request
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <UserCheck size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── BOOK SUGGESTION ────────────────────────────────────────────────────────
  if (activity_type === 'book_suggestion') {
    const suggester = metadata?.suggester
    const sugBook = metadata?.book
    const sugBookHref = sugBook?.google_books_id ? `/books/${sugBook.google_books_id}` : sugBook?.id ? `/books/${sugBook.id}` : null
    return (
      <div className="flex gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => suggester?.id && router.push(`/users/${suggester.id}`)} className="flex-shrink-0 mt-0.5">
          <Avatar src={suggester?.avatar_url} name={suggester?.display_name || suggester?.username || '?'} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-1" style={{ color: 'var(--color-lit-2)' }}>
            <button onClick={() => suggester?.id && router.push(`/users/${suggester.id}`)} className="font-bold hover:underline" style={{ color: 'var(--color-lit)' }}>
              {suggester?.display_name || suggester?.username}
            </button>
            {' '}suggested a book for you
          </p>
          {sugBook && (
            <div className="flex items-center gap-2.5 mt-2">
              <MiniCover src={sugBook.cover_image_url} title={sugBook.title} author={sugBook.author_name} bookId={sugBook.id} googleBooksId={sugBook.google_books_id} />
              <div className="min-w-0">
                <button onClick={() => sugBookHref && router.push(sugBookHref)} className="text-sm font-semibold hover:underline text-left truncate block" style={{ color: 'var(--color-accent)' }}>
                  {sugBook.title}
                </button>
                {sugBook.author_name && <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{sugBook.author_name}</p>}
              </div>
            </div>
          )}
          {metadata?.message && (
            <p className="text-xs italic mt-2" style={{ color: 'var(--color-lit-2)' }}>&ldquo;{metadata.message}&rdquo;</p>
          )}
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <Sparkles size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── USER ADDED BOOK ────────────────────────────────────────────────────────
  if (activity_type === 'user_added_book') {
    const status = fb?.status || 'to_read'
    const statusLabel = status === 'reading' ? 'started reading' : 'wants to read'
    return (
      <div className="flex gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => actorHref && router.push(actorHref)} className="flex-shrink-0 mt-0.5">
          <Avatar src={actor?.avatar_url} name={actorName} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-2" style={{ color: 'var(--color-lit-2)' }}>
            <ActorLink>{actorName}</ActorLink>
            {' '}{statusLabel}
          </p>
          {book && (
            <div className="flex items-center gap-2.5">
              <MiniCover src={book.cover_image_url} title={book.title} author={book.author_name} bookId={book.id} googleBooksId={book.google_books_id} />
              <div className="min-w-0">
                <BookLink>{book.title}</BookLink>
                {book.author_name && <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{book.author_name}</p>}
              </div>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <BookOpen size={16} style={{ color: 'var(--color-lit-3)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── USER FINISHED BOOK ─────────────────────────────────────────────────────
  if (activity_type === 'user_finished_book') {
    return (
      <div className="flex gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => actorHref && router.push(actorHref)} className="flex-shrink-0 mt-0.5">
          <Avatar src={actor?.avatar_url} name={actorName} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-2" style={{ color: 'var(--color-lit-2)' }}>
            <ActorLink>{actorName}</ActorLink>
            {' '}finished reading
          </p>
          {book && (
            <div className="flex items-center gap-2.5">
              <MiniCover src={book.cover_image_url} title={book.title} author={book.author_name} bookId={book.id} googleBooksId={book.google_books_id} />
              <div className="min-w-0">
                <BookLink>{book.title}</BookLink>
                {book.author_name && <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{book.author_name}</p>}
              </div>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <CheckCircle size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── USER REVIEW ────────────────────────────────────────────────────────────
  if (activity_type === 'user_review') {
    const rating = fb?.rating || metadata?.rating
    const review = fb?.review || metadata?.review
    return (
      <div className="flex gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => actorHref && router.push(actorHref)} className="flex-shrink-0 mt-0.5">
          <Avatar src={actor?.avatar_url} name={actorName} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-1" style={{ color: 'var(--color-lit-2)' }}>
            <ActorLink>{actorName}</ActorLink>
            {' '}reviewed a book
          </p>
          {book && (
            <div className="flex items-start gap-2.5 mt-2">
              <MiniCover src={book.cover_image_url} title={book.title} author={book.author_name} bookId={book.id} googleBooksId={book.google_books_id} />
              <div className="min-w-0 flex-1">
                <BookLink>{book.title}</BookLink>
                {book.author_name && <p className="text-xs mb-1" style={{ color: 'var(--color-lit-3)' }}>{book.author_name}</p>}
                <Stars rating={rating} />
                {review && (
                  <p className="text-xs italic mt-1.5 line-clamp-3" style={{ color: 'var(--color-lit-2)' }}>
                    &ldquo;{review}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <Star size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── USER FOLLOWED USER ─────────────────────────────────────────────────────
  if (activity_type === 'user_followed_user') {
    const target = metadata?.target_user
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => actorHref && router.push(actorHref)} className="flex-shrink-0">
          <Avatar src={actor?.avatar_url} name={actorName} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            <ActorLink>{actorName}</ActorLink>
            {' '}followed{' '}
            {target?.id ? (
              <button
                onClick={() => router.push(`/users/${target.id}`)}
                className="font-bold hover:underline"
                style={{ color: 'var(--color-lit)' }}
              >
                {target.display_name || target.username}
              </button>
            ) : (
              <span className="font-bold" style={{ color: 'var(--color-lit)' }}>
                {target?.display_name || target?.username || 'a user'}
              </span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <Rss size={16} style={{ color: 'var(--color-lit-3)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── USER FOLLOWED AUTHOR ───────────────────────────────────────────────────
  if (activity_type === 'user_followed_author') {
    const target = metadata?.target_author
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={cardBase}>
        <button onClick={() => actorHref && router.push(actorHref)} className="flex-shrink-0">
          <Avatar src={actor?.avatar_url} name={actorName} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
            <ActorLink>{actorName}</ActorLink>
            {' '}is now following{' '}
            {target?.id ? (
              <button
                onClick={() => router.push(`/authors/${target.id}`)}
                className="font-bold hover:underline"
                style={{ color: 'var(--color-lit)' }}
              >
                {target.name}
              </button>
            ) : (
              <span className="font-bold" style={{ color: 'var(--color-lit)' }}>
                {target?.name || 'an author'}
              </span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
        </div>
        <Rss size={16} style={{ color: 'var(--color-lit-3)', flexShrink: 0 }} />
        {isNew && <NewBadge />}
      </div>
    )
  }

  // ── FALLBACK (unhandled types) ─────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={cardBase}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-grove)' }}>
        <BookMarked size={16} style={{ color: 'var(--color-lit-3)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>
          {activity_type.replace(/_/g, ' ')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
      </div>
      {isNew && <NewBadge />}
    </div>
  )
}

function NewBadge() {
  return (
    <span
      className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full self-start"
      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
    >
      New
    </span>
  )
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
