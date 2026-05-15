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
  useReadingBuddyStore,
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
  useBookNotes,
  useEvents,
  useAuthorEvents,
  useVenues,
  useRefreshEvents,
  useGoodreadsImport,
  useImportStatus,
  useRecommendedBooks,
  useRecommendedAuthors,
  useRecommendedEvents,
  useUserLibrary,
  useMilestones,
  usePrivateLibrary,
  useBookFriends,
  useFriendship,
  useFriends,
  useBookSuggestions,
  useNewReleases,
  useComingSoon,
  useForums,
  useForum,
  useForumPosts,
  useForumPost,
  useReadingBuddy,
  useBookSimilarity,
  useUserLists,
  useUserList,
} from './hooks'


// Utils
export * from './utils'

// Services
export * from './services'

// Constants
export * from './constants/gamification'
