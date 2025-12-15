/**
 * EventCard Component
 * 
 * Displays a single event with all relevant details:
 * - Event title and description
 * - Author name (with link)
 * - Date and time (formatted)
 * - Location or "Virtual" indicator
 * - Event type badge
 * - External link (Eventbrite, Ticketmaster, etc.)
 * 
 * Reusable in:
 * - Events index page (/events)
 * - Author profile pages (/authors/:id)
 * - Feed items (when integrated)
 * 
 * Mobile-First Design:
 * - Stacks vertically on mobile
 * - Shows essential info first
 * - Truncates long descriptions
 * 
 * Future Expandability:
 * - RSVP button (when backend supports it)
 * - "Add to Calendar" button
 * - Event reminder toggle
 * - Share button
 */

'use client'

import Link from 'next/link'
import { Event } from '@/shared/types'
import { formatDate, formatTime } from '@/utils/format'

interface EventCardProps {
  event: Event
  showAuthor?: boolean // Default: true
  compact?: boolean // Compact mode for lists
}

export const EventCard = ({ event, showAuthor = true, compact = false }: EventCardProps) => {
  const {
    id,
    title,
    description,
    event_type,
    starts_at,
    ends_at,
    location,
    is_virtual,
    venue_name,
    external_url,
    external_source,
    author,
    author_name,
  } = event

  // Format dates
  const startDate = new Date(starts_at)
  const endDate = ends_at ? new Date(ends_at) : null
  const formattedDate = formatDate(startDate)
  const formattedTime = formatTime(startDate)
  const formattedEndTime = endDate ? formatTime(endDate) : null

  // Event type badge colors
  const eventTypeBadge = getEventTypeBadge(event_type)

  // Display author name
  const displayAuthorName = author?.name || author_name || 'Unknown Author'

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700
        hover:shadow-lg transition-shadow duration-200
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Event Type Badge */}
      <div className="flex items-start justify-between mb-3">
        <span 
          className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${eventTypeBadge.color}
          `}
        >
          {eventTypeBadge.icon} {eventTypeBadge.label}
        </span>

        {/* Virtual/In-Person Indicator */}
        {is_virtual ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            🌐 Virtual
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            📍 In Person
          </span>
        )}
      </div>

      {/* Event Title */}
      <h3 className={`font-bold text-gray-900 dark:text-white mb-2 ${compact ? 'text-base' : 'text-lg'}`}>
        {title}
      </h3>

      {/* Author Name */}
      {showAuthor && author && (
        <Link 
          href={`/authors/${author.id}`}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 block"
        >
          by {displayAuthorName}
        </Link>
      )}

      {/* Date and Time */}
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <span>
          {formattedDate} at {formattedTime}
          {formattedEndTime && ` - ${formattedEndTime}`}
        </span>
      </div>

      {/* Location or Venue */}
      {(location || venue_name) && (
        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 mb-3">
          <svg 
            className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          <span>
            {venue_name && <span className="font-medium">{venue_name}</span>}
            {venue_name && location && <span> • </span>}
            {location}
          </span>
        </div>
      )}

      {/* Description */}
      {!compact && description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* External Link */}
      {external_url && (
        <a
          href={external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View on {getSourceLabel(external_source)}
          <svg 
            className="w-4 h-4 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
            />
          </svg>
        </a>
      )}

      {/* Future: RSVP Button */}
      {/* Uncomment when backend supports RSVPs */}
      {/* <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          RSVP
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Add to Calendar
        </button>
      </div> */}
    </div>
  )
}

/**
 * Helper: Get event type badge config
 */
function getEventTypeBadge(eventType: string) {
  const badges: Record<string, { label: string; color: string; icon: string }> = {
    book_release: {
      label: 'Book Release',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: '📚',
    },
    signing: {
      label: 'Book Signing',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: '✍️',
    },
    reading: {
      label: 'Reading',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: '📖',
    },
    interview: {
      label: 'Interview',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      icon: '🎙️',
    },
    tour: {
      label: 'Book Tour',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      icon: '🚌',
    },
    virtual_event: {
      label: 'Virtual Event',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      icon: '💻',
    },
    author_announcement: {
      label: 'Announcement',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      icon: '📢',
    },
  }

  return badges[eventType] || {
    label: 'Event',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: '📅',
  }
}

/**
 * Helper: Get external source label
 */
function getSourceLabel(source?: string): string {
  const labels: Record<string, string> = {
    eventbrite: 'Eventbrite',
    ticketmaster: 'Ticketmaster',
    manual: 'Event Page',
    other: 'Event Page',
  }

  return labels[source || 'other'] || 'Event Page'
}

export default EventCard
