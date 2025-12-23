'use client'

import { useState } from 'react'
import { useUserLibrary } from '@book-app/shared'
import UserLibraryShelf from './UserLibraryShelf'
import { SkeletonLoader } from './SkeletonLoader'

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
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-slate-200 animate-pulse rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <SkeletonLoader variant="rectangular" className="aspect-[2/3] w-full rounded-lg" />
              <SkeletonLoader variant="text" width="80%" />
              <SkeletonLoader variant="text" width="60%" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        <p>Failed to load library: {error}</p>
      </div>
    )
  }

  const tabs: { id: ShelfTab; label: string; count: number }[] = [
    { id: 'reading', label: 'Reading', count: groupedLibrary.reading.length },
    { id: 'to_read', label: 'To Read', count: groupedLibrary.to_read.length },
    { id: 'read', label: 'Read', count: groupedLibrary.read.length },
    { id: 'dnf', label: 'DNF', count: groupedLibrary.dnf.length },
  ]

  // Set active tab to the first one with books if current is empty and others aren't
  // But only on initial load or if we want to be helpful. 
  // For now, let's just stick to 'reading' as default.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Library</h2>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
            `}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-primary-50 text-primary-600' : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Shelf Content */}
      <div className="mt-6">
        {activeTab === 'reading' && (
          <UserLibraryShelf
            userBooks={groupedLibrary.reading}
            shelfName="Reading"
            emptyMessage={`${username} isn't currently reading any books publicly.`}
          />
        )}
        {activeTab === 'to_read' && (
          <UserLibraryShelf
            userBooks={groupedLibrary.to_read}
            shelfName="To Read"
            emptyMessage={`${username} hasn't added any books to their "To Read" list publicly.`}
          />
        )}
        {activeTab === 'read' && (
          <UserLibraryShelf
            userBooks={groupedLibrary.read}
            shelfName="Read"
            emptyMessage={`${username} hasn't marked any books as "Read" publicly.`}
          />
        )}
        {activeTab === 'dnf' && (
          <UserLibraryShelf
            userBooks={groupedLibrary.dnf}
            shelfName="DNF"
            emptyMessage={`${username} hasn't shared any books they didn't finish.`}
          />
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400 italic">
          * Only public books are shown. Private reading lists are never displayed to other users.
        </p>
      </div>
    </div>
  )
}

