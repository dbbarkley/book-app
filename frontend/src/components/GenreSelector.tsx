// GenreSelector Component - Multi-select component for genres
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'
import type { Genre } from '@book-app/shared'

export interface GenreSelectorProps {
  genres: Genre[]
  selectedGenres: string[]
  onToggleGenre: (genreId: string) => void
  className?: string
}

/**
 * GenreSelector component for selecting favorite genres
 * 
 * Usage:
 * ```tsx
 * <GenreSelector
 *   genres={genres}
 *   selectedGenres={selectedGenres}
 *   onToggleGenre={handleToggleGenre}
 * />
 * ```
 * 
 * For React Native:
 * - Replace button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Consider using FlatList for better performance with many genres
 * - Keep the same prop interface for consistency
 */
export default function GenreSelector({
  genres,
  selectedGenres,
  onToggleGenre,
  className = '',
}: GenreSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm text-slate-600 mb-4">
        Select your favorite genres (you can choose multiple)
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id)

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onToggleGenre(genre.id)}
              className={`
                px-4 py-3 rounded-lg border-2 text-left transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="font-medium text-sm sm:text-base">{genre.name}</div>
              {genre.description && (
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {genre.description}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedGenres.length > 0 && (
        <p className="text-sm text-slate-600 mt-4">
          {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

