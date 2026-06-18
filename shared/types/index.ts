// API Types - Generated from backend API responses

// ── User Lists ─────────────────────────────────────────────────────────────────

export type ListType = 'top_10' | 'custom'
export type ListVisibility = 'public' | 'private'

export interface UserListBook {
  id: number
  title: string
  cover_image_url?: string
  author_name?: string
  google_books_id?: string
}

export interface UserListItem {
  id: number
  position: number
  book: UserListBook
}

export interface UserList {
  id: number
  user_id: number
  list_type: ListType
  name: string
  description?: string
  visibility: ListVisibility
  likes_count: number
  liked_by_current_user?: boolean
  items?: UserListItem[]
  items_count?: number
  created_at: string
  updated_at: string
}

export interface ReorderItem {
  id: number
  position: number
}

export interface User {
  id: number
  email?: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  zipcode?: string
  created_at?: string
  onboarding_completed?: boolean
  reading_streak?: number
  favourite_authors?: { id: number; name: string }[]
  preferences?: {
    milestones_viewed?: string[]
    reading_goal?: number
  }
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export interface Friendship {
  id: number
  status: FriendshipStatus
  requester_id: number
  requestee_id: number
  created_at: string
}

export interface FriendRequest {
  id: number
  created_at: string
  requester: {
    id: number
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface BookSuggestion {
  id: number
  status: 'pending' | 'viewed' | 'dismissed'
  message?: string
  created_at: string
  suggester: {
    id: number
    username: string
    display_name?: string
    avatar_url?: string
  }
  book: {
    id: number
    title: string
    author_name?: string
    cover_image_url?: string
    google_books_id?: string
  }
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
  id: number | null  // null when the book exists only in Google Books (not yet saved to our DB)
  title: string
  isbn?: string
  description?: string
  cover_image_url?: string
  release_date: string
  author?: Author
  author_name?: string
  followers_count?: number
  page_count?: number
  categories?: string[]
  google_books_id?: string // Google Books API ID (stable canonical identifier)
}

export interface RecommendedBook {
  id: number
  book: Book
  reason: string
  score?: number
  source?: string
}

export interface PeerRecommendation {
  id: number
  book: Book
  reason: string
  score: number
  source: 'peer_v1'
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
  event_type: 'book_release' | 'author_announcement' | 'signing' | 'reading' | 'storytime' | 'interview' | 'tour' | 'virtual_event'
  audience_type?: 'kids' | 'young_adult' | 'adult'
  starts_at: string
  ends_at?: string
  location?: string // Physical location or null for virtual events
  is_virtual: boolean // True for online/virtual events
  image_url?: string
  venue_id?: number
  venue?: Venue
  venue_name?: string // Venue name (legacy or fallback)
  external_url?: string // Link to Eventbrite, Ticketmaster, Zoom, etc.
  external_source?: 'eventbrite' | 'ticketmaster' | 'manual' | 'other' | 'venue_site' // Where event was fetched from
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

export type FeedActivityType =
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
  | 'user_followed_user'
  | 'friend_request'
  | 'friend_accepted'
  | 'book_suggestion'

/** Legacy feed item shape (from feed_items table directly) */
export interface FeedItem {
  id: number | string
  activity_type: FeedActivityType
  metadata?: Record<string, any>
  feedable?: Book | Author | User | UserBook
  user?: User
  created_at: string
}

/** Unified entry returned by the new /feed endpoint */
export interface FeedEntry {
  id: string                  // prefixed: "fi_123" or "no_456"
  kind: 'activity' | 'notification'
  activity_type: FeedActivityType
  new: boolean                // true if created after last_feed_viewed_at
  metadata: Record<string, any>
  feedable?: Record<string, any> | null
  created_at: string
}

export interface Notification {
  id: number
  notification_type: 'new_follower' | 'book_release' | 'event_reminder' | 'author_announcement' | 'friend_request' | 'friend_accepted' | 'book_suggestion'
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
  zipcode?: string
  milestones_viewed?: string[]
  reading_goal?: number
}

export interface OnboardingResponse {
  message: string
  preferences: UserPreference
}

export interface BookNote {
  id: number
  content: string
  page_number?: number
  created_at: string
  updated_at: string
  user_book_id?: number
  book?: {
    id: number | null
    title: string
    author_name?: string
    cover_image_url?: string
    google_books_id?: string
  }
}

// User Book Types - For tracking reading progress and shelves
export type ShelfStatus = 'to_read' | 'reading' | 'read' | 'dnf'
export type BookShelf = ShelfStatus // Backward compat alias for existing imports
export type Visibility = 'public' | 'private'

export interface UserBook {
  id: number
  book_id: number
  book?: Book
  // API stores the current status (with DNF) while we keep `shelf` for legacy clients
  status: ShelfStatus
  shelf?: ShelfStatus
  pages_read?: number
  total_pages?: number
  completion_percentage?: number
  rating?: number // 0.25–5 stars in quarter increments
  review?: string  // public review
  notes?: string   // private personal notes, never shown to other users
  visibility?: Visibility // Private books should stay out of followers' feeds/profiles
  dnf_reason?: string // Record why the reader stopped so we can explain the DNF entry
  dnf_page?: number // Capture the last page read when a book was DNF'd
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
export interface Venue {
  id: number
  name: string
  venue_type: 'bookstore' | 'library' | 'university' | 'theater' | string
  address?: string
  city: string
  state: string
  zipcode: string
  latitude?: number
  longitude?: number
  website_url?: string
  source?: string
  external_id?: string
  last_fetched_at?: string
}

export interface EventSearchParams {
  page?: number
  per_page?: number
  author_id?: number
  upcoming?: boolean // Filter for future events only
  event_type?: string
  audience_type?: 'kids' | 'young_adult' | 'adult'
  is_virtual?: boolean
  start_date?: string // Filter events after this date
  end_date?: string // Filter events before this date
  zipcode?: string // Filter by distance from this zipcode
  city?: string // Filter by city
  state?: string // Filter by state
  radius?: number // Distance in miles
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

// Forum Types
export interface Forum {
  id: number
  slug: string
  title: string
  description?: string
  visibility: 'public_access' | 'private_access'
  followers_count: number
  posts_count: number
  is_following?: boolean
  created_at: string
  updated_at: string
}

export interface ForumPost {
  id: number
  forum_id: number
  forum?: Forum
  user_id: number
  user: User
  body: string
  reply_count: number
  heart_count: number
  is_hearted?: boolean
  created_at: string
  updated_at: string
}

export interface ForumComment {
  id: number
  forum_post_id: number
  parent_id?: number // For thread replies
  user_id: number
  user: User
  body: string
  heart_count: number
  reply_count: number
  is_hearted?: boolean
  created_at: string
  updated_at: string
}

// Reading Buddy Types
export type ReadingBuddyStatus = 'pending' | 'active' | 'declined' | 'dnf'

export interface ReadingBuddyProgress {
  status: string
  pages_read: number | null
  total_pages: number | null
  completion_percentage: number | null
  rating?: number | null
}

export interface ReadingBuddyParticipant {
  id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  user_book_id: number | null
  progress: ReadingBuddyProgress | null
}

export interface ReadingBuddySession {
  id: number
  status: ReadingBuddyStatus
  started_at: string | null
  created_at: string
  updated_at: string
  is_initiator: boolean
  invite_message?: string | null
  book: {
    id: number
    title: string
    author_name: string | null
    cover_image_url: string | null
    google_books_id: string | null
  }
  initiator: ReadingBuddyParticipant
  invited: ReadingBuddyParticipant
}

export interface ReadingBuddyMessageReaction {
  emoji: string
  user_ids: number[]
}

export interface ReadingBuddyMessage {
  id: number
  content: string
  user_id: number
  created_at: string
  reactions: ReadingBuddyMessageReaction[]
  user: {
    id: number
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface ReadingBuddyHighlight {
  id: number
  page_number: number
  char_start: number
  char_end: number
  spoiler_lock: boolean
  locked: boolean
  // Content fields are absent when locked: true
  extracted_text?: string
  highlighted_text?: string
  note?: string | null
  moods?: string[]
  page_image_url?: string | null
  created_at: string
  user: {
    id: number
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateHighlightPayload {
  page_number: number
  extracted_text: string
  highlighted_text: string
  char_start: number
  char_end: number
  note?: string
  moods?: string[]
  spoiler_lock?: boolean
  page_image?: Blob | null  // optional photo of the physical page
}

// ── Upcoming Releases ────────────────────────────────────────────────────────

export interface UpcomingRelease {
  id:              number
  isbn13:          string
  title:           string
  authors:         string[]
  publisher:       string | null
  date_published:  string          // ISO date string e.g. "2026-07-14"
  binding:         string | null   // "Hardcover" | "Paperback" | etc.
  synopsis:        string | null
  cover_image_url: string | null
  subjects:        string[]
  genres:          string[]
  msrp:            number | null
  pages:           number | null   // page count from ISBNdb
  days_until:      number | null   // days from today until release
  reminder_id:     number | null
}

export interface UpcomingReleasesMeta {
  total:       number
  page:        number
  per:         number
  total_pages: number
  genre:       string | null
}

export interface UpcomingReleasesResponse {
  coming_soon: UpcomingRelease[]
  meta:        UpcomingReleasesMeta
}

// ── Circle trending ──────────────────────────────────────────────────────────

export interface CircleTrendingBook {
  book: {
    id:              number
    title:           string
    author_name:     string | null
    cover_image_url: string | null
    google_books_id: string | null
  }
  total_count:    number
  to_read_count:  number
  reading_count:  number
  finished_count: number
  avg_rating:     number | null
  score:          number
  activity_label: string
}

export interface CircleTrendingResponse {
  books:        CircleTrendingBook[]
  days:         number
  friend_count: number
}

export interface CircleGenreRead {
  status:     'to_read' | 'reading' | 'read'
  updated_at: string
  user: {
    id:           number
    username:     string
    display_name: string | null
    avatar_url:   string | null
  }
  book: {
    id:              number | null
    title:           string
    author_name:     string | null
    cover_image_url: string | null
    google_books_id: string | null
  }
}

export interface CircleGenreReadsResponse {
  reads: CircleGenreRead[]
  days:  number
}

// ── Series ─────────────────────────────────────────────────────────────────────

export interface SeriesBook {
  position: number
  title: string
  google_books_id: string
  cover_image_url?: string
  isbn?: string
}

export interface SeriesData {
  id: number
  name: string
  books: SeriesBook[]
}

// ActionCable message payloads
export type ReadingBuddyCableEvent =
  | { type: 'new_message';     message: ReadingBuddyMessage }
  | { type: 'progress_update'; user_id: number; progress: ReadingBuddyProgress }
  | { type: 'new_highlight';   highlight: ReadingBuddyHighlight }
  | { type: 'reaction_update'; message_id: number; reactions: ReadingBuddyMessageReaction[] }

