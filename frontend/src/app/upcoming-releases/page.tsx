'use client'

import Link from 'next/link'
import { CalendarDays, ChevronLeft } from 'lucide-react'
import UpcomingReleasesSection from '@/components/UpcomingReleasesSection'

export default function UpcomingReleasesPage() {
  return (
    <div className="container-mobile py-6 sm:py-10 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1 mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-lit-3)', fontSize: 13, fontWeight: 600 }}
      >
        <ChevronLeft size={14} />
        Discover
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: 'rgba(74,124,89,0.2)',
          }}
        >
          <CalendarDays size={22} style={{ color: '#6BAD8B' }} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-lit)' }}>
            Upcoming Releases
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>
            Browse by week or month · Filter by genre
          </p>
        </div>
      </div>

      <UpcomingReleasesSection />
    </div>
  )
}
