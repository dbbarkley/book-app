'use client'

/**
 * FeedItem Component
 * Maps directly to the backend recommendation streams:
 * - `book_recommendation` mirrors the personalized book recommendations service
 * - `event_recommendation` surfaces events from followed authors or books you already love
 * - `follow_activity` shows who followed authors/books to keep the social graph visible
 * Future ML ranking can swap the presented list without touching this renderer.
 */

import Link from 'next/link'
import { formatRelativeTime } from '../utils/format'
import type { FeedItem, Book, Event, Author, User, UserBook } from '@book-app/shared'

interface FeedItemProps {
  item: FeedItem
}

const formatContext = (item: FeedItem, defaultText: string) => {
  return item.metadata?.reason || item.metadata?.context || defaultText
}

const BookRecommendation = (item: FeedItem) => {
  const book = item.feedable as Book
  if (!book) return null
  const reason = formatContext(item, 'Recommended based on your reading history.')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {book.cover_image_url && (
          <Link href={`/books/${book.id}`} className="flex-shrink-0">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg border border-border-default shadow-sm"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-1">
            Book Recommendation
          </p>
          <Link href={`/books/${book.id}`}>
            <h3 className="text-lg font-semibold text-text-primary hover:text-brand-indigo mb-1">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-text-secondary mb-1">
            {book.author_name || book.author?.name || 'Unknown author'}
          </p>
          <p className="text-sm text-text-muted line-clamp-2">{reason}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/books/${book.id}`}
          className="inline-flex items-center justify-center rounded-full border border-border-default bg-background-muted px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:border-brand-indigo hover:text-brand-indigo"
        >
          View Book
        </Link>
        <span className="text-xs text-text-muted">
          Score: {item.metadata?.score ?? 'N/A'}
        </span>
      </div>
    </div>
  )
}

const EventRecommendation = (item: FeedItem) => {
  const event = item.feedable as Event
  if (!event) return null
  const reason = formatContext(item, 'Event that matches your tastes.')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-1">
          Event Recommendation
        </p>
        <Link href={`/events/${event.id}`}>
          <h3 className="text-lg font-semibold text-text-primary hover:text-brand-indigo mb-1">
            {event.title}
          </h3>
        </Link>
        <p className="text-sm text-text-secondary mb-1">
          {event.author_name || event.author?.name}
        </p>
        <p className="text-sm text-text-muted line-clamp-2">{reason}</p>
        <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-2">
          <span>
            📅 {new Date(event.starts_at).toLocaleDateString()} at{' '}
            {new Date(event.starts_at).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
          {event.location && <span>📍 {event.location}</span>}
          {event.is_virtual && <span>🌐 Virtual</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center justify-center rounded-full border border-border-default bg-background-muted px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:border-brand-indigo hover:text-brand-indigo"
        >
          View Event
        </Link>
        <span className="text-xs text-text-muted">
          Score: {item.metadata?.score ?? 'N/A'}
        </span>
      </div>
    </div>
  )
}

const FollowActivity = (item: FeedItem) => {
  const actor = item.metadata?.actor as User | undefined
  const targetUser = item.feedable as User | undefined
  const reason = formatContext(item, 'Follow activity')
  const actorDisplay = actor?.display_name || actor?.username || 'Someone'
  const targetDisplay = targetUser?.display_name || targetUser?.username || 'someone'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-1">
          Follow Activity
        </p>
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          {actor ? (
            <Link href={`/users/${actor.id}`}>{actorDisplay}</Link>
          ) : (
            actorDisplay
          )}{' '}
          is now following{' '}
          {targetUser ? (
            <Link href={`/users/${targetUser.id}`}>{targetDisplay}</Link>
          ) : (
            targetDisplay
          )}
        </h3>
        <p className="text-sm text-text-muted">{reason}</p>
      </div>
      {targetUser && (
        <Link
          href={`/users/${targetUser.id}`}
          className="inline-flex items-center justify-center rounded-full border border-border-default bg-background-muted px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:border-brand-indigo hover:text-brand-indigo"
        >
          View profile
        </Link>
      )}
    </div>
  )
}

const UserBookActivity = (item: FeedItem) => {
  const actor = item.metadata?.actor as User | undefined
  const userBook = item.feedable as UserBook | undefined
  const book = userBook?.book
  if (!book) return null

  const actorDisplay = actor?.display_name || actor?.username || 'Someone'
  const targetHeading = item.activity_type === 'user_finished_book' ? 'Finished Book' : 'Want to Read'
  const actionText =
    item.activity_type === 'user_finished_book' ? 'finished reading' : 'wants to read'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-1">
          {targetHeading}
        </p>
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          {actor ? (
            <Link href={`/users/${actor.id}`}>{actorDisplay}</Link>
          ) : (
            actorDisplay
          )}{' '}
          {actionText} <Link href={`/books/${book.id}`}>{book.title}</Link>
        </h3>
        <p className="text-sm text-text-muted">{book.author_name || book.author?.name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {book.cover_image_url && (
          <Link href={`/books/${book.id}`} className="flex-shrink-0">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg border border-border-default shadow-sm"
            />
          </Link>
        )}
        <div className="flex flex-wrap gap-2 items-center text-xs text-text-muted">
          <Link
            href={`/books/${book.id}`}
            className="inline-flex items-center justify-center rounded-full border border-border-default bg-background-muted px-3 py-1.5 font-semibold text-text-secondary transition hover:border-brand-indigo hover:text-brand-indigo"
          >
            View Book
          </Link>
          {userBook?.status && (
            <span className="px-2 py-1 rounded-full bg-background-muted text-xs text-text-secondary">
              Status: {userBook.status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const LegacyContent = (item: FeedItem) => {
  switch (item.activity_type) {
    case 'book_release':
      const book = item.feedable as Book
      return book ? (
        <div className="flex gap-4">
          {book.cover_image_url && (
            <Link href={`/books/${book.id}`} className="flex-shrink-0">
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md"
              />
            </Link>
          )}
          <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-1">New Book Release</div>
          <Link href={`/books/${book.id}`}>
            <h3 className="text-lg font-semibold text-text-primary hover:text-brand-indigo mb-1">
              {book.title}
            </h3>
          </Link>
          {book.author_name && (
            <Link
              href={`/authors/${book.author?.id || ''}`}
              className="text-sm text-text-secondary hover:text-brand-indigo"
            >
              by {book.author_name}
            </Link>
          )}
          {book.description && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">{book.description}</p>
          )}
          <div className="text-xs text-text-muted mt-2">
              Release: {new Date(book.release_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : null
    case 'author_event':
      const event = item.feedable as Event
      return event ? (
        <div className="flex gap-4">
          <div className="flex-1">
          <div className="text-xs text-text-muted mb-1">Upcoming Event</div>
          <Link href={`/events/${event.id}`}>
            <h3 className="text-lg font-semibold text-text-primary hover:text-brand-indigo mb-1">
              {event.title}
            </h3>
          </Link>
          {event.author_name && (
            <Link
              href={`/authors/${event.author?.id || ''}`}
              className="text-sm text-text-secondary hover:text-brand-indigo"
            >
              with {event.author_name}
            </Link>
          )}
          {event.description && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-muted">
              <span>
                📅 {new Date(event.starts_at).toLocaleDateString()} at{' '}
                {new Date(event.starts_at).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>
        </div>
      ) : null
    case 'author_announcement':
      const author = item.feedable as Author
      return author ? (
        <div className="flex gap-4">
          {author.avatar_url && (
            <Link href={`/authors/${author.id}`} className="flex-shrink-0">
              <img
                src={author.avatar_url}
                alt={author.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </Link>
          )}
          <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-1">Author Announcement</div>
          <Link href={`/authors/${author.id}`}>
            <h3 className="text-lg font-semibold text-text-primary hover:text-brand-indigo mb-1">
              {author.name}
            </h3>
          </Link>
          {author.bio && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">{author.bio}</p>
          )}
          </div>
        </div>
      ) : null
    default:
      return null
  }
}

export default function FeedItemComponent({ item }: FeedItemProps) {
  const renderContent = () => {
    if (item.activity_type === 'book_recommendation') {
      return BookRecommendation(item)
    }
    if (item.activity_type === 'event_recommendation') {
      return EventRecommendation(item)
    }
    if (
      item.activity_type === 'user_finished_book' ||
      item.activity_type === 'user_added_book'
    ) {
      return UserBookActivity(item)
    }
    if (item.activity_type === 'follow_activity') {
      return FollowActivity(item)
    }
    return LegacyContent(item)
  }

  return (
    <article className="bg-background-card rounded-2xl border border-border-default p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {renderContent()}
      <div className="mt-4 pt-4 border-t border-border-default text-xs text-text-muted">
        {formatRelativeTime(item.created_at)}
      </div>
    </article>
  )
}

