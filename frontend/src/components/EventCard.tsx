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
    venue,
    venue_name,
    external_url,
    external_source,
    image_url,
    audience_type,
    author,
    author_name,
  } = event

  // Format dates
  const startDate = new Date(starts_at)
  const endDate = ends_at ? new Date(ends_at) : null
  const formattedDate = formatDate(startDate)
  const formattedTime = formatTime(startDate)
  const formattedEndTime = endDate ? formatTime(endDate) : null

  // Event type badge config
  const eventTypeConfig = getEventTypeBadge(event_type)

  // Audience badge config
  const audienceConfig = getAudienceBadge(audience_type)

  // Display author name
  const displayAuthorName = author?.name || author_name || 'Unknown Author'

  // Venue details
  const displayVenueName = venue?.name || venue_name
  const displayVenueCity = venue?.city
  const displayVenueLocation = displayVenueCity 
    ? `${displayVenueName}${displayVenueCity ? ` • ${displayVenueCity}` : ''}`
    : displayVenueName

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700
        hover:shadow-lg transition-shadow duration-200 overflow-hidden
      `}
    >
      {/* Event Banner Style Background */}
      {external_url ? (
        <a 
          href={external_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`h-24 w-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ${eventTypeConfig.bgGradient}`}
        >
          <span className="text-4xl">{eventTypeConfig.icon}</span>
        </a>
      ) : (
        <div className={`h-24 w-full flex items-center justify-center ${eventTypeConfig.bgGradient}`}>
          <span className="text-4xl">{eventTypeConfig.icon}</span>
        </div>
      )}

      <div className="p-6">
        {/* Badges Container */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span 
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${eventTypeConfig.color}
            `}
          >
            {eventTypeConfig.label}
          </span>

          {audienceConfig && (
            <span 
              className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${audienceConfig.color}
              `}
            >
              {audienceConfig.label}
            </span>
          )}

          {is_virtual && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              🌐 Virtual
            </span>
          )}
        </div>

        {/* Event Title */}
        {external_url ? (
          <a 
            href={external_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
          </a>
        ) : (
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg leading-tight">
            {title}
          </h3>
        )}

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
      {(!is_virtual && (displayVenueName || location)) && (
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
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {displayVenueLocation}
            </span>
            {location && location !== displayVenueName && (
              <span className="text-xs text-gray-500">{location}</span>
            )}
            {venue?.venue_type && (
              <span className="text-xs text-indigo-500 capitalize">{venue.venue_type}</span>
            )}
          </div>
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
    </div>
  )
}

/**
 * Helper: Get event type badge config
 */
function getEventTypeBadge(eventType: string) {
  const config: Record<string, { label: string; color: string; icon: string; bgGradient: string }> = {
    book_release: {
      label: 'Book Release',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: '📚',
      bgGradient: 'bg-gradient-to-br from-green-400 to-emerald-500',
    },
    signing: {
      label: 'Book Signing',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: '✍️',
      bgGradient: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    },
    reading: {
      label: 'Reading',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      icon: '📖',
      bgGradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
    },
    storytime: {
      label: 'Storytime',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      icon: '🧸',
      bgGradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    },
    interview: {
      label: 'Interview',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      icon: '🎙️',
      bgGradient: 'bg-gradient-to-br from-purple-400 to-fuchsia-500',
    },
    tour: {
      label: 'Book Tour',
      color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
      icon: '🚌',
      bgGradient: 'bg-gradient-to-br from-sky-400 to-blue-500',
    },
    virtual_event: {
      label: 'Virtual Event',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      icon: '💻',
      bgGradient: 'bg-gradient-to-br from-indigo-400 to-violet-500',
    },
    author_announcement: {
      label: 'Announcement',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      icon: '📢',
      bgGradient: 'bg-gradient-to-br from-orange-400 to-red-500',
    },
  }

  return config[eventType] || {
    label: 'Event',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: '📅',
    bgGradient: 'bg-gradient-to-br from-gray-400 to-slate-500',
  }
}

/**
 * Helper: Get audience badge config
 */
function getAudienceBadge(audienceType?: string) {
  if (!audienceType) return null

  const configs: Record<string, { label: string; color: string }> = {
    kids: {
      label: 'Kids',
      color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    },
    young_adult: {
      label: 'Young Adult',
      color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    },
    adult: {
      label: 'Adult',
      color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    },
  }

  return configs[audienceType] || null
}

/**
 * Helper: Get external source label
 */
function getSourceLabel(source?: string): string {
  const labels: Record<string, string> = {
    eventbrite: 'Eventbrite',
    ticketmaster: 'Ticketmaster',
    venue_site: 'Venue Website',
    manual: 'Event Page',
    other: 'Event Page',
  }

  return labels[source || 'other'] || 'Event Page'
}

export default EventCard
