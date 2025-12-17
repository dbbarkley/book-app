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
import type { FeedItem, Book, Event, Author } from '@book-app/shared'

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
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg border border-slate-100 shadow-sm"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            Book Recommendation
          </p>
          <Link href={`/books/${book.id}`}>
            <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-slate-600 mb-1">
            {book.author_name || book.author?.name || 'Unknown author'}
          </p>
          <p className="text-sm text-slate-500 line-clamp-2">{reason}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/books/${book.id}`}
          className="btn btn-primary px-3 py-1.5 text-sm rounded-full"
        >
          View Book
        </Link>
        <span className="text-xs text-slate-400">
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
          Event Recommendation
        </p>
        <Link href={`/events/${event.id}`}>
          <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
            {event.title}
          </h3>
        </Link>
        <p className="text-sm text-slate-600 mb-1">
          {event.author_name || event.author?.name}
        </p>
        <p className="text-sm text-slate-500 line-clamp-2">{reason}</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
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
          className="btn btn-secondary px-3 py-1.5 text-sm rounded-full"
        >
          View Event
        </Link>
        <span className="text-xs text-slate-400">
          Score: {item.metadata?.score ?? 'N/A'}
        </span>
      </div>
    </div>
  )
}

const FollowActivity = (item: FeedItem) => {
  const targetAuthor = item.metadata?.author as Author
  const reason = formatContext(item, 'Followed author activity')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
          Follow Activity
        </p>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {item.user?.display_name || item.user?.username} is following {targetAuthor?.name || 'an author'}
        </h3>
        <p className="text-sm text-slate-500">{reason}</p>
      </div>
      {targetAuthor && (
        <Link
          href={`/authors/${targetAuthor.id}`}
          className="btn btn-outline px-3 py-1.5 text-sm rounded-full"
        >
          View Author
        </Link>
      )}
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
            <div className="text-xs text-slate-500 mb-1">New Book Release</div>
            <Link href={`/books/${book.id}`}>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                {book.title}
              </h3>
            </Link>
            {book.author_name && (
              <Link
                href={`/authors/${book.author?.id || ''}`}
                className="text-sm text-slate-600 hover:text-primary-600"
              >
                by {book.author_name}
              </Link>
            )}
            {book.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{book.description}</p>
            )}
            <div className="text-xs text-slate-500 mt-2">
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
            <div className="text-xs text-slate-500 mb-1">Upcoming Event</div>
            <Link href={`/events/${event.id}`}>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                {event.title}
              </h3>
            </Link>
            {event.author_name && (
              <Link
                href={`/authors/${event.author?.id || ''}`}
                className="text-sm text-slate-600 hover:text-primary-600"
              >
                with {event.author_name}
              </Link>
            )}
            {event.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
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
            <div className="text-xs text-slate-500 mb-1">Author Announcement</div>
            <Link href={`/authors/${author.id}`}>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                {author.name}
              </h3>
            </Link>
            {author.bio && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{author.bio}</p>
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
    if (item.activity_type === 'follow_activity') {
      return FollowActivity(item)
    }
    return LegacyContent(item)
  }

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {renderContent()}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        {formatRelativeTime(item.created_at)}
      </div>
    </article>
  )
}

