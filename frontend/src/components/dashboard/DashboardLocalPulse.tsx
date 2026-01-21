'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Store, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Event, Venue } from '@book-app/shared'
import EventCard from '../EventCard'
import VenueCard from '../VenueCard'

interface DashboardLocalPulseProps {
  events: Event[]
  bookstores: Venue[]
  zipcode?: string
  loading?: boolean
}

export default function DashboardLocalPulse({ events, bookstores, zipcode, loading }: DashboardLocalPulseProps) {
  const hasLocalInfo = zipcode && (events.length > 0 || bookstores.length > 0)

  return (
    <section className="bg-slate-50 rounded-[32px] p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="text-rose-500" size={20} />
            Local Pulse
          </h2>
        </div>
        <Link href="/search?type=events" className="text-brand-indigo font-bold text-xs flex items-center gap-1 hover:underline">
          Map <ArrowRight size={14} />
        </Link>
      </div>

      {!zipcode ? (
        <div className="text-center py-10 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <MapPin className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="font-bold text-slate-900 mb-2">Where are you?</h3>
          <p className="text-sm text-slate-500 mb-6">Enter your zipcode to see author events and bookstores near you.</p>
          <Link href="/settings">
            <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
              Add Location
            </button>
          </Link>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !hasLocalInfo ? (
        <div className="text-center py-10 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <Sparkles className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="font-bold text-slate-900 mb-2">Quiet neighborhood!</h3>
          <p className="text-sm text-slate-500">No events found in your area right now, but we'll keep an eye out.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-4 px-1">
                <Calendar size={14} />
                <span>Upcoming Events</span>
              </div>
              <div className="flex flex-col gap-4 overflow-hidden">
                {events.slice(0, 2).map(event => (
                  <div key={event.id} className="w-full min-w-0">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookstores.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-4 px-1">
                <Store size={14} />
                <span>Local Bookstores</span>
              </div>
              <div className="flex flex-col gap-4 overflow-hidden">
                {bookstores.slice(0, 2).map(venue => (
                  <div key={venue.id} className="w-full min-w-0">
                    <VenueCard venue={venue} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

