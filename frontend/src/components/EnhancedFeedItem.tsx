'use client'

/**
 * Enhanced FeedItem Component
 * 
 * A comprehensive, reusable component for displaying feed items with:
 * - Support for all activity types (book releases, events, user activities)
 * - Follow/unfollow buttons for authors, users, and books
 * - Mobile-first responsive design
 * - Links to detail pages
 * - Time ago display
 * 
 * Activity Types Supported:
 * - book_release: New books released by followed authors
 * - author_event: Upcoming events from followed authors
 * - author_announcement: Author announcements
 * - user_added_book: Users adding books to their shelves
 * - user_finished_book: Users finishing books
 * - user_progress_update: Reading progress updates
 * - user_review: Book reviews from users
 * - user_followed_author: Users following authors
 * - friend_activity: Activities from friends
 * 
 * For React Native:
 * - Replace Link with TouchableOpacity + navigation
 * - Replace className with StyleSheet
 * - Keep the same prop interface and logic
 * - Import useFollow from shared hooks (same API)
 */

import Link from 'next/link'
import type { FeedItem, Book, Event, Author, User, UserBook } from '@book-app/shared'
import { useFollow, useAuth } from '@book-app/shared'
import { formatRelativeTime } from '../utils/format'
import Button from './Button'
import Avatar from './Avatar'

interface EnhancedFeedItemProps {
  item: FeedItem
  showFollowButtons?: boolean
}

export default function EnhancedFeedItem({ 
  item, 
  showFollowButtons = true 
}: EnhancedFeedItemProps) {
  const { user: currentUser } = useAuth()

  // Render user avatar and info for user activities
  const renderUserHeader = (user: User) => {
    const isMe = user.id === currentUser?.id
    const displayName = isMe ? 'You' : (user.display_name || user.username)

    return (
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/users/${user.id}`} className="flex-shrink-0">
          <Avatar
            src={user.avatar_url}
            name={user.display_name || user.username}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          {isMe ? (
            <span className="font-medium text-slate-900">{displayName}</span>
          ) : (
            <Link 
              href={`/users/${user.id}`}
              className="font-medium text-slate-900 hover:text-primary-600"
            >
              {displayName}
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Generic follow button component for any entity
  const FollowButtonComponent = ({ 
    type, 
    id, 
    label 
  }: { 
    type: 'Author' | 'User' | 'Book'
    id: number
    label?: string 
  }) => {
    const { isFollowing, isLoading, toggleFollow } = useFollow(type, id)

    return (
      <Button
        variant={isFollowing ? 'secondary' : 'primary'}
        size="sm"
        isLoading={isLoading}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleFollow()
        }}
        className="whitespace-nowrap"
      >
        {isFollowing ? '✓ Following' : `+ Follow${label ? ` ${label}` : ''}`}
      </Button>
    )
  }

  // Render content based on activity type
  const renderContent = () => {
    switch (item.activity_type) {
      case 'book_release': {
        const book = item.feedable as Book
        return (
          <div className="flex gap-4">
            {book.cover_image_url && (
              <Link href={`/books/${book.id}`} className="flex-shrink-0">
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-primary-600 font-medium mb-1">
                    📚 New Book Release
                  </div>
                  <Link href={`/books/${book.id}`}>
                    <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                      {book.title}
                    </h3>
                  </Link>
                  {book.author_name && book.author && (
                    <Link
                      href={`/authors/${book.author.id}`}
                      className="text-sm text-slate-600 hover:text-primary-600"
                    >
                      by {book.author_name}
                    </Link>
                  )}
                </div>
                {showFollowButtons && book.id && (
                  <FollowButtonComponent type="Book" id={book.id} />
                )}
              </div>
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
      }

      case 'author_event': {
        const event = item.feedable as Event
        const eventLink = event.external_url || `/events`
        const isExternal = !!event.external_url

        return (
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-purple-600 font-medium mb-1">
                  📅 Upcoming Event
                </div>
                <Link 
                  href={eventLink}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                >
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                    {event.title}
                  </h3>
                </Link>
                {event.author_name && event.author && (
                  <Link
                    href={`/authors/${event.author.id}`}
                    className="text-sm text-slate-600 hover:text-primary-600"
                  >
                    with {event.author_name}
                  </Link>
                )}
              </div>
              {showFollowButtons && event.author && (
                <FollowButtonComponent type="Author" id={event.author.id} />
              )}
            </div>
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
        )
      }

      case 'author_announcement': {
        const author = item.feedable as Author
        return (
          <div>
            {renderAuthorAnnouncement(author)}
          </div>
        )
      }

      case 'user_added_book': {
        const userBook = item.feedable as UserBook
        const user = item.user
        if (!user || !userBook.book) return null
        
        const isMe = user.id === currentUser?.id
        const shelfLabel = userBook.shelf === 'to_read' 
          ? (isMe ? 'want to read' : 'wants to read') 
          : `added to ${userBook.shelf}`
        
        return (
          <div>
            {renderUserHeader(user)}
            <div className="flex gap-4">
              {userBook.book.cover_image_url && (
                <Link href={`/books/${userBook.book.id}`} className="flex-shrink-0">
                  <img
                    src={userBook.book.cover_image_url}
                    alt={userBook.book.title}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      📖 {isMe ? 'You ' : ''}{shelfLabel}
                    </div>
                    <Link href={`/books/${userBook.book.id}`}>
                      <h3 className="text-base font-semibold text-slate-900 hover:text-primary-600">
                        {userBook.book.title}
                      </h3>
                    </Link>
                    {userBook.book.author_name && (
                      <div className="text-sm text-slate-600">
                        by {userBook.book.author_name}
                      </div>
                    )}
                  </div>
                  {showFollowButtons && userBook.book.id && (
                    <FollowButtonComponent type="Book" id={userBook.book.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'user_finished_book': {
        const userBook = item.feedable as UserBook
        const user = item.user
        if (!user || !userBook.book) return null
        
        const isMe = user.id === currentUser?.id
        
        return (
          <div>
            {renderUserHeader(user)}
            <div className="flex gap-4">
              {userBook.book.cover_image_url && (
                <Link href={`/books/${userBook.book.id}`} className="flex-shrink-0">
                  <img
                    src={userBook.book.cover_image_url}
                    alt={userBook.book.title}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-green-600 font-medium mb-1">
                      ✅ {isMe ? 'You finished' : 'Finished'} reading
                    </div>
                    <Link href={`/books/${userBook.book.id}`}>
                      <h3 className="text-base font-semibold text-slate-900 hover:text-primary-600">
                        {userBook.book.title}
                      </h3>
                    </Link>
                    {userBook.book.author_name && (
                      <div className="text-sm text-slate-600">
                        by {userBook.book.author_name}
                      </div>
                    )}
                    {userBook.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500 text-sm">
                          {'★'.repeat(userBook.rating)}{'☆'.repeat(5 - userBook.rating)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({userBook.rating}/5)
                        </span>
                      </div>
                    )}
                  </div>
                  {showFollowButtons && userBook.book.id && (
                    <FollowButtonComponent type="Book" id={userBook.book.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'user_progress_update': {
        const userBook = item.feedable as UserBook
        const user = item.user
        if (!user || !userBook.book) return null
        
        const isMe = user.id === currentUser?.id
        
        return (
          <div>
            {renderUserHeader(user)}
            <div className="flex gap-4">
              {userBook.book.cover_image_url && (
                <Link href={`/books/${userBook.book.id}`} className="flex-shrink-0">
                  <img
                    src={userBook.book.cover_image_url}
                    alt={userBook.book.title}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-indigo-600 font-medium mb-1">
                      📖 {isMe ? 'Your reading' : 'Reading'} progress
                    </div>
                    <Link href={`/books/${userBook.book.id}`}>
                      <h3 className="text-base font-semibold text-slate-900 hover:text-primary-600">
                        {userBook.book.title}
                      </h3>
                    </Link>
                    {userBook.book.author_name && (
                      <div className="text-sm text-slate-600">
                        by {userBook.book.author_name}
                      </div>
                    )}
                    {userBook.completion_percentage !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>{userBook.completion_percentage}% complete</span>
                          {userBook.pages_read && userBook.total_pages && (
                            <span>{userBook.pages_read} / {userBook.total_pages} pages</span>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${userBook.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {showFollowButtons && userBook.book.id && (
                    <FollowButtonComponent type="Book" id={userBook.book.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'user_review': {
        const userBook = item.feedable as UserBook
        const user = item.user
        if (!user || !userBook.book) return null
        
        const isMe = user.id === currentUser?.id
        
        return (
          <div>
            {renderUserHeader(user)}
            <div className="flex gap-4">
              {userBook.book.cover_image_url && (
                <Link href={`/books/${userBook.book.id}`} className="flex-shrink-0">
                  <img
                    src={userBook.book.cover_image_url}
                    alt={userBook.book.title}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-amber-600 font-medium mb-1">
                  ⭐ {isMe ? 'You reviewed' : 'Reviewed'}
                </div>
                <Link href={`/books/${userBook.book.id}`}>
                  <h3 className="text-base font-semibold text-slate-900 hover:text-primary-600 mb-1">
                    {userBook.book.title}
                  </h3>
                </Link>
                {userBook.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500 text-sm">
                      {'★'.repeat(userBook.rating)}{'☆'.repeat(5 - userBook.rating)}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({userBook.rating}/5)
                    </span>
                  </div>
                )}
                {userBook.review && (
                  <p className="text-sm text-slate-600 italic line-clamp-3 mt-2">
                    "{userBook.review}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      }

      case 'user_followed_author': {
        const author = item.feedable as Author
        const user = item.user
        if (!user) return null
        
        return (
          <div>
            {renderUserHeader(user)}
            <div className="flex gap-4 ml-12 sm:ml-13">
              {renderAuthorAnnouncement(author)}
            </div>
          </div>
        )
      }

      case 'follow_activity':
      case 'user_followed_user': {
        const targetUser = item.feedable as User
        const actor = item.user || (item.metadata?.actor as User)
        if (!actor || !targetUser) return null

        const isActorMe = actor.id === currentUser?.id
        const isTargetMe = targetUser.id === currentUser?.id
        const targetDisplayName = isTargetMe ? 'you' : (targetUser.display_name || targetUser.username)

        return (
          <div>
            {renderUserHeader(actor)}
            <div className="flex items-center justify-between gap-4 ml-12 sm:ml-13 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Link href={`/users/${targetUser.id}`} className="flex-shrink-0">
                  <Avatar
                    src={targetUser.avatar_url}
                    name={targetUser.display_name || targetUser.username}
                    size="md"
                    showBorder={false}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 mb-0.5">{isActorMe ? 'You started' : 'Started'} following</div>
                  {isTargetMe ? (
                    <span className="font-bold text-slate-900 truncate block">{targetDisplayName}</span>
                  ) : (
                    <Link 
                      href={`/users/${targetUser.id}`}
                      className="font-bold text-slate-900 hover:text-primary-600 truncate block"
                    >
                      {targetDisplayName}
                    </Link>
                  )}
                </div>
              </div>
              {showFollowButtons && targetUser.id && !isTargetMe && (
                <FollowButtonComponent type="User" id={targetUser.id} />
              )}
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  // Helper to render author info with follow button
  const renderAuthorAnnouncement = (author: Author) => {
    const isFollowAction = item.activity_type === 'user_followed_author'
    const isMe = item.user?.id === currentUser?.id
    
    return (
      <div className="flex gap-4">
        {author.avatar_url && (
          <Link href={`/authors/${author.id}`} className="flex-shrink-0">
            <img
              src={author.avatar_url}
              alt={author.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 mb-1">
                {isFollowAction ? (isMe ? 'You started following' : '👤 started following') : '✨ Author Announcement'}
              </div>
              <Link href={`/authors/${author.id}`}>
                <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-600 mb-1">
                  {author.name}
                </h3>
              </Link>
              {author.bio && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{author.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                {author.books_count !== undefined && (
                  <span>{author.books_count} books</span>
                )}
                {author.followers_count !== undefined && (
                  <span>{author.followers_count} followers</span>
                )}
              </div>
            </div>
            {showFollowButtons && (
              <FollowButtonComponent type="Author" id={author.id} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      {renderContent()}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {formatRelativeTime(item.created_at)}
        </div>
        {/* Placeholder for future actions like comment/like */}
        {/* <div className="flex gap-4 text-xs text-slate-500">
          <button className="hover:text-primary-600 transition-colors">
            💬 Comment
          </button>
          <button className="hover:text-red-500 transition-colors">
            ❤️ Like
          </button>
        </div> */}
      </div>
    </article>
  )
}

