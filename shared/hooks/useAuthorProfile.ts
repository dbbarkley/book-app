// Author Profile Hook - Fetch author details, books, and events
// Reusable in Next.js and React Native

import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import type { Author, Book, Event } from '../types'

interface AuthorProfileData {
  author: Author | null
  books: Book[]
  events: Event[]
  loading: boolean
  error: string | null
}

/**
 * Hook for fetching author profile data including books and events
 * 
 * Usage:
 * ```tsx
 * const { author, books, events, loading, error, refetch } = useAuthorProfile(authorId)
 * 
 * if (loading) return <Loading />
 * if (error) return <Error message={error} />
 * if (!author) return <NotFound />
 * 
 * return <AuthorProfile author={author} books={books} events={events} />
 * ```
 * 
 * For React Native:
 * - Works the same way
 * - Ensure apiClient is configured for React Native environment
 */
export function useAuthorProfile(authorId: number | null) {
  const [author, setAuthor] = useState<Author | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    if (!authorId) {
      setAuthor(null)
      setBooks([])
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [authorData, booksData, eventsData] = await Promise.all([
        apiClient.getAuthor(authorId),
        apiClient.getAuthorBooks(authorId).catch(() => []),
        apiClient.getAuthorEvents(authorId).catch(() => []),
      ])

      setAuthor(authorData)
      setBooks(booksData)
      setEvents(eventsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load author profile')
      setAuthor(null)
      setBooks([])
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [authorId])

  return {
    author,
    books,
    events,
    loading,
    error,
    refetch: fetchProfile,
  } as AuthorProfileData & {
    refetch: () => Promise<void>
  }
}

