// AuthorSelector Component - Search and select authors
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

'use client'

import React, { useState, useMemo } from 'react'
import type { Author } from '@book-app/shared'

export interface AuthorSelectorProps {
  authors: Author[]
  selectedAuthorIds: number[]
  onToggleAuthor: (authorId: number) => void
  className?: string
}

/**
 * AuthorSelector component for searching and selecting favorite authors
 * 
 * Usage:
 * ```tsx
 * <AuthorSelector
 *   authors={authors}
 *   selectedAuthorIds={selectedAuthorIds}
 *   onToggleAuthor={handleToggleAuthor}
 * />
 * ```
 * 
 * For React Native:
 * - Replace input with TextInput
 * - Replace button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Consider using FlatList for better performance with many authors
 * - Keep the same prop interface for consistency
 */
export default function AuthorSelector({
  authors,
  selectedAuthorIds,
  onToggleAuthor,
  className = '',
}: AuthorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter authors based on search query
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) {
      return authors
    }

    const query = searchQuery.toLowerCase()
    return authors.filter(
      (author) =>
        author.name.toLowerCase().includes(query) ||
        author.bio?.toLowerCase().includes(query)
    )
  }, [authors, searchQuery])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search authors by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Authors list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAuthors.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No authors found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredAuthors.map((author) => {
            const isSelected = selectedAuthorIds.includes(author.id)

            return (
              <button
                key={author.id}
                type="button"
                onClick={() => onToggleAuthor(author.id)}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 text-left transition-all
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      flex-shrink-0 text-sm font-medium
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {author.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  {/* Author info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm sm:text-base ${
                        isSelected ? 'text-blue-900' : 'text-slate-900'
                      }`}
                    >
                      {author.name}
                    </div>
                    {author.bio && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {author.bio}
                      </div>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {selectedAuthorIds.length > 0 && (
        <p className="text-sm text-slate-600 mt-4">
          {selectedAuthorIds.length} author{selectedAuthorIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

