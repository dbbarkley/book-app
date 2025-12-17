// API Types - Generated from backend API responses

export interface User {
  id: number
  email?: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  created_at?: string
  onboarding_completed?: boolean
}

export interface Author {
  id: number
  name: string
  bio?: string
  avatar_url?: string
  website_url?: string
  books_count?: number
  events_count?: number
  followers_count?: number
}

export interface Book {
  id: number
  title: string
  isbn?: string
  description?: string
  cover_image_url?: string
  release_date: string
  author?: Author
  author_name?: string
  followers_count?: number
  google_books_id?: string // Google Books API ID (if from Google Books)
}

export interface RecommendedBook {
  id: number
  book: Book
  reason: string
  score?: number
  source?: string
}

export interface RecommendedAuthor {
  id: number
  author: Author
  reason: string
  score?: number
  source?: string
}

export interface RecommendedEvent {
  id: number
  event: Event
  reason: string
  score?: number
  source?: string
}

export interface RecommendedEventGroup {
  group: string
  title: string
  description: string
  events: RecommendedEvent[]
}

export interface RecommendedEvent {
  id: number
  event: Event
  reason: string
  score?: number
  source?: string
  group?: 'followed_authors' | 'related_books' | string
}

export interface Event {
  id: number
  title: string
  description?: string
  event_type: 'book_release' | 'author_announcement' | 'signing' | 'reading' | 'interview' | 'tour' | 'virtual_event'
  starts_at: string
  ends_at?: string
  location?: string // Physical location or null for virtual events
  is_virtual: boolean // True for online/virtual events
  venue_name?: string // Venue, bookstore, or platform name
  external_url?: string // Link to Eventbrite, Ticketmaster, Zoom, etc.
  external_source?: 'eventbrite' | 'ticketmaster' | 'manual' | 'other' // Where event was fetched from
  timezone?: string // e.g. "America/New_York"
  author?: Author
  author_id?: number
  author_name?: string
  book?: Book
  book_id?: number
  created_at?: string
  updated_at?: string
  last_refreshed_at?: string // When event data was last synced
}

export interface Follow {
  id: number
  followable_type: 'User' | 'Author' | 'Book'
  followable_id: number
  followable?: User | Author | Book
  created_at: string
}

export interface FeedItem {
  id: number
  activity_type: 
    | 'book_release' 
    | 'author_event' 
    | 'author_announcement'
    | 'book_recommendation'
    | 'event_recommendation'
    | 'follow_activity'
    | 'user_added_book'
    | 'user_finished_book'
    | 'user_progress_update'
    | 'user_review'
    | 'user_followed_author'
    | 'friend_activity'
  metadata?: Record<string, any>
  feedable?: Book | Event | Author | User | UserBook
  user?: User // The user who performed the activity
  created_at: string
}

export interface Notification {
  id: number
  notification_type: 'new_follower' | 'book_release' | 'event_reminder' | 'author_announcement'
  read: boolean
  read_at?: string
  notifiable?: Book | Author | User
  created_at: string
}

export interface PaginationMeta {
  page: number
  per_page: number
  total_pages: number
  total_count: number
}

export interface ApiResponse<T> {
  data?: T
  errors?: string[]
  pagination?: PaginationMeta
}

// Onboarding Types
export interface Genre {
  id: string
  name: string
  description?: string
}

export interface UserPreference {
  genres?: string[]
  author_ids?: number[]
  onboarding_completed?: boolean
}

export interface OnboardingResponse {
  message: string
  preferences: UserPreference
}

// User Book Types - For tracking reading progress and shelves
export type BookShelf = 'to_read' | 'reading' | 'read'

export interface UserBook {
  id: number
  book_id: number
  book?: Book
  shelf: BookShelf
  pages_read?: number
  total_pages?: number
  completion_percentage?: number
  rating?: number // 1-5 stars
  review?: string
  started_at?: string
  finished_at?: string
  created_at: string
  updated_at: string
}

export interface BookSearchParams {
  query?: string
  page?: number
  per_page?: number
  author_id?: number
  upcoming?: boolean
  release_date?: string
}

export interface BookSearchResponse {
  books: Book[]
  pagination?: PaginationMeta
}

// Events Types
export interface EventSearchParams {
  page?: number
  per_page?: number
  author_id?: number
  upcoming?: boolean // Filter for future events only
  event_type?: string
  is_virtual?: boolean
  start_date?: string // Filter events after this date
  end_date?: string // Filter events before this date
}

export interface EventsResponse {
  events: Event[]
  pagination?: PaginationMeta
}

export interface RefreshEventsResponse {
  message: string
  events_count: number
  last_refreshed_at: string
}

