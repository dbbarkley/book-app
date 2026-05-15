// Reading Buddy Hook - Wrapper around readingBuddyStore
// Reusable in Next.js and React Native

import { useReadingBuddyStore } from '../store/readingBuddyStore'

export function useReadingBuddy() {
  const store = useReadingBuddyStore()

  return {
    // Session list
    sessions:        store.sessions,
    sessionsLoading: store.sessionsLoading,
    sessionsError:   store.sessionsError,
    fetchSessions:   store.fetchSessions,

    // Session detail
    activeSession:      store.activeSession,
    messages:           store.messages,
    highlights:         store.highlights,
    sessionLoading:     store.sessionLoading,
    sessionError:       store.sessionError,
    fetchSession:       store.fetchSession,
    clearActiveSession: store.clearActiveSession,

    // Actions
    createSession:   store.createSession,
    acceptSession:   store.acceptSession,
    declineSession:  store.declineSession,
    dnfSession:      store.dnfSession,
    sendMessage:     store.sendMessage,
    createHighlight: store.createHighlight,
    deleteHighlight: store.deleteHighlight,

    // Real-time
    handleCableEvent: store.handleCableEvent,
  }
}
