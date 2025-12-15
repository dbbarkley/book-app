# Frontend - Next.js Book Social App

This is the Next.js frontend application for the Book Social Platform, built with TypeScript, TailwindCSS, and the shared codebase.

## Architecture

### Folder Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Home/Feed page
│   │   ├── login/        # Login page
│   │   ├── signup/       # Signup page
│   │   ├── books/[id]/   # Book detail page
│   │   ├── authors/      # Authors list and detail pages
│   │   └── events/       # Events page
│   ├── components/       # UI components
│   │   ├── Navigation.tsx
│   │   ├── FeedItem.tsx
│   │   ├── BookCard.tsx
│   │   ├── AuthorCard.tsx
│   │   └── EventCard.tsx
│   ├── services/         # API service layer (uses shared API client)
│   │   ├── bookService.ts
│   │   ├── authorService.ts
│   │   └── eventService.ts
│   └── utils/            # Frontend-specific utilities
│       ├── format.ts
│       └── mockData.ts
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
└── tailwind.config.ts    # TailwindCSS configuration
```

### Shared Code

The frontend uses code from the `/shared` directory:

- **API Client** (`@book-app/shared/api/client`): Axios-based API client
- **Zustand Stores** (`@book-app/shared/store`): Global state management
- **Hooks** (`@book-app/shared/hooks`): React hooks for auth, feed, follows
- **Types** (`@book-app/shared/types`): TypeScript type definitions
- **Utils** (`@book-app/shared/utils`): Shared utility functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running at `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Install shared package dependencies
cd ../shared
npm install
cd ../frontend
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:3001` (or the port specified in docker-compose).

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Features

### Pages

- **Home/Feed** (`/`): Displays feed items (book releases, events, announcements)
- **Login** (`/login`): User authentication
- **Signup** (`/signup`): User registration
- **Book Detail** (`/books/[id]`): Book information, follow/unfollow
- **Authors** (`/authors`): List of all authors
- **Author Detail** (`/authors/[id]`): Author profile, books, events, follow status
- **Events** (`/events`): List of all events with filtering

### Components

- **Navigation**: Responsive top navigation with mobile menu
- **FeedItem**: Reusable feed item component for different activity types
- **BookCard**: Book card component for lists and grids
- **AuthorCard**: Author card component
- **EventCard**: Event card component

### State Management

Uses Zustand stores from `/shared`:

- `useAuthStore`: Authentication state (user, token, login/logout)
- `useFeedStore`: Feed items and pagination
- `useFollowsStore`: Follow relationships

### Styling

- **TailwindCSS**: Mobile-first responsive design
- **Custom utilities**: Container classes, tap targets for mobile
- **Dark mode**: Supports system preference (ready for implementation)

## Development Notes

### Mock Data

The app includes mock data in `src/utils/mockData.ts` for development. Pages will:
1. Try to fetch data from the API
2. Fall back to mock data if the API call fails
3. Show a warning message when using mock data

### API Integration

All API calls go through the shared API client (`@book-app/shared/api/client`), which:
- Handles authentication tokens automatically
- Provides error handling
- Uses Axios for better request/response handling

### Mobile-First Design

- All components are designed mobile-first
- Navigation includes a mobile menu
- Touch-friendly tap targets (minimum 44px)
- Responsive grids and layouts

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## React Native Migration

The shared code (`/shared`) is designed to be reusable in React Native:

1. **API Client**: Works in React Native (uses Axios)
2. **Zustand Stores**: Compatible with React Native
3. **Hooks**: Can be used directly in React Native
4. **Types**: Shared TypeScript types

To migrate to React Native:

1. Update storage adapter in `shared/store/authStore.ts` to use AsyncStorage
2. Create React Native components (UI components are web-specific)
3. Use React Navigation instead of Next.js routing
4. Keep all API calls, state management, and business logic unchanged

## Troubleshooting

### API Connection Issues

If you see mock data warnings:
- Ensure the backend is running at `http://localhost:3000`
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS is configured in the backend

### Type Errors

If you see TypeScript errors:
- Run `npm run type-check` to see all errors
- Ensure shared package is installed: `cd ../shared && npm install`
- Check that path aliases in `tsconfig.json` are correct

### Build Issues

- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Future Enhancements

- [ ] User profile pages
- [ ] Book reviews and ratings
- [ ] Search functionality
- [ ] Notifications UI
- [ ] Dark mode toggle
- [ ] Infinite scroll for feed
- [ ] Image optimization with Next.js Image component
- [ ] Service Worker for offline support
