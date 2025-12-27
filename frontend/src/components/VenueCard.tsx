'use client'

import { Venue } from '@book-app/shared'
import { MapPin, Globe, BookOpen, Library, Building2, Map as MapIcon, ArrowUpRight } from 'lucide-react'

interface VenueCardProps {
  venue: Venue
}

const venueTypeIcons: Record<string, any> = {
  bookstore: BookOpen,
  library: Library,
  theater: Building2,
  university: Building2,
  other: MapIcon,
}

const venueTypeLabels: Record<string, string> = {
  bookstore: 'Bookstore',
  library: 'Library',
  theater: 'Theater',
  university: 'University',
  other: 'Venue',
}

export default function VenueCard({ venue }: VenueCardProps) {
  const Icon = venueTypeIcons[venue.venue_type] || MapIcon
  const typeLabel = venueTypeLabels[venue.venue_type] || 'Venue'

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venue.name} ${venue.address || ''} ${venue.city || ''} ${venue.state || ''} ${venue.zipcode || ''}`
  )}`

  return (
    <div className="group bg-background-card rounded-[2rem] border border-border-default overflow-hidden hover:shadow-2xl hover:shadow-brand-indigo/10 transition-all duration-500 flex flex-col h-full">
      <div className="p-6 flex flex-col h-full">
        {/* Header with Type Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <Icon size={24} />
          </div>
          <span className="px-4 py-1.5 rounded-full bg-background-muted text-text-secondary text-[10px] font-black uppercase tracking-widest border border-border-default group-hover:border-brand-indigo/30 transition-colors">
            {typeLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-2xl font-black text-text-primary mb-3 line-clamp-1 group-hover:text-brand-indigo transition-colors">
            {venue.name}
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start text-sm text-text-secondary">
              <div className="w-8 h-8 rounded-xl bg-background-muted flex-shrink-0 flex items-center justify-center text-text-muted mr-3">
                <MapPin size={16} />
              </div>
              <span className="mt-1 font-medium">
                {venue.address && `${venue.address}, `}
                {venue.city}, {venue.state} {venue.zipcode}
              </span>
            </div>
            
            {venue.website_url && (
              <a 
                href={venue.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-sm font-bold text-brand-indigo hover:text-brand-indigo-dark transition-all group/link"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/5 flex-shrink-0 flex items-center justify-center mr-3 group-hover/link:bg-brand-indigo/10 transition-colors">
                  <Globe size={16} />
                </div>
                <span className="border-b-2 border-transparent group-hover/link:border-brand-indigo/30 transition-all">
                  Visit Website
                </span>
                <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover/link:opacity-100 transition-all" />
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 border-t border-border-default/50">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-indigo text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-indigo-dark transition-all shadow-lg shadow-brand-indigo/20 active:scale-[0.98]"
          >
            <MapIcon size={18} />
            <span>Get Directions</span>
          </a>
        </div>
      </div>
    </div>
  )
}
