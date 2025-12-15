# Shared - TypeScript Shared Code

Shared TypeScript code used by both Next.js frontend and future React Native mobile app.

## Structure

```
shared/
├── api/           # API client (Axios-based)
│   └── client.ts
├── store/         # Zustand stores for global state
│   ├── authStore.ts
│   ├── feedStore.ts
│   ├── followsStore.ts
│   └── index.ts
├── hooks/         # React hooks (wrappers around stores)
│   ├── useAuth.ts
│   ├── useFeed.ts
│   ├── useFollows.ts
│   └── index.ts
├── types/         # TypeScript type definitions
│   └── index.ts
├── utils/         # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── index.ts
└── index.ts       # Main export file
```

## Usage

### In Next.js

```typescript
// Import from the shared package
import { apiClient, useAuth, useFeed, useFollows } from '@book-app/shared'
import type { User, Book, Author } from '@book-app/shared'

// Or use path aliases
import { apiClient } from '@/shared/api/client'
import { useAuth } from '@/shared/hooks/useAuth'
```

### In React Native (Future)

```typescript
import { apiClient, useAuth, useFeed, useFollows } from '../shared'
import type { User, Book, Author } from '../shared'
```

## API Client

The `ApiClient` class provides typed methods for all backend API endpoints using Axios:

```typescript
import { apiClient } from '@book-app/shared'

// Set authentication token
apiClient.setToken(token)

// Auth
const { user, token } = await apiClient.login(email, password)
await apiClient.logout()
const user = await apiClient.getCurrentUser()

// Feed
const { feed_items, pagination } = await apiClient.getFeed(1, 50)

// Authors
const authors = await apiClient.getAuthors()
const author = await apiClient.getAuthor(id)
const books = await apiClient.getAuthorBooks(id)

// Books
const books = await apiClient.getBooks({ upcoming: true })
const book = await apiClient.getBook(id)

// Events
const events = await apiClient.getEvents({ upcoming: true })
const event = await apiClient.getEvent(id)

// Follows
const follow = await apiClient.follow('Author', authorId)
await apiClient.unfollow(followId)
const follows = await apiClient.getFollows()
```

### Features

- Automatic token injection in requests
- Error handling with interceptors
- TypeScript types for all requests/responses
- 401 handling (auto-logout on token expiration)

## Zustand Stores

Global state management using Zustand:

### Auth Store

```typescript
import { useAuthStore } from '@book-app/shared'

const { user, token, isAuthenticated, login, logout } = useAuthStore()
```

- Persists token to localStorage (web) or AsyncStorage (React Native)
- Automatically refreshes user on token restore
- Handles authentication state

### Feed Store

```typescript
import { useFeedStore } from '@book-app/shared'

const { items, pagination, loading, fetchFeed } = useFeedStore()
```

- Manages feed items and pagination
- Loading and error states

### Follows Store

```typescript
import { useFollowsStore } from '@book-app/shared'

const { follows, isFollowing, follow, unfollow } = useFollowsStore()
```

- Tracks follow relationships
- Helper methods for checking follow status

## React Hooks

Convenient hooks that wrap the Zustand stores:

### useAuth

```typescript
import { useAuth } from '@book-app/shared'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  // Automatically initializes auth on mount
  // Handles token refresh
}
```

### useFeed

```typescript
import { useFeed } from '@book-app/shared'

function FeedComponent() {
  const { items, loading, fetchFeed } = useFeed()
  
  useEffect(() => {
    fetchFeed()
  }, [])
}
```

### useFollows

```typescript
import { useFollows } from '@book-app/shared'

function AuthorComponent({ authorId }) {
  const { isFollowing, follow, unfollow } = useFollows()
  
  // Automatically fetches follows when authenticated
}
```

## Types

TypeScript type definitions matching backend API responses:

- `User` - User model
- `Author` - Author model
- `Book` - Book model
- `Event` - Event model
- `Follow` - Follow relationship
- `FeedItem` - Feed item
- `Notification` - Notification
- `PaginationMeta` - Pagination metadata

## Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check
```

## React Native Migration

The shared code is designed to work in React Native with minimal changes:

1. **Storage**: Update `authStore.ts` to use AsyncStorage:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage'
   return createJSONStorage(() => AsyncStorage)
   ```

2. **API URL**: Set `API_URL` environment variable or use a config file

3. **Hooks & Stores**: Work as-is in React Native

4. **Types**: Fully compatible

## Notes

- All API calls are typed with TypeScript
- Error handling is built into the API client
- Stores use Zustand's persist middleware for state persistence
- Hooks automatically handle loading states and errors
- Code is designed to be framework-agnostic (works in Next.js and React Native)
