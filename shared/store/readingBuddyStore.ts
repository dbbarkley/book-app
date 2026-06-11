// Reading Buddy Store - Zustand store for Reading Buddy sessions
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type {
  ReadingBuddySession,
  ReadingBuddyMessage,
  ReadingBuddyHighlight,
  ReadingBuddyMessageReaction,
  CreateHighlightPayload,
  ReadingBuddyCableEvent,
} from '../types'
import { apiClient } from '../api/client'
import { useAuthStore } from './authStore'

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
  cancelSession: (sessionId: number) => Promise<void>
  dnfSession: (sessionId: number) => Promise<void>
  sendMessage: (sessionId: number, content: string) => Promise<void>
  toggleReaction: (sessionId: number, messageId: number, emoji: string) => Promise<void>
  createHighlight: (sessionId: number, payload: CreateHighlightPayload) => Promise<ReadingBuddyHighlight>
  deleteHighlight: (sessionId: number, highlightId: number) => Promise<void>

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

  cancelSession: async (sessionId: number) => {
    const updated = await apiClient.updateReadingBuddySession(sessionId, 'cancel')
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

  toggleReaction: async (sessionId: number, messageId: number, emoji: string) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    // Optimistic update
    set(state => ({
      messages: state.messages.map(m => {
        if (m.id !== messageId) return m
        const existing = m.reactions.find(r => r.emoji === emoji)
        let reactions: ReadingBuddyMessageReaction[]
        if (existing) {
          const newUserIds = existing.user_ids.filter(id => id !== userId)
          reactions = newUserIds.length === 0
            ? m.reactions.filter(r => r.emoji !== emoji)
            : m.reactions.map(r => r.emoji === emoji ? { ...r, user_ids: newUserIds } : r)
        } else {
          reactions = [...m.reactions, { emoji, user_ids: [userId] }]
        }
        return { ...m, reactions }
      })
    }))

    try {
      const reactions = await apiClient.toggleMessageReaction(sessionId, messageId, emoji)
      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, reactions } : m)
      }))
    } catch {
      // On error, re-fetch would be ideal, but the cable will sync the other participant;
      // revert by toggling back optimistically
      set(state => ({
        messages: state.messages.map(m => {
          if (m.id !== messageId) return m
          const existing = m.reactions.find(r => r.emoji === emoji)
          let reactions: ReadingBuddyMessageReaction[]
          if (existing) {
            const newUserIds = existing.user_ids.includes(userId)
              ? existing.user_ids.filter(id => id !== userId)
              : [...existing.user_ids, userId]
            reactions = newUserIds.length === 0
              ? m.reactions.filter(r => r.emoji !== emoji)
              : m.reactions.map(r => r.emoji === emoji ? { ...r, user_ids: newUserIds } : r)
          } else {
            reactions = m.reactions.filter(r => r.emoji !== emoji)
          }
          return { ...m, reactions }
        })
      }))
    }
  },

  createHighlight: async (sessionId: number, payload: CreateHighlightPayload) => {
    const highlight = await apiClient.createReadingBuddyHighlight(sessionId, payload)
    // Always apply the API response, even if the cable broadcast already added the highlight.
    // The broadcast sends locked:true to all subscribers (including the creator); the API
    // response correctly returns locked:false for the creator. Overwrite wins here.
    set(state => {
      const without = state.highlights.filter(h => h.id !== highlight.id)
      const updated = [...without, highlight].sort((a, b) =>
        a.page_number !== b.page_number
          ? a.page_number - b.page_number
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      return { highlights: updated }
    })
    return highlight
  },

  deleteHighlight: async (sessionId: number, highlightId: number) => {
    await apiClient.deleteReadingBuddyHighlight(sessionId, highlightId)
    set(state => ({ highlights: state.highlights.filter(h => h.id !== highlightId) }))
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
    } else if (event.type === 'reaction_update') {
      set(state => ({
        messages: state.messages.map(m =>
          m.id === event.message_id ? { ...m, reactions: event.reactions } : m
        )
      }))
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
