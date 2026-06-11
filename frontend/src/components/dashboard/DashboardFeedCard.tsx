'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Plus, Star, BookOpen, UserPlus } from 'lucide-react'
import type { FeedEntry } from '@book-app/shared'
import { useBooksStore } from '@book-app/shared/store/booksStore'
import { BookCoverImage } from '../BookCoverImage'

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'var(--color-accent)',
  'var(--color-accent-teal)',
  '#5B7FA6',
  '#5A9B72',
  '#8B6CC7',
]

function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function formatTimeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}H AGO`
  const days = Math.floor(hrs / 24)
  return `${days}D AGO`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LetterAvatar({ name }: { name: string }) {
  const initial = (name?.[0] ?? '?').toUpperCase()
  return (
    <span
      className="flex items-center justify-center flex-shrink-0 font-bold text-[15px]"
      style={{
        width: 38, height: 38, borderRadius: '50%',
        backgroundColor: avatarColor(name),
        color: '#fff',
        border: '2px solid var(--color-ink)',
      }}
    >
      {initial}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          fill={i < full || (i === full && half) ? 'var(--color-accent)' : 'none'}
          style={{
            color: 'var(--color-accent)',
            opacity: i >= full && !(i === full && half) ? 0.25 : 1,
          }}
        />
      ))}
    </div>
  )
}

function FinishedBadge() {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 inline-block"
      style={{
        backgroundColor: '#2D6A4F',
        color: '#fff',
        borderRadius: 6,
        border: '2px solid var(--color-ink)',
        transform: 'rotate(-2deg)',
      }}
    >
      Finished
    </span>
  )
}

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 16,
        padding: '20px',
      }}
    >
      {children}
    </div>
  )
}

function ActionRow({
  bookId,
  bookData,
}: {
  bookId?: number | null
  bookData?: any
}) {
  const [cheered, setCheered] = useState(false)
  const [adding, setAdding]   = useState(false)
  const { addToShelf, userBooks } = useBooksStore()

  const alreadyHave = bookId != null && userBooks[bookId] != null

  async function handleAdd() {
    if (!bookId || !bookData || adding) return
    setAdding(true)
    try { await addToShelf(bookId, 'to_read', bookData) }
    finally { setAdding(false) }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-4">
      <button
        onClick={() => setCheered(p => !p)}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
        style={{
          border: '2px solid var(--color-ink)',
          borderRadius: 999,
          padding: '7px 14px',
          color: cheered ? 'var(--color-accent)' : 'var(--color-ink)',
          backgroundColor: 'transparent',
        }}
      >
        <Heart size={11} fill={cheered ? 'var(--color-accent)' : 'none'} strokeWidth={2.5} />
        Cheer
      </button>

      <button
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
        style={{
          border: '2px solid var(--color-ink)',
          borderRadius: 999,
          padding: '7px 14px',
          color: 'var(--color-ink)',
          backgroundColor: 'transparent',
        }}
      >
        <MessageCircle size={11} strokeWidth={2.5} />
        Reply
      </button>

      {!alreadyHave && bookId != null && (
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)',
            borderRadius: 999,
            padding: '7px 14px',
          }}
        >
          <Plus size={11} strokeWidth={3} />
          {adding ? 'Adding…' : 'Add to To-Read'}
        </button>
      )}
    </div>
  )
}

// ── Card variants ──────────────────────────────────────────────────────────────

function FinishedCard({ entry }: { entry: FeedEntry }) {
  const actor     = entry.metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : '#'

  const fb     = entry.feedable as any
  const book   = fb?.book || entry.metadata?.book
  const bookHref = book?.google_books_id
    ? `/books/${book.google_books_id}`
    : book?.id ? `/books/${book.id}` : '#'

  const rating   = entry.metadata?.rating   ?? fb?.rating
  const review   = entry.metadata?.review   ?? fb?.review
  const isFinish = entry.activity_type === 'user_finished_book'

  return (
    <CardWrapper>
      {/* Actor headline */}
      <div className="flex items-center gap-3 mb-3">
        <LetterAvatar name={actorName} />
        <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
          <Link href={actorHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {actorName}
          </Link>
          {' '}{isFinish ? 'finished' : 'reviewed'}{' '}
          {book && (
            <Link href={bookHref}>
              <strong style={{ color: 'var(--color-ink)' }}>{book.title}</strong>
            </Link>
          )}
          {'  '}
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
            · {formatTimeShort(entry.created_at)}
          </span>
        </p>
      </div>

      {/* Indented content — aligned under the name, not the avatar */}
      <div style={{ paddingLeft: 50 }}>
        {/* Book cover + info */}
        {book && (
          <div className="flex gap-4 mb-4">
            <Link href={bookHref} className="flex-shrink-0" style={{ transform: 'rotate(-4deg)', marginTop: 4 }}>
              <div
                style={{
                  width: 64,
                  aspectRatio: '2/3',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '3px 5px 14px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="small"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0 pt-1">
              {book.author_name && (
                <p className="text-[13px] mb-2.5" style={{ color: 'var(--color-ink-3)' }}>
                  {book.author_name}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {rating != null && <StarRating rating={rating} />}
                {isFinish && <FinishedBadge />}
              </div>
            </div>
          </div>
        )}

        {/* Review quote */}
        {review && (
          <div
            className="px-4 py-3 text-[13px] italic leading-relaxed mb-4"
            style={{
              border: '1.5px dashed var(--color-rim)',
              borderRadius: 8,
              color: 'var(--color-ink-2)',
            }}
          >
            &ldquo;{review}&rdquo;
          </div>
        )}

        <ActionRow bookId={book?.id} bookData={book} />
      </div>
    </CardWrapper>
  )
}

function AddedBookCard({ entry }: { entry: FeedEntry }) {
  const actor     = entry.metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : '#'

  const fb   = entry.feedable as any
  const book = fb?.book || entry.metadata?.book
  const bookHref = book?.google_books_id
    ? `/books/${book.google_books_id}`
    : book?.id ? `/books/${book.id}` : '#'

  const status = fb?.status || 'to_read'
  const actionLabel = status === 'reading' ? 'started reading' : 'added to their shelf'

  return (
    <CardWrapper>
      <div className="flex items-center gap-3 mb-3">
        <LetterAvatar name={actorName} />
        <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
          <Link href={actorHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {actorName}
          </Link>
          {' '}{actionLabel}{' '}
          {book && (
            <Link href={bookHref}>
              <strong style={{ color: 'var(--color-ink)' }}>{book.title}</strong>
            </Link>
          )}
          {'  '}
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
            · {formatTimeShort(entry.created_at)}
          </span>
        </p>
      </div>

      <div style={{ paddingLeft: 50 }}>
        {book && (
          <div className="flex gap-4 mb-4">
            <Link href={bookHref} className="flex-shrink-0" style={{ transform: 'rotate(-3deg)', marginTop: 4 }}>
              <div
                style={{
                  width: 52,
                  aspectRatio: '2/3',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '3px 5px 12px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="small"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0 pt-1">
              <p className="font-serif font-bold leading-snug text-[15px] mb-0.5" style={{ color: 'var(--color-ink)' }}>
                {book.title}
              </p>
              {book.author_name && (
                <p className="text-[12px]" style={{ color: 'var(--color-ink-3)' }}>{book.author_name}</p>
              )}
            </div>
          </div>
        )}

        <ActionRow bookId={book?.id} bookData={book} />
      </div>
    </CardWrapper>
  )
}

function ProgressCard({ entry }: { entry: FeedEntry }) {
  const actor     = entry.metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : '#'

  const fb   = entry.feedable as any
  const book = fb?.book || entry.metadata?.book
  const bookHref = book?.google_books_id
    ? `/books/${book.google_books_id}`
    : book?.id ? `/books/${book.id}` : '#'

  const pct  = entry.metadata?.completion_percentage ?? fb?.completion_percentage ?? 0

  return (
    <CardWrapper>
      <div className="flex items-center gap-3 mb-3">
        <LetterAvatar name={actorName} />
        <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
          <Link href={actorHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {actorName}
          </Link>
          {' '}is{' '}
          <strong style={{ color: 'var(--color-ink)' }}>{pct}%</strong>
          {' '}through{' '}
          {book && (
            <Link href={bookHref}>
              <strong style={{ color: 'var(--color-ink)' }}>{book.title}</strong>
            </Link>
          )}
          {'  '}
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
            · {formatTimeShort(entry.created_at)}
          </span>
        </p>
      </div>

      <div style={{ paddingLeft: 50 }}>
        {/* Progress bar */}
        <div
          className="mb-1"
          style={{ height: 4, borderRadius: 999, backgroundColor: 'var(--color-cave)', overflow: 'hidden' }}
        >
          <div
            style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: 999 }}
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4" style={{ color: 'var(--color-ink-3)' }}>
          {pct}% complete
        </p>

        <ActionRow bookId={book?.id} bookData={book} />
      </div>
    </CardWrapper>
  )
}

function HighlightCard({ entry }: { entry: FeedEntry }) {
  const actor     = entry.metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : '#'

  const fb   = entry.feedable as any
  const book = fb?.book || entry.metadata?.book
  const bookHref = book?.google_books_id
    ? `/books/${book.google_books_id}`
    : book?.id ? `/books/${book.id}` : '#'

  const highlightedText = entry.metadata?.highlighted_text || entry.metadata?.highlight?.highlighted_text
  const pageNumber      = entry.metadata?.page_number      || entry.metadata?.highlight?.page_number

  return (
    <CardWrapper>
      {/* Actor headline */}
      <div className="flex items-center gap-3 mb-3">
        <LetterAvatar name={actorName} />
        <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
          <Link href={actorHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {actorName}
          </Link>
          {' '}highlighted a passage in{' '}
          {book && (
            <Link href={bookHref}>
              <strong style={{ color: 'var(--color-ink)', fontStyle: 'italic' }}>{book.title}</strong>
            </Link>
          )}
          {'  '}
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
            · {formatTimeShort(entry.created_at)}
          </span>
        </p>
      </div>

      <div style={{ paddingLeft: 50 }}>
        {/* Cover + author */}
        {book && (
          <div className="flex gap-4 mb-3">
            <Link href={bookHref} className="flex-shrink-0" style={{ transform: 'rotate(-4deg)', marginTop: 4 }}>
              <div
                style={{
                  width: 64,
                  aspectRatio: '2/3',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '3px 5px 14px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="small"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0 pt-1">
              {book.author_name && (
                <p className="text-[13px] mb-3" style={{ color: 'var(--color-ink-3)' }}>
                  {book.author_name}
                </p>
              )}

              {/* HIGHLIGHT · P. N badge */}
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
                style={{
                  backgroundColor: 'var(--color-ink)',
                  color: 'var(--color-accent-yellow)',
                  borderRadius: 6,
                  padding: '4px 10px',
                }}
              >
                Highlight{pageNumber != null ? ` · P. ${pageNumber}` : ''}
              </span>

              {/* Yellow highlight box */}
              {highlightedText && (
                <div
                  className="px-4 py-3 text-[13px] italic leading-relaxed"
                  style={{
                    backgroundColor: 'rgba(241,199,91,0.22)',
                    border: '1.5px solid rgba(241,199,91,0.5)',
                    borderRadius: 8,
                    color: 'var(--color-ink-2)',
                  }}
                >
                  &ldquo;{highlightedText}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        <ActionRow bookId={book?.id} bookData={book} />
      </div>
    </CardWrapper>
  )
}

function SuggestionCard({ entry }: { entry: FeedEntry }) {
  const suggester     = entry.metadata?.suggester || entry.metadata?.actor
  const suggesterName = suggester?.display_name || suggester?.username || 'Someone'
  const suggesterHref = suggester?.id ? `/users/${suggester.id}` : '#'

  const book     = entry.metadata?.book
  const bookHref = book?.google_books_id
    ? `/books/${book.google_books_id}`
    : book?.id ? `/books/${book.id}` : '#'

  const message = entry.metadata?.message

  return (
    <CardWrapper>
      <div className="flex items-center gap-3 mb-3">
        <LetterAvatar name={suggesterName} />
        <p className="text-[14px] leading-snug" style={{ color: 'var(--color-ink-2)' }}>
          <Link href={suggesterHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {suggesterName}
          </Link>
          {' '}suggested{' '}
          {book && (
            <Link href={bookHref}>
              <strong style={{ color: 'var(--color-ink)', fontStyle: 'italic' }}>{book.title}</strong>
            </Link>
          )}{' '}
          to{' '}
          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>you</span>
          {'  '}
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-ink-3)' }}>
            · {formatTimeShort(entry.created_at)}
          </span>
        </p>
      </div>

      <div style={{ paddingLeft: 50 }}>
        {book && (
          <div className="flex gap-4 mb-4">
            <Link href={bookHref} className="flex-shrink-0" style={{ transform: 'rotate(-3deg)', marginTop: 4 }}>
              <div
                style={{
                  width: 64,
                  aspectRatio: '2/3',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '3px 5px 14px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <BookCoverImage
                  src={book.cover_image_url}
                  title={book.title}
                  author={book.author_name}
                  size="small"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0 pt-1">
              {book.author_name && (
                <p className="text-[13px] mb-3" style={{ color: 'var(--color-ink-3)' }}>{book.author_name}</p>
              )}
              {message && (
                <div
                  className="px-4 py-3 text-[13px] italic leading-relaxed"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: 8,
                    color: '#FAF6EB',
                  }}
                >
                  &ldquo;{message}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        <ActionRow bookId={book?.id} bookData={book} />
      </div>
    </CardWrapper>
  )
}

function SocialCard({ entry }: { entry: FeedEntry }) {
  const actor     = entry.metadata?.actor || entry.metadata?.user
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const actorHref = actor?.id ? `/users/${actor.id}` : '#'

  const actionText =
    entry.activity_type === 'friend_request'   ? 'sent you a friend request' :
    entry.activity_type === 'friend_accepted'  ? 'accepted your friend request' :
    entry.activity_type === 'user_followed_user' ? 'is now following you' :
    entry.activity_type.replace(/_/g, ' ')

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-rim)',
        borderRadius: 12,
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'var(--color-accent-subtle)',
          border: '1.5px solid var(--color-rim-accent)',
        }}
      >
        <UserPlus size={14} style={{ color: 'var(--color-accent)' }} />
      </div>
      <p className="flex-1 text-[13px]" style={{ color: 'var(--color-ink-2)' }}>
        <Link href={actorHref} className="font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
          {actorName}
        </Link>
        {' '}{actionText}
      </p>
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] flex-shrink-0" style={{ color: 'var(--color-ink-3)' }}>
        {formatTimeShort(entry.created_at)}
      </span>
    </div>
  )
}

// ── Router ─────────────────────────────────────────────────────────────────────

export default function DashboardFeedCard({ entry }: { entry: FeedEntry }) {
  const { activity_type } = entry

  if (activity_type === 'user_finished_book' || activity_type === 'user_review') {
    return <FinishedCard entry={entry} />
  }
  if (activity_type === 'user_added_book') {
    return <AddedBookCard entry={entry} />
  }
  if (activity_type === 'user_progress_update') {
    const hasHighlight = !!(
      entry.metadata?.highlighted_text ||
      entry.metadata?.highlight?.highlighted_text
    )
    return hasHighlight ? <HighlightCard entry={entry} /> : <ProgressCard entry={entry} />
  }
  if (activity_type === 'book_suggestion') {
    return <SuggestionCard entry={entry} />
  }
  if (
    activity_type === 'friend_request' ||
    activity_type === 'friend_accepted' ||
    activity_type === 'user_followed_user' ||
    activity_type === 'user_followed_author'
  ) {
    return <SocialCard entry={entry} />
  }

  // Generic fallback
  const actor     = entry.metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  return (
    <CardWrapper>
      <div className="flex items-center gap-3">
        <LetterAvatar name={actorName} />
        <div>
          <p className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>{actorName}</p>
          <p className="text-[12px]" style={{ color: 'var(--color-ink-3)' }}>
            {activity_type.replace(/_/g, ' ')} · {formatTimeShort(entry.created_at)}
          </p>
        </div>
      </div>
    </CardWrapper>
  )
}

export function isSuggestion(t: string) { return t === 'book_suggestion' }
export function isReview(t: string)     { return t === 'user_review' || t === 'user_finished_book' }
export function isHighlight(e: { activity_type: string; metadata?: Record<string, any> }) {
  if (e.activity_type !== 'user_progress_update') return false
  return !!(e.metadata?.highlighted_text || e.metadata?.highlight?.highlighted_text)
}
