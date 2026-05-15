'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Star, UserPlus, UserCheck, Sparkles, BookMarked, Rss } from 'lucide-react'
import Avatar from './Avatar'
import { BookCoverImage } from './BookCoverImage'
import type { FeedEntry } from '@book-app/shared'

interface FeedEntryCardProps {
  entry: FeedEntry
  /**
   * 'featured' → hero card with blurred cover background (home milestones)
   * 'default'  → left-accent-stripe enriched card
   * 'compact'  → single-row social pill
   *
   * Social-type events automatically collapse to 'compact' in the default
   * variant, so callers don't need to inspect activity_type.
   */
  variant?: 'featured' | 'default' | 'compact'
}

/** True for purely social events that warrant the compact pill treatment. */
export function isSocialFeedType(t: string): boolean {
  return (
    t === 'friend_request' ||
    t === 'friend_accepted' ||
    t === 'user_followed_author' ||
    t === 'user_followed_user'
  )
}

/** Per-activity accent color for left stripes, badges, and icons. */
export function typeAccentColor(t: string): string {
  switch (t) {
    case 'user_finished_book':   return '#C9A84C' // gold
    case 'user_review':          return '#D4872A' // amber
    case 'user_progress_update': return '#5A9B72' // green
    case 'user_added_book':      return '#5B7FA6' // steel
    case 'book_release':
    case 'book_recommendation':  return '#8B6CC7' // purple
    case 'friend_accepted':      return '#5A9B72'
    case 'friend_request':       return 'var(--color-accent)'
    default:                     return 'var(--color-lit-3)'
  }
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

// Left accent stripe rendered inside every non-social, non-featured card
function LeftStripe({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        backgroundColor: color,
        borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
      }}
    />
  )
}

// New-indicator dot in the top-right corner
function NewDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute', top: 10, right: 10,
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: color,
      }}
    />
  )
}

// ── Featured Card ─────────────────────────────────────────────────────────────
function FeaturedCard({ entry, accentColor }: { entry: FeedEntry; accentColor: string }) {
  const router = useRouter()
  const { activity_type, metadata, feedable, created_at } = entry

  const actor = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const fb = feedable as any
  const book = fb?.book || metadata?.book || (fb?.type === 'Book' ? fb : null)
  const googleBooksId = book?.google_books_id
  const bookHref = googleBooksId ? `/books/${googleBooksId}` : book?.id ? `/books/${book.id}` : null

  const rating = metadata?.rating ?? fb?.rating
  const review = metadata?.review ?? fb?.review

  const isFinished = activity_type === 'user_finished_book'
  const actionLabel = isFinished ? 'finished reading' : 'reviewed'

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        border: `1px solid ${accentColor}44`,
        backgroundColor: 'var(--color-surface)',
        padding: 16,
      }}
    >
      {/* Blurred cover background */}
      {book?.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_image_url}
          alt=""
          aria-hidden
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: 'blur(26px)', opacity: 0.2,
          }}
        />
      )}
      {/* Dark scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,26,15,0.62)' }} />

      <div className="relative flex flex-col gap-3">
        {/* Top row: badge + cover */}
        <div className="flex items-start justify-between">
          <span
            className="flex items-center gap-1.5"
            style={{
              backgroundColor: `${accentColor}22`,
              border: `1px solid ${accentColor}55`,
              borderRadius: 9999,
              padding: '5px 10px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: accentColor,
            }}
          >
            {isFinished ? <CheckCircle size={11} /> : <Star size={11} />}
            {isFinished ? 'FINISHED' : 'REVIEW'}
          </span>

          {book && (
            <button
              onClick={() => bookHref && router.push(bookHref)}
              className="flex-shrink-0 rounded-lg overflow-hidden shadow-lg"
              style={{ width: 66, aspectRatio: '2/3' }}
            >
              <BookCoverImage
                src={book.cover_image_url}
                title={book.title}
                author={book.author_name}
                size="medium"
                className="w-full h-full object-cover"
              />
            </button>
          )}
        </div>

        {/* Actor row */}
        <button
          onClick={() => actor?.id && router.push(`/users/${actor.id}`)}
          className="flex items-center gap-2 self-start text-left"
        >
          <Avatar src={actor?.avatar_url} name={actorName} size="sm" />
          <div>
            <p className="font-bold text-[13px] truncate" style={{ color: 'var(--color-lit)' }}>{actorName}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-lit-2)' }}>{actionLabel}</p>
          </div>
        </button>

        {/* Book title */}
        {book && (
          <button
            onClick={() => bookHref && router.push(bookHref)}
            className="font-serif text-[19px] font-extrabold text-left line-clamp-2"
            style={{ color: 'var(--color-lit)', letterSpacing: '-0.4px' }}
          >
            {book.title}
          </button>
        )}

        {/* Star rating */}
        {activity_type === 'user_review' && rating != null && <Stars rating={rating} />}

        {/* Review excerpt */}
        {review && (
          <p className="text-[13px] italic line-clamp-2" style={{ color: 'var(--color-lit-2)' }}>
            &ldquo;{review}&rdquo;
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-right" style={{ color: 'var(--color-lit-3)' }}>
          {formatTime(created_at)}
        </p>
      </div>
    </div>
  )
}

// ── Compact Social Card ───────────────────────────────────────────────────────
function CompactCard({ entry, accentColor }: { entry: FeedEntry; accentColor: string }) {
  const router = useRouter()
  const { activity_type, metadata, new: isNew, created_at } = entry

  const actor = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const user = metadata?.user
  const target = metadata?.target_user
  const targetAuthor = metadata?.target_author

  const displayUser = user || target || actor
  const displayName = displayUser?.display_name || displayUser?.username || actorName
  const displayUri = displayUser?.avatar_url

  const goToUser = () => {
    const id = user?.id ?? target?.id ?? actor?.id
    if (id) router.push(`/users/${id}`)
  }

  const actionText =
    activity_type === 'friend_request'
      ? 'sent you a friend request'
      : activity_type === 'friend_accepted'
        ? 'accepted your friend request'
        : activity_type === 'user_followed_author'
          ? `is now following ${targetAuthor?.name || 'an author'}`
          : activity_type === 'user_followed_user'
            ? `followed ${target?.display_name || target?.username || 'someone'}`
            : activity_type.replace(/_/g, ' ')

  const Icon =
    activity_type === 'friend_request' ? UserPlus :
    activity_type === 'friend_accepted' ? UserCheck : Rss

  return (
    <button
      onClick={goToUser}
      className="relative w-full text-left"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 12,
        border: `1px solid ${isNew ? `${accentColor}55` : 'var(--color-rim)'}`,
        padding: '10px 12px',
      }}
    >
      {isNew && (
        <span
          aria-hidden
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 5, height: 5, borderRadius: 3,
            backgroundColor: accentColor,
          }}
        />
      )}
      <div className="flex items-center gap-2.5">
        <Avatar src={displayUri} name={displayName} size="sm" />
        <p className="flex-1 min-w-0 text-[13px] truncate" style={{ color: 'var(--color-lit-2)' }}>
          <span className="font-bold" style={{ color: 'var(--color-lit)' }}>{displayName}</span>
          {'  '}
          <span>{actionText}</span>
        </p>
        <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-lit-3)' }}>
          {formatTime(created_at)}
        </span>
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${accentColor}18` }}
        >
          <Icon size={13} style={{ color: accentColor }} />
        </span>
      </div>
    </button>
  )
}

export default function FeedEntryCard({ entry, variant = 'default' }: FeedEntryCardProps) {
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

  const accentColor = typeAccentColor(activity_type)

  // Explicit compact request, or social events auto-collapse to compact.
  if (variant === 'compact' || (variant === 'default' && isSocialFeedType(activity_type))) {
    return <CompactCard entry={entry} accentColor={accentColor} />
  }

  // Featured hero variant
  if (variant === 'featured') {
    return <FeaturedCard entry={entry} accentColor={accentColor} />
  }

  const cardBase = {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${isNew ? accentColor : 'var(--color-rim)'}`,
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

  // ── FEATURED milestone events (finished / review) get the featured card ───
  if (activity_type === 'user_finished_book' || activity_type === 'user_review') {
    return <FeaturedCard entry={entry} accentColor={accentColor} />
  }

  // ── BOOK SUGGESTION ────────────────────────────────────────────────────────
  if (activity_type === 'book_suggestion') {
    const suggester = metadata?.suggester
    const sugBook = metadata?.book
    const sugBookHref = sugBook?.google_books_id ? `/books/${sugBook.google_books_id}` : sugBook?.id ? `/books/${sugBook.id}` : null
    return (
      <div className="flex gap-3 pl-[19px] pr-4 py-4 rounded-2xl" style={cardBase}>
        <LeftStripe color={accentColor} />
        {isNew && <NewDot color={accentColor} />}
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
      </div>
    )
  }

  // ── USER ADDED BOOK ────────────────────────────────────────────────────────
  if (activity_type === 'user_added_book') {
    const status = fb?.status || 'to_read'
    const statusLabel = status === 'reading' ? 'started reading' : 'wants to read'
    return (
      <div className="flex gap-3 pl-[19px] pr-4 py-4 rounded-2xl" style={cardBase}>
        <LeftStripe color={accentColor} />
        {isNew && <NewDot color={accentColor} />}
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
        <BookOpen size={16} style={{ color: accentColor, flexShrink: 0 }} />
      </div>
    )
  }

  // ── FALLBACK (unhandled types) ─────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 pl-[19px] pr-4 py-4 rounded-2xl" style={cardBase}>
      <LeftStripe color={accentColor} />
      {isNew && <NewDot color={accentColor} />}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-grove)' }}>
        <BookMarked size={16} style={{ color: 'var(--color-lit-3)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>
          {activity_type.replace(/_/g, ' ')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{formatTime(entry.created_at)}</p>
      </div>
    </div>
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
