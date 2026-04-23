'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, X, Check, Loader2 } from 'lucide-react'
import type { Author } from '@book-app/shared'

export interface AuthorSelectorProps {
  authors: Author[]
  selectedAuthorIds: number[]
  onToggleAuthor: (authorId: number) => void
  /** Called with the debounced search query — use to fetch from the API */
  onSearch?: (query: string) => void
  searchLoading?: boolean
  className?: string
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function AuthorSelector({
  authors,
  selectedAuthorIds,
  onToggleAuthor,
  onSearch,
  searchLoading = false,
  className = '',
}: AuthorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    if (!onSearch) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(searchQuery.trim()), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])
  // NOTE: onSearch intentionally excluded from deps — see previous comment

  // Build a lookup of selected authors by ID for pill display
  const selectedAuthorMap = useMemo(() => {
    const map = new Map<number, Author>()
    authors.forEach(a => { if (selectedAuthorIds.includes(a.id)) map.set(a.id, a) })
    return map
  }, [authors, selectedAuthorIds])

  // List shown in the scrollable area — always unselected only
  const listAuthors = useMemo(() => {
    const selectedSet = new Set(selectedAuthorIds)
    const base = onSearch
      ? authors
      : (() => {
          if (!searchQuery.trim()) return authors
          const q = searchQuery.toLowerCase()
          return authors.filter(a =>
            a.name.toLowerCase().includes(q) || a.bio?.toLowerCase().includes(q)
          )
        })()
    return base.filter(a => !selectedSet.has(a.id))
  }, [authors, searchQuery, onSearch, selectedAuthorIds])

  const handleClear = useCallback(() => setSearchQuery(''), [])

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Selected pills */}
      {selectedAuthorIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAuthorIds.map(id => {
            const author = selectedAuthorMap.get(id)
            const name = author?.name ?? `Author ${id}`
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleAuthor(id)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  border: '1px solid var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {name}
                <X size={13} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              </button>
            )
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        {searchLoading ? (
          <Loader2
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none animate-spin"
            style={{ color: 'var(--color-accent)' }}
          />
        ) : (
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-lit-3)' }}
          />
        )}
        <input
          type="text"
          placeholder="Search authors…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{
            backgroundColor: 'var(--color-grove)',
            border: '1px solid var(--color-rim)',
            color: 'var(--color-lit)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-lit-3)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Author list — only unselected authors shown here */}
      <div
        className="space-y-1.5 max-h-72 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-rim) transparent' }}
      >
        {listAuthors.length === 0 && !searchLoading ? (
          <div className="py-6 text-center text-sm" style={{ color: 'var(--color-lit-2)' }}>
            {searchQuery ? `No authors found for "${searchQuery}"` : 'No authors available'}
          </div>
        ) : (
          listAuthors.map(author => (
            <button
              key={author.id}
              type="button"
              onClick={() => onToggleAuthor(author.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-lit-2)' }}
              >
                {initials(author.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                  {author.name}
                </p>
                {author.bio && (
                  <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--color-lit-3)' }}>
                    {author.bio}
                  </p>
                )}
              </div>
              <Check size={15} style={{ color: 'var(--color-rim)', flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
