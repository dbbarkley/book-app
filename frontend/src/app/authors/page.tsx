'use client'

// Authors List Page - Shows all authors
// Uses shared services and AuthorCard component

import { useEffect, useState } from 'react'
import { authorService } from '@/services'
import { AuthorCard } from '@/components'
import { mockAuthors } from '@/utils/mockData'
import type { Author } from '@book-app/shared'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>(mockAuthors)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to fetch authors from API, fallback to mock data
    authorService
      .getAuthors()
      .then((data) => {
        // Ensure we always set an array
        setAuthors(Array.isArray(data) ? data : mockAuthors)
      })
      .catch(() => {
        setError('Failed to load authors. Showing mock data.')
        setAuthors(mockAuthors)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Authors</h1>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Loading authors...</p>
          </div>
        ) : !authors || authors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No authors found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
