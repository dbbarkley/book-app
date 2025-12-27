/**
 * EventCard Component
 * 
 * Displays a single event with modern styling:
 * - Lucide icons instead of emojis
 * - Modern typography and spacing
 * - Glassmorphism-inspired elements
 * - Dynamic color themes based on event type
 */

'use client'

import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Users, 
  BookOpen, 
  PenTool, 
  Mic2, 
  Bus, 
  Laptop, 
  Megaphone, 
  Globe,
  Share2,
  BookmarkPlus,
  ArrowUpRight
} from 'lucide-react'
import { Event } from '@/shared/types'
import { formatDate, formatTime } from '@/utils/format'

interface EventCardProps {
  event: Event
  showAuthor?: boolean
  compact?: boolean
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

  // Event type config
  const typeConfig = getEventTypeConfig(event_type)
  const Icon = typeConfig.icon

  // Display venue details
  const displayVenueName = venue?.name || venue_name
  const displayVenueCity = venue?.city

  return (
    <div className="group relative bg-background-card rounded-[2rem] border border-border-default overflow-hidden hover:shadow-2xl hover:shadow-brand-indigo/10 transition-all duration-500 flex flex-col h-full">
      {/* Visual Header / Banner */}
      <div className={`relative h-32 w-full overflow-hidden ${typeConfig.bgGradient}`}>
        {/* Abstract pattern / overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Floating Icon */}
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
          <Icon size={120} strokeWidth={1} />
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/20 text-white border border-white/30`}>
            <Icon size={12} />
            {typeConfig.label}
          </span>
          {is_virtual && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-purple-500/20 text-white border border-purple-400/30">
              <Globe size={12} />
              Virtual
            </span>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-colors">
            <Share2 size={16} />
          </button>
          <button className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-colors">
            <BookmarkPlus size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title & Author */}
        <div className="mb-4">
          <h3 className="text-xl font-black text-text-primary leading-tight mb-2 group-hover:text-brand-indigo transition-colors line-clamp-2">
            {external_url ? (
              <a href={external_url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1">
                {title}
                <ArrowUpRight size={18} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0" />
              </a>
            ) : title}
          </h3>
          
          {showAuthor && author && (
            <Link 
              href={`/authors/${author.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-indigo hover:text-brand-indigo-dark transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center">
                <Users size={12} />
              </div>
              {author.name || author_name}
            </Link>
          )}
        </div>

        {/* Event Details Grid */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-8 h-8 rounded-xl bg-background-muted flex items-center justify-center text-brand-indigo">
              <Calendar size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-text-primary">{formattedDate}</span>
              <span className="text-xs text-text-muted">{formattedTime} {formattedEndTime && ` - ${formattedEndTime}`}</span>
            </div>
          </div>

          {(!is_virtual && (displayVenueName || location)) && (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-8 h-8 rounded-xl bg-background-muted flex items-center justify-center text-brand-indigo">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-text-primary truncate">{displayVenueName || 'Location'}</span>
                <span className="text-xs text-text-muted truncate">
                  {displayVenueCity ? `${displayVenueCity}${location ? ` • ${location}` : ''}` : location}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {!compact && description && (
          <p className="text-sm text-text-secondary mb-6 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Footer Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-default/50">
          {audience_type && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <Users size={12} />
              {audience_type.replace('_', ' ')}
            </span>
          )}
          
          {external_url && (
            <a
              href={external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-indigo hover:gap-3 transition-all"
            >
              Get Tickets
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Helper: Modern Type Configuration
 */
function getEventTypeConfig(eventType: string) {
  const configs: Record<string, { label: string; icon: any; bgGradient: string }> = {
    book_release: {
      label: 'New Release',
      icon: BookOpen,
      bgGradient: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    },
    signing: {
      label: 'Signing',
      icon: PenTool,
      bgGradient: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    },
    reading: {
      label: 'Live Reading',
      icon: BookOpen,
      bgGradient: 'bg-gradient-to-br from-amber-400 to-orange-600',
    },
    storytime: {
      label: 'Storytime',
      icon: Users,
      bgGradient: 'bg-gradient-to-br from-pink-400 to-rose-600',
    },
    interview: {
      label: 'Interview',
      icon: Mic2,
      bgGradient: 'bg-gradient-to-br from-purple-400 to-fuchsia-600',
    },
    tour: {
      label: 'Book Tour',
      icon: Bus,
      bgGradient: 'bg-gradient-to-br from-sky-400 to-blue-600',
    },
    virtual_event: {
      label: 'Virtual',
      icon: Laptop,
      bgGradient: 'bg-gradient-to-br from-indigo-400 to-violet-600',
    },
    author_announcement: {
      label: 'Announcement',
      icon: Megaphone,
      bgGradient: 'bg-gradient-to-br from-orange-400 to-red-600',
    },
  }

  return configs[eventType] || {
    label: 'Special Event',
    icon: Calendar,
    bgGradient: 'bg-gradient-to-br from-slate-400 to-slate-600',
  }
}

export default EventCard
