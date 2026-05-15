'use client'

import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { BookCoverImage } from './BookCoverImage'
import type { UpcomingRelease } from '@book-app/shared'
import { apiClient } from '@book-app/shared'
import { useRouter } from 'next/navigation'

interface UpcomingReleaseCardProps {
  book: UpcomingRelease
}

function formatReleaseDate(dateStr: string, daysUntil: number | null): {
  label: string
  urgent: boolean
} {
  if (daysUntil !== null && daysUntil === 0) return { label: 'Out today',     urgent: true }
  if (daysUntil !== null && daysUntil === 1) return { label: 'Out tomorrow',  urgent: true }
  if (daysUntil !== null && daysUntil <= 7)  return { label: `In ${daysUntil} days`, urgent: true }

  const date = new Date(dateStr + 'T00:00:00')
  const now  = new Date()
  const opts: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: 'long', day: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' }

  return {
    label:  date.toLocaleDateString('en-US', opts),
    urgent: false,
  }
}

export default function UpcomingReleaseCard({ book }: UpcomingReleaseCardProps) {
  const router  = useRouter()
  const author  = book.authors[0] ?? 'Unknown Author'
  const { label: dateLabel, urgent } = formatReleaseDate(book.date_published, book.days_until)

  const [reminderId, setReminderId] = useState<number | null>(book.reminder_id ?? null)

  const isUnreleased = book.days_until !== null && book.days_until > 0

  const handleClick = () => {
    router.push(`/search?q=${encodeURIComponent(book.title)}&type=books`)
  }

  const handleBellClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (reminderId !== null) {
      const prev = reminderId
      setReminderId(null)
      try {
        await apiClient.deleteReleaseReminder(prev)
      } catch {
        setReminderId(prev)
      }
    } else {
      const tempId = -1
      setReminderId(tempId)
      try {
        const { id } = await apiClient.createReleaseReminder(book.id)
        setReminderId(id)
      } catch {
        setReminderId(null)
      }
    }
  }

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="group flex gap-4 p-4 rounded-2xl cursor-pointer transition-all select-none"
      style={{
        backgroundColor: 'var(--color-surface)',
        border:          '1px solid var(--color-rim)',
        boxShadow:       '0 4px 16px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
    >
      {/* Cover */}
      <div
        className="flex-shrink-0 w-16 rounded-xl overflow-hidden"
        style={{ aspectRatio: '2 / 3', backgroundColor: 'var(--color-grove)' }}
      >
        <BookCoverImage
          src={book.cover_image_url}
          title={book.title}
          author={author}
          size="small"
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div className="space-y-1 mb-2">
          <h3
            className="font-serif text-sm font-bold leading-snug line-clamp-2 transition-colors group-hover:text-accent"
            style={{ color: 'var(--color-lit)' }}
          >
            {book.title}
          </h3>
          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-lit-2)' }}>
            {author}
          </p>
          {book.publisher && (
            <p className="text-xs truncate" style={{ color: 'var(--color-lit-3)' }}>
              {book.publisher}
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Release date badge */}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={urgent
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
              : { backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }
            }
          >
            {dateLabel}
          </span>

          {/* Binding badge */}
          {book.binding && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)', border: '1px solid var(--color-rim)' }}
            >
              {book.binding}
            </span>
          )}

          {/* Bell reminder toggle — only for unreleased books */}
          {isUnreleased && (
            <button
              onClick={handleBellClick}
              aria-label={reminderId !== null ? 'Remove reminder' : 'Set reminder'}
              className="ml-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded-full"
              style={{ color: reminderId !== null ? 'var(--color-accent)' : 'var(--color-lit-3)' }}
            >
              {reminderId !== null
                ? <BellRing size={15} />
                : <Bell size={15} />
              }
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
