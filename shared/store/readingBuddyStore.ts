// Reading Buddy Store - Zustand store for Reading Buddy sessions
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type {
  ReadingBuddySession,
  ReadingBuddyMessage,
  ReadingBuddyHighlight,
  CreateHighlightPayload,
  ReadingBuddyCableEvent,
} from '../types'
import { apiClient } from '../api/client'

interface ReadingBuddyState {
  // Session list
  sessions: ReadingBuddySession[]
  sessionsLoading: boolean
  sessionsError: string | null

  // Active session detail
  activeSession: ReadingBuddySession | null
  messages: ReadingBuddyMessage[]
  highlights: ReadingBuddyHighlight[]
  sessionLoading: boolean
  sessionError: string | null

  // Actions
  fetchSessions: () => Promise<void>
  fetchSession: (sessionId: number) => Promise<void>
  createSession: (bookId: number, invitedId: number) => Promise<ReadingBuddySession>
  acceptSession: (sessionId: number) => Promise<void>
  declineSession: (sessionId: number) => Promise<void>
  dnfSession: (sessionId: number) => Promise<void>
  sendMessage: (sessionId: number, content: string) => Promise<void>
  createHighlight: (sessionId: number, payload: CreateHighlightPayload) => Promise<ReadingBuddyHighlight>

  // Real-time updates (called by the cable subscription in the component)
  handleCableEvent: (event: ReadingBuddyCableEvent) => void

  // Optimistic message append (before server confirms)
  appendMessage: (message: ReadingBuddyMessage) => void

  // Update progress for a participant from a cable broadcast
  applyProgressUpdate: (userId: number, progress: ReadingBuddyCableEvent & { type: 'progress_update' }) => void

  clearActiveSession: () => void
}

export const useReadingBuddyStore = create<ReadingBuddyState>((set, get) => ({
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,

  activeSession: null,
  messages: [],
  highlights: [],
  sessionLoading: false,
  sessionError: null,

  fetchSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null })
    try {
      const sessions = await apiClient.getReadingBuddySessions()
      set({ sessions, sessionsLoading: false })
    } catch (error) {
      set({
        sessionsError: error instanceof Error ? error.message : 'Failed to load sessions',
        sessionsLoading: false,
      })
    }
  },

  fetchSession: async (sessionId: number) => {
    set({ sessionLoading: true, sessionError: null })
    try {
      const { session, messages, highlights } = await apiClient.getReadingBuddySession(sessionId)
      set({ activeSession: session, messages, highlights: highlights ?? [], sessionLoading: false })
    } catch (error) {
      set({
        sessionError: error instanceof Error ? error.message : 'Failed to load session',
        sessionLoading: false,
      })
    }
  },

  createSession: async (bookId: number, invitedId: number) => {
    const session = await apiClient.createReadingBuddySession(bookId, invitedId)
    set(state => ({ sessions: [session, ...state.sessions] }))
    return session
  },

  acceptSession: async (sessionId: number) => {
    const updated = await apiClient.updateReadingBuddySession(sessionId, 'accept')
    set(state => ({
      sessions: state.sessions.map(s => s.id === sessionId ? updated : s),
      activeSession: state.activeSession?.id === sessionId ? updated : state.activeSession,
    }))
  },

  declineSession: async (sessionId: number) => {
    const updated = await apiClient.updateReadingBuddySession(sessionId, 'decline')
    set(state => ({
      sessions: state.sessions.map(s => s.id === sessionId ? updated : s),
      activeSession: state.activeSession?.id === sessionId ? updated : state.activeSession,
    }))
  },

  dnfSession: async (sessionId: number) => {
    const updated = await apiClient.updateReadingBuddySession(sessionId, 'dnf')
    set(state => ({
      sessions: state.sessions.map(s => s.id === sessionId ? updated : s),
      activeSession: state.activeSession?.id === sessionId ? updated : state.activeSession,
    }))
  },

  sendMessage: async (sessionId: number, content: string) => {
    // The message will arrive via ActionCable broadcast; no need to append locally
    await apiClient.sendReadingBuddyMessage(sessionId, content)
  },

  createHighlight: async (sessionId: number, payload: CreateHighlightPayload) => {
    // The highlight will arrive via ActionCable broadcast too, but return immediately for UX
    const highlight = await apiClient.createReadingBuddyHighlight(sessionId, payload)
    // Optimistically add so the creator sees it instantly (cable will dedup)
    set(state => {
      const exists = state.highlights.some(h => h.id === highlight.id)
      if (exists) return state
      const updated = [...state.highlights, highlight].sort((a, b) =>
        a.page_number !== b.page_number
          ? a.page_number - b.page_number
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      return { highlights: updated }
    })
    return highlight
  },

  handleCableEvent: (event: ReadingBuddyCableEvent) => {
    if (event.type === 'new_message') {
      set(state => {
        const exists = state.messages.some(m => m.id === event.message.id)
        if (exists) return state
        return { messages: [...state.messages, event.message] }
      })
    } else if (event.type === 'progress_update') {
      get().applyProgressUpdate(event.user_id, event)
    } else if (event.type === 'new_highlight') {
      set(state => {
        const exists = state.highlights.some(h => h.id === event.highlight.id)
        if (exists) return state
        const updated = [...state.highlights, event.highlight].sort((a, b) =>
          a.page_number !== b.page_number
            ? a.page_number - b.page_number
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        return { highlights: updated }
      })
    }
  },

  appendMessage: (message: ReadingBuddyMessage) => {
    set(state => {
      const exists = state.messages.some(m => m.id === message.id)
      if (exists) return state
      return { messages: [...state.messages, message] }
    })
  },

  applyProgressUpdate: (
    userId: number,
    event: ReadingBuddyCableEvent & { type: 'progress_update' }
  ) => {
    set(state => {
      if (!state.activeSession) return state
      const session = state.activeSession
      const isInitiator = session.initiator.id === userId
      const updatedSession: ReadingBuddySession = {
        ...session,
        initiator: isInitiator
          ? { ...session.initiator, progress: event.progress }
          : session.initiator,
        invited: !isInitiator
          ? { ...session.invited, progress: event.progress }
          : session.invited,
      }
      return {
        activeSession: updatedSession,
        sessions: state.sessions.map(s => s.id === session.id ? updatedSession : s),
      }
    })
  },

  clearActiveSession: () => {
    set({ activeSession: null, messages: [], highlights: [], sessionError: null })
  },
}))
