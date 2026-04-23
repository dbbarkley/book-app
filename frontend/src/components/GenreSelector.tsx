// GenreSelector Component - Multi-select component for genres
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'
import { Check } from 'lucide-react'
import type { Genre } from '@book-app/shared'

export interface GenreSelectorProps {
  genres: Genre[]
  selectedGenres: string[]
  onToggleGenre: (genreId: string) => void
  className?: string
}

export default function GenreSelector({
  genres,
  selectedGenres,
  onToggleGenre,
  className = '',
}: GenreSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {genres.map(genre => {
          const isSelected = selectedGenres.includes(genre.id)
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onToggleGenre(genre.id)}
              className="relative px-4 py-3 rounded-xl text-left transition-all"
              style={isSelected
                ? { backgroundColor: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }
                : { backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }
              }
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-rim-accent)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-rim)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">{genre.name}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
              </div>
              {genre.description && (
                <p className="text-xs mt-1 line-clamp-1" style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-lit-3)', opacity: 0.8 }}>
                  {genre.description}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {selectedGenres.length > 0 && (
        <p className="text-xs font-medium" style={{ color: 'var(--color-lit-3)' }}>
          {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
