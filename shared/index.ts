// Shared package exports
// This is the main entry point for the shared package
// Import from '@book-app/shared' in both Next.js and React Native

// API Client
export { apiClient, ApiClient } from './api/client'

// Types
export type * from './types'

// Stores (Zustand)
export {
  useAuthStore,
  useFeedStore,
  useFollowsStore,
  useOnboardingStore,
  useAuthorsStore,
  useBooksStore,
} from './store'

// Hooks
export {
  useAuth,
  useFeed,
  useFollows,
  useFollow,
  useOnboarding,
  useAuthorSearch,
  useEnhancedAuthorSearch,
  useAuthorProfile,
  useFollowAuthor,
  useUserSearch,
  useBookSearch,
  useBookDetails,
  useBookShelf,
  useBookProgress,
  useUpdateBookShelf,
  useUpdateBookVisibility,
  useBookReview,
  useGoodreadsImport,
  useImportStatus,
  useRecommendedBooks,
  useRecommendedAuthors,
  useRecommendedEvents,
  useUserLibrary,
  usePrivateLibrary,
} from './hooks'

// Utils
export * from './utils'

// Services
export * from './services'
