'use client'

import { useState } from 'react'
import { useUserLibrary } from '@book-app/shared'
import UserLibraryShelf from './UserLibraryShelf'
import { BookOpen } from 'lucide-react'

interface UserLibraryProps {
  userId: number
  username: string
}

type ShelfTab = 'reading' | 'to_read' | 'read' | 'dnf'

export default function UserLibrary({ userId, username }: UserLibraryProps) {
  const { groupedLibrary, loading, error } = useUserLibrary(userId)
  const [activeTab, setActiveTab] = useState<ShelfTab>('reading')

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Tab skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full"
              style={{ backgroundColor: 'var(--color-grove)' }}
            />
          ))}
        </div>
        {/* Card skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-grove)' }}>
              <div className="w-full" style={{ aspectRatio: '2/3', backgroundColor: 'var(--color-grove)' }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: 'var(--color-surface)' }} />
                <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--color-surface)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="p-6 text-center rounded-2xl text-sm"
        style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
      >
        Failed to load library: {error}
      </div>
    )
  }

  const tabs: { id: ShelfTab; label: string; count: number }[] = [
    { id: 'reading', label: 'Reading',  count: groupedLibrary.reading.length  },
    { id: 'to_read', label: 'To Read',  count: groupedLibrary.to_read.length  },
    { id: 'read',    label: 'Read',     count: groupedLibrary.read.length     },
    { id: 'dnf',     label: 'DNF',      count: groupedLibrary.dnf.length      },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--color-lit)' }}>
          Library
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={active
                ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
                : { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }
              }
            >
              {tab.label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={active
                  ? { backgroundColor: 'rgba(26,18,5,0.25)', color: 'var(--color-accent-on)' }
                  : { backgroundColor: 'var(--color-surface)', color: 'var(--color-lit-3)' }
                }
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Shelf content */}
      <div>
        {activeTab === 'reading' && (
          <UserLibraryShelf userBooks={groupedLibrary.reading} shelfName="Reading"
            emptyMessage={`${username} isn't currently reading any books publicly.`} />
        )}
        {activeTab === 'to_read' && (
          <UserLibraryShelf userBooks={groupedLibrary.to_read} shelfName="To Read"
            emptyMessage={`${username} hasn't added any books to their "To Read" list publicly.`} />
        )}
        {activeTab === 'read' && (
          <UserLibraryShelf userBooks={groupedLibrary.read} shelfName="Read"
            emptyMessage={`${username} hasn't marked any books as "Read" publicly.`} />
        )}
        {activeTab === 'dnf' && (
          <UserLibraryShelf userBooks={groupedLibrary.dnf} shelfName="DNF"
            emptyMessage={`${username} hasn't shared any books they didn't finish.`} />
        )}
      </div>

      <p className="text-xs pt-2" style={{ color: 'var(--color-lit-3)', borderTop: '1px solid var(--color-rim)' }}>
        Only public books are shown. Private shelves are never visible to other users.
      </p>
    </div>
  )
}
