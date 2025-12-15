'use client'

// FeedItem Component - Reusable component for displaying feed items
// Supports different activity types: book_release, author_event, author_announcement

import Link from 'next/link'
import type { FeedItem, Book, Event, Author } from '@book-app/shared'
import { formatRelativeTime } from '../utils/format'

interface FeedItemProps {
  item: FeedItem
}

export default function FeedItemComponent({ item }: FeedItemProps) {
  const renderContent = () => {
    switch (item.activity_type) {
      case 'book_release':
        const book = item.feedable as Book
        return (
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
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {book.description}
                </p>
              )}
              <div className="text-xs text-slate-500 mt-2">
                Release: {new Date(book.release_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )

      case 'author_event':
        const event = item.feedable as Event
        return (
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
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {event.description}
                </p>
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
        )

      case 'author_announcement':
        const author = item.feedable as Author
        return (
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
        )

      default:
        return null
    }
  }

  return (
    <article className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      {renderContent()}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        {formatRelativeTime(item.created_at)}
      </div>
    </article>
  )
}

