import { useState, useCallback } from 'react'
import { apiClient } from '../api/client'
import type { BookNote } from '../types'

interface UseBookNotesReturn {
  notes: BookNote[]
  loading: boolean
  error: string | null
  fetchNotes: (userBookId: number) => Promise<void>
  addNote: (userBookId: number, content: string, pageNumber?: number) => Promise<BookNote>
  deleteNote: (userBookId: number, noteId: number) => Promise<void>
  // Legacy single-note save — kept so existing callers don't break
  saveNotes: (userBookId: number, notes: string) => Promise<void>
}

export function useBookNotes(): UseBookNotesReturn {
  const [notes,   setNotes]   = useState<BookNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchNotes = useCallback(async (userBookId: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getBookNotes(userBookId)
      setNotes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  const addNote = useCallback(async (userBookId: number, content: string, pageNumber?: number) => {
    setLoading(true)
    setError(null)
    try {
      const note = await apiClient.createBookNote(userBookId, content, pageNumber)
      setNotes(prev => [note, ...prev])
      return note
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save note'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNote = useCallback(async (userBookId: number, noteId: number) => {
    setLoading(true)
    try {
      await apiClient.deleteBookNote(userBookId, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const saveNotes = useCallback(async (userBookId: number, content: string) => {
    if (content.trim()) await addNote(userBookId, content)
  }, [addNote])

  return { notes, loading, error, fetchNotes, addNote, deleteNote, saveNotes }
}
