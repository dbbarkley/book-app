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
import { useAuth } from '@book-app/shared'
import { UserCircle, BookOpen, Calendar, Star, CheckCircle2, UserPlus } from 'lucide-react'
import Avatar from './Avatar'

interface FeedItemProps {
  item: FeedItem
}

const formatContext = (item: FeedItem, defaultText: string) => {
  return item.metadata?.reason || item.metadata?.context || defaultText
}

const UserAvatar = ({ user, size = "md" }: { user?: User, size?: "sm" | "md" }) => {
  if (!user) return <div className={`${size === "sm" ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-slate-100 flex items-center justify-center text-slate-400`}><UserCircle size={size === "sm" ? 16 : 20} /></div>

  return (
    <Link href={`/users/${user.id}`} className="flex-shrink-0">
      <Avatar 
        src={user.avatar_url} 
        name={user.display_name || user.username} 
        size={size} 
      />
    </Link>
  )
}

const BookRecommendation = (item: FeedItem) => {
  const book = item.feedable as Book
  if (!book) return null
  const reason = formatContext(item, 'Recommended based on your reading history.')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {book.cover_image_url && (
          <Link href={`/books/${book.id}`} className="flex-shrink-0 group">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl border border-border-default shadow-sm group-hover:shadow-md transition-shadow"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-indigo mb-2">
            <Star size={14} className="fill-current" />
            <span>Book Recommendation</span>
          </div>
          <Link href={`/books/${book.id}`}>
            <h3 className="text-xl font-bold text-text-primary hover:text-brand-indigo mb-1 leading-tight">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-text-secondary mb-2">
            {book.author_name || book.author?.name || 'Unknown author'}
          </p>
          <p className="text-sm text-text-muted italic leading-relaxed line-clamp-2">"{reason}"</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <Link
          href={`/books/${book.id}`}
          className="text-sm font-bold text-brand-indigo hover:underline"
        >
          View Book details →
        </Link>
        {item.metadata?.score && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter">
            Match Score: {Math.round(item.metadata.score * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}

const EventRecommendation = (item: FeedItem) => {
  const event = item.feedable as Event
  if (!event) return null
  const reason = formatContext(item, 'Event that matches your tastes.')

  const eventLink = event.external_url || `/events/${event.id}`
  const isExternal = !!event.external_url

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
        <Calendar size={14} />
        <span>Event for you</span>
      </div>
      <div>
        <Link 
          href={eventLink}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          <h3 className="text-xl font-bold text-text-primary hover:text-brand-indigo mb-1">
            {event.title}
          </h3>
        </Link>
        <p className="text-sm font-medium text-text-secondary mb-2">
          {event.author_name || event.author?.name}
        </p>
        <p className="text-sm text-text-muted mb-4">{reason}</p>
        
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="text-base">📅</span>
            <span>
              {new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
              {new Date(event.starts_at).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-base">📍</span>
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.is_virtual && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-base">🌐</span>
              <span>Online Event</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Link
          href={eventLink}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="inline-flex items-center justify-center rounded-xl bg-brand-indigo px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-indigo-dark shadow-sm"
        >
          {isExternal ? 'Get Tickets' : 'View Event'}
        </Link>
      </div>
    </div>
  )
}

const FollowActivity = (item: FeedItem, currentUser: User | null) => {
  const actor = (item.user || item.metadata?.actor) as User | undefined
  const feedable = item.feedable as any
  const isAuthor = 
    item.activity_type === 'user_followed_author' || 
    feedable?.type === 'Author' || 
    !!item.metadata?.target_author
  
  const isActorMe = actor?.id === currentUser?.id
  const actorDisplay = isActorMe ? 'You' : (actor?.display_name || actor?.username || 'Someone')
  
  const targetId = feedable?.id || item.metadata?.target_author?.id || item.metadata?.target_user?.id
  const isTargetMe = !isAuthor && targetId === currentUser?.id
  
  const targetDisplay = isTargetMe 
    ? 'you'
    : isAuthor 
      ? (feedable?.name || item.metadata?.target_author?.name || 'an author')
      : (feedable?.display_name || feedable?.username || item.metadata?.target_user?.display_name || item.metadata?.target_user?.username || 'someone')

  const targetPath = isAuthor ? `/authors/${targetId}` : `/users/${targetId}`

  return (
    <div className="flex items-start gap-4">
      <UserAvatar user={actor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          <UserPlus size={14} />
          <span>New Connection</span>
        </div>
        <h3 className="text-base font-medium text-text-primary leading-snug">
          <span className="font-bold">
            {actor && !isActorMe ? (
              <Link href={`/users/${actor.id}`} className="hover:text-brand-indigo">{actorDisplay}</Link>
            ) : (
              actorDisplay
            )}
          </span>
          {' '}{isActorMe ? 'are' : 'is'} now following{' '}
          <span className="font-bold text-brand-indigo">
            {targetId && !isTargetMe ? (
              <Link href={targetPath} className="hover:underline">{targetDisplay}</Link>
            ) : (
              targetDisplay
            )}
          </span>
        </h3>
        
        {targetId && !isTargetMe && (
          <div className="mt-3">
            <Link
              href={targetPath}
              className="inline-flex items-center justify-center rounded-xl border border-border-default bg-white px-4 py-1.5 text-xs font-bold text-text-secondary transition hover:border-brand-indigo hover:text-brand-indigo shadow-sm"
            >
              View {isAuthor ? 'Author' : 'Profile'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const UserBookActivity = (item: FeedItem, currentUser: User | null) => {
  const actor = (item.user || item.metadata?.actor) as User | undefined
  const userBook = item.feedable as UserBook | undefined
  const book = userBook?.book
  if (!book) return null

  const isActorMe = actor?.id === currentUser?.id
  const actorDisplay = isActorMe ? 'You' : (actor?.display_name || actor?.username || 'Someone')
  
  const isFinished = item.activity_type === 'user_finished_book'
  const targetHeading = isFinished ? 'Completed Book' : 'Added to Shelf'
  const actionText = isFinished ? 'finished reading' : 'wants to read'
  const icon = isFinished ? <CheckCircle2 size={14} /> : <BookOpen size={14} />
  const colorClass = isFinished ? "text-brand-green" : "text-blue-600"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <UserAvatar user={actor} />
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${colorClass} mb-1`}>
            {icon}
            <span>{targetHeading}</span>
          </div>
          <h3 className="text-base font-medium text-text-primary leading-snug">
            <span className="font-bold">
              {actor && !isActorMe ? (
                <Link href={`/users/${actor.id}`} className="hover:text-brand-indigo">{actorDisplay}</Link>
              ) : (
                actorDisplay
              )}
            </span>
            {' '}{isActorMe ? (isFinished ? 'finished reading' : 'want to read') : actionText}
          </h3>
        </div>
      </div>

      <div className="flex gap-4 ml-14 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
        {book.cover_image_url && (
          <Link href={`/books/${book.id}`} className="flex-shrink-0 group">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-14 h-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Link href={`/books/${book.id}`}>
            <h4 className="text-base font-bold text-text-primary hover:text-brand-indigo truncate">
              {book.title}
            </h4>
          </Link>
          <p className="text-xs text-text-secondary truncate">{book.author_name || book.author?.name}</p>
          
          <div className="mt-2">
            <Link
              href={`/books/${book.id}`}
              className="text-xs font-bold text-brand-indigo hover:underline"
            >
              See more
            </Link>
          </div>
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
      if (!event) return null
      
      const eventLink = event.external_url || `/events/${event.id}`
      const isExternal = !!event.external_url

      return (
        <div className="flex gap-4">
          <div className="flex-1">
          <div className="text-xs text-text-muted mb-1">Upcoming Event</div>
          <Link 
            href={eventLink}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
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
      )
    case 'author_announcement':
      const author = item.feedable as Author
      return author ? (
        <div className="flex gap-4">
          <Link href={`/authors/${author.id}`} className="flex-shrink-0">
            <Avatar
              src={author.avatar_url}
              name={author.name}
              size="lg"
            />
          </Link>
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
  const { user: currentUser } = useAuth()

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
      return UserBookActivity(item, currentUser)
    }
    if (
      item.activity_type === 'follow_activity' ||
      item.activity_type === 'user_followed_user' ||
      item.activity_type === 'user_followed_author'
    ) {
      return FollowActivity(item, currentUser)
    }
    return LegacyContent(item)
  }

  return (
    <article className="bg-background-card rounded-[2rem] border border-border-default p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group">
      {renderContent()}
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          {formatRelativeTime(item.created_at)}
        </span>
      </div>
    </article>
  )
}

