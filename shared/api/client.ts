// API Client for backend communication
// Reusable in Next.js and React Native
// Uses Axios for better error handling and request/response interceptors

import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  User,
  Author,
  Book,
  Event,
  Follow,
  FeedItem,
  Notification,
  PaginationMeta,
  UserBook,
  BookNote,
  ShelfStatus,
  Visibility,
  RecommendedBook,
  RecommendedAuthor,
  RecommendedEventGroup,
  Forum,
  ForumPost,
  ForumComment,
  UpcomingReleasesResponse,
} from '../types'

// Get API base URL from environment
// In React Native, use process.env.API_URL or a config file
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env.API_URL) ||
  'http://localhost:3000/api/v1'

export class ApiClient {
  private client: AxiosInstance
  private token: string | null = null
  private _refreshToken: string | null = null

  // Silent-refresh state — prevents multiple simultaneous refresh calls
  private isRefreshing = false
  private refreshQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
  }> = []

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      withCredentials: true,
    })

    // Attach access token to every request
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Silent refresh on 401 — retry the original request with a new access token.
    // Requests that arrive while a refresh is already in flight are queued and
    // replayed once the new token lands, so only one refresh call ever runs.
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any
        const is401 = error.response?.status === 401
        const isRetry = originalRequest?._retry === true
        const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh')

        // Attempt a silent token rotation when we get a 401.
        // On web, the httpOnly refresh_token cookie is sent automatically via
        // withCredentials. On mobile, the Authorization header carries the token.
        const canRefresh = this._refreshToken != null || typeof document !== 'undefined'
        if (is401 && !isRetry && !isRefreshEndpoint && canRefresh) {
          if (this.isRefreshing) {
            // Another refresh is already running — queue this request
            return new Promise<string>((resolve, reject) => {
              this.refreshQueue.push({ resolve, reject })
            }).then((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client(originalRequest)
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const { data } = await axios.post(
              `${baseUrl}/auth/refresh`,
              {},
              {
                withCredentials: true, // sends httpOnly cookie on web
                headers: this._refreshToken
                  ? { Authorization: `Bearer ${this._refreshToken}` }
                  : undefined,
              }
            )
            const newAccess  = data.access_token ?? data.token
            const newRefresh = data.refresh_token ?? this._refreshToken

            // Update tokens in this client instance
            this.token         = newAccess
            this._refreshToken = newRefresh

            // Propagate the new tokens to the auth store so SecureStore /
            // localStorage stay in sync and the user object is refreshed.
            this.notifyTokenRotation(newAccess, newRefresh)

            // Drain the queue
            this.refreshQueue.forEach(({ resolve }) => resolve(newAccess))
            this.refreshQueue = []

            originalRequest.headers.Authorization = `Bearer ${newAccess}`
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh token is also expired — force logout
            this.refreshQueue.forEach(({ reject }) => reject(refreshError))
            this.refreshQueue = []
            this.handleUnauthorized()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // No refresh token, already retried, or non-401 — give up
        if (is401 && !isRefreshEndpoint) {
          this.handleUnauthorized()
        }

        return Promise.reject(error)
      }
    )
  }

  // Called after a successful token rotation so the store and storage adapters
  // can update themselves without the client needing to import the store directly.
  private onTokenRotation?: (access: string, refresh: string) => void

  setOnTokenRotation(cb: (access: string, refresh: string) => void) {
    this.onTokenRotation = cb
  }

  private notifyTokenRotation(access: string, refresh: string) {
    if (this.onTokenRotation) {
      this.onTokenRotation(access, refresh)
    }
  }

  private handleUnauthorized() {
    this.token         = null
    this._refreshToken = null
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('auth:unauthorized'))
    } else {
      // React Native path
      const { useAuthStore } = require('../store/authStore')
      const store = useAuthStore.getState()
      if (store.token) store.logout()
    }
  }

  setToken(token: string | null) {
    this.token = token
  }

  setRefreshToken(token: string | null) {
    this._refreshToken = token
  }

  setTokens(access: string | null, refresh: string | null) {
    this.token         = access
    this._refreshToken = refresh
  }

  getToken(): string | null {
    return this.token
  }

  // Auth endpoints
  async register(email: string, username: string, password: string, displayName?: string) {
    const response = await this.client.post<{ user: User; token: string }>('/auth/register', {
      user: { email, username, display_name: displayName },
      password,
    })
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    })
    return response.data
  }

  async logout() {
    await this.client.post('/auth/logout')
    this.setToken(null)
  }

  async refreshToken() {
    // Use plain axios (not this.client) so the request interceptor doesn't
    // inject the access token over the refresh token Authorization header.
    const baseUrl = this.client.defaults.baseURL ?? ''
    const response = await axios.post<{
      token: string
      access_token: string
      refresh_token: string
    }>(`${baseUrl}/auth/refresh`, {}, {
      withCredentials: true,
      headers: this._refreshToken
        ? { Authorization: `Bearer ${this._refreshToken}` }
        : undefined,
    })
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get<{ user: User }>('/auth/me')
    return response.data.user
  }

  async forgotPassword(email: string) {
    const response = await this.client.post<{ message: string }>('/auth/forgot-password', { email })
    return response.data
  }

  async resetPassword(token: string, password: string) {
    const response = await this.client.post<{ token: string; access_token: string; refresh_token: string; user: User }>(
      '/auth/reset-password',
      { token, password }
    )
    return response.data
  }

  // Feed endpoints
  async getFeed(page: number = 1, perPage: number = 30) {
    const response = await this.client.get<{
      entries: import('../types').FeedEntry[]
      pagination: PaginationMeta
    }>('/feed', { params: { page, per_page: perPage } })
    return response.data
  }

  async markFeedViewed() {
    await this.client.post('/feed/mark_viewed')
  }

  async getFeedUnreadCount() {
    const response = await this.client.get<{ count: number }>('/feed/unread_count')
    return response.data.count
  }

  // Friendship endpoints
  // If userId is provided, fetches that user's friends list; otherwise fetches current user's friends
  async getFriends(userId?: number) {
    if (userId) {
      const response = await this.client.get<User[]>(`/users/${userId}/friends`)
      return response.data
    }
    const response = await this.client.get<{ friends: User[] }>('/friendships')
    return response.data.friends
  }

  async getPendingFriendRequests() {
    const response = await this.client.get<{ requests: import('../types').FriendRequest[] }>('/friendships/pending')
    return response.data.requests
  }

  async sendFriendRequest(userId: number) {
    const response = await this.client.post<{ friendship: import('../types').Friendship }>('/friendships', { user_id: userId })
    return response.data.friendship
  }

  async acceptFriendRequest(friendshipId: number) {
    const response = await this.client.patch<{ friendship: import('../types').Friendship }>(`/friendships/${friendshipId}`)
    return response.data.friendship
  }

  async declineFriendRequest(friendshipId: number) {
    await this.client.delete(`/friendships/${friendshipId}`)
  }

  async removeFriend(friendshipId: number) {
    await this.client.delete(`/friendships/${friendshipId}`)
  }

  async ensureBook(book: {
    title: string
    author_name?: string
    google_books_id?: string
    isbn?: string
    cover_image_url?: string
    description?: string
    page_count?: number
    release_date?: string
    categories?: string[]
  }): Promise<{ id: number; title: string }> {
    const response = await this.client.post<{ id: number; title: string }>(
      '/books/ensure',
      {
        title:           book.title,
        author_name:     book.author_name,
        google_books_id: book.google_books_id,
        isbn:            book.isbn,
        cover_image_url: book.cover_image_url,
        description:     book.description,
        page_count:      book.page_count,
        release_date:    book.release_date,
        categories:      book.categories,
      }
    )
    return response.data
  }

  // Book Suggestion endpoints
  async suggestBook(bookId: number, recipientIds: number[], message?: string) {
    const response = await this.client.post<{ sent_count: number; skipped_count: number; message: string }>(
      '/book_suggestions',
      { book_id: bookId, recipient_ids: recipientIds, message }
    )
    return response.data
  }

  async getReceivedSuggestions() {
    const response = await this.client.get<{ suggestions: import('../types').BookSuggestion[] }>('/book_suggestions/received')
    return response.data.suggestions
  }

  async dismissSuggestion(suggestionId: number) {
    await this.client.patch(`/book_suggestions/${suggestionId}/dismiss`)
  }

  async getFriendshipStatus(userId: number) {
    const response = await this.client.get<{ status: import('../types').FriendshipStatus; friendship_id: number | null }>(
      `/friendships/status/${userId}`
    )
    return response.data
  }

  // Follow endpoints
  async follow(followableType: 'User' | 'Author' | 'Book', followableId: number) {
    const response = await this.client.post<{ follow: Follow }>('/follows', {
      followable_type: followableType,
      followable_id: followableId,
    })
    return response.data.follow
  }

  async unfollow(followId: number) {
    await this.client.delete(`/follows/${followId}`)
  }

  async followAuthor(authorId: number) {
    return this.follow('Author', authorId)
  }

  async unfollowAuthor(followId: number) {
    return this.unfollow(followId)
  }

  async getFollows() {
    const response = await this.client.get<{ follows: Follow[] }>('/follows')
    return response.data.follows
  }

  // Author endpoints
  async getAuthorsByIds(ids: number[]) {
    if (!ids.length) return { authors: [] as Author[] }
    const response = await this.client.get<{ authors: Author[] }>(
      '/authors',
      { params: { ids } }
    )
    return response.data
  }

  async getAuthors(params?: { query?: string; page?: number; per_page?: number }) {
    const response = await this.client.get<{ authors: Author[]; pagination?: PaginationMeta }>(
      '/authors',
      { params }
    )
    return response.data
  }

  async searchAuthors(query: string, page: number = 1, perPage: number = 20) {
    const response = await this.client.get<{ authors: Author[]; pagination?: PaginationMeta }>(
      '/authors',
      {
        params: {
          query,
          page,
          per_page: perPage,
        },
      }
    )
    return {
      authors: response.data.authors || [],
      pagination: response.data.pagination,
    }
  }

  async getAuthor(id: number) {
    const response = await this.client.get<{ author: Author }>(`/authors/${id}`)
    return response.data.author
  }

  async getAuthorBooks(id: number) {
    const response = await this.client.get<{ books: Book[] }>(`/authors/${id}/books`)
    return response.data.books
  }

  async getAuthorEvents(id: number) {
    const response = await this.client.get<{ events: Event[] }>(`/authors/${id}/events`)
    return response.data.events
  }

  async createAuthor(authorData: {
    name: string
    bio?: string
    avatar_url?: string
    website_url?: string
  }) {
    const response = await this.client.post<{ author: Author }>('/authors', {
      author: authorData,
    })
    return response.data.author
  }

  // Book endpoints
  async getBooks(params?: {
    query?: string
    upcoming?: boolean
    author_id?: number
    release_date?: string
    page?: number
    per_page?: number
  }) {
    const response = await this.client.get<{ books: Book[]; pagination?: PaginationMeta }>('/books', { params })
    return {
      books: response.data.books || [],
      pagination: response.data.pagination,
    }
  }

  async searchExternal(query: string, maxResults: number = 20, type: string = 'books'): Promise<{ items: any[]; _source: string }> {
    const response = await this.client.get<{ items: any[]; _source: string }>('/books/search', {
      params: { q: query, maxResults, type },
    })
    return { items: response.data.items || [], _source: response.data._source || '' }
  }

  async searchBooks(query: string, page: number = 1, perPage: number = 20) {
    const response = await this.client.get<{ books: Book[]; pagination?: PaginationMeta }>('/books', {
      params: {
        query,
        page,
        per_page: perPage,
      },
    })
    return {
      books: response.data.books || [],
      pagination: response.data.pagination,
    }
  }

  async getBook(id: number) {
    const response = await this.client.get<{ book: Book }>(`/books/${id}`)
    return response.data.book
  }

  /**
   * Fetch other books by the same author, excluding the current title.
   * Results are cached server-side for 24h, so subsequent calls for the
   * same author are fast.
   */
  async getAuthorWorks(author: string, excludeTitle: string): Promise<Book[]> {
    const response = await this.client.get<{ works: Array<{
      key: string
      title: string
      year: number | null
      cover_url: string | null
    }>}>('/books/author_works', {
      params: { author, exclude: excludeTitle },
    })
    return (response.data.works || []).map((w) => ({
      id:              -1,
      title:           w.title,
      author_name:     author,
      cover_image_url: w.cover_url ?? undefined,
      release_date:    w.year ? `${w.year}-01-01` : undefined,
      google_books_id: w.key,
    } as Book))
  }

  /**
   * Fetch a book by its Google Books ID.
   * Checks our DB first; falls back to live Google Books API.
   * Returns id: null when the book isn't in our DB yet.
   */
  async getBookByGoogleId(googleBooksId: string) {
    const response = await this.client.get<{ book: Book }>(
      `/books/by_google/${encodeURIComponent(googleBooksId)}`
    )
    return response.data.book
  }

  /**
   * Fetch a book by ISBN-13 or ISBN-10.
   * Checks our DB first, then UpcomingReleases, then falls back to a
   * Google Books isbn: search query.
   * Returns id: null when the book isn't in our DB yet (browse-only mode).
   */
  async getBookByIsbn(isbn: string) {
    const response = await this.client.get<{ book: Book }>(
      `/books/by_isbn/${encodeURIComponent(isbn)}`
    )
    return response.data.book
  }

  async getBookFriends(id: number) {
    const response = await this.client.get<{ 
      friends: Array<{ 
        id: number; 
        username: string; 
        display_name?: string; 
        avatar_url?: string;
        status: ShelfStatus;
      }> 
    }>(`/books/${id}/friends`)
    return response.data.friends
  }

  // User Book endpoints (for shelves and reading progress)
  // These endpoints need to be implemented in the Rails backend
  async getUserBook(bookId: number) {
    const response = await this.client.get<{ user_book: UserBook }>(`/user/books/by_book/${bookId}`)
    return response.data.user_book
  }

  async addBookToShelf(
    bookId: number | null,
    status: ShelfStatus,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number; total_pages?: number }
  ) {
    const payload: any = {
      status,
      shelf: status, // keep legacy param in sync
    }

    if (options?.visibility) payload.visibility = options.visibility
    if (options?.dnf_reason) payload.dnf_reason = options.dnf_reason
    if (options?.dnf_page !== undefined) payload.dnf_page = options.dnf_page
    if (options?.total_pages !== undefined) payload.total_pages = options.total_pages

    if (bookId && bookId > 0) {
      // Already in our DB — just reference the internal ID
      payload.book_id = bookId
    } else if (bookData?.google_books_id) {
      // Not in DB yet (or unknown) — send google_books_id + full metadata so
      // the backend can find_or_create the book record
      payload.google_books_id = bookData.google_books_id
      payload.title = bookData.title
      payload.author_name = bookData.author_name
      payload.isbn = bookData.isbn
      payload.description = bookData.description
      payload.cover_image_url = bookData.cover_image_url
      payload.release_date = bookData.release_date
      payload.page_count = bookData.page_count
      payload.categories = bookData.categories ?? []
    } else if (bookData?.isbn) {
      // ISBNdb upcoming release — no Google Books ID, identify by ISBN.
      // Backend will find_or_create the book record using the ISBN.
      payload.isbn = bookData.isbn
      payload.title = bookData.title
      payload.author_name = bookData.author_name
      payload.description = bookData.description
      payload.cover_image_url = bookData.cover_image_url
      payload.release_date = bookData.release_date
      payload.page_count = bookData.page_count
      payload.categories = bookData.categories ?? []
    } else if (bookId && bookId < 0 && bookData) {
      // Legacy path: negative ID from old search-result caching
      payload.book_id = bookId
      payload.google_books_id = bookData.google_books_id
      payload.title = bookData.title
      payload.author_name = bookData.author_name
      payload.isbn = bookData.isbn
      payload.description = bookData.description
      payload.cover_image_url = bookData.cover_image_url
      payload.release_date = bookData.release_date
      payload.page_count = bookData.page_count
      payload.categories = bookData.categories ?? []
    }

    console.log('[addBookToShelf] bookId:', bookId, 'isbn:', bookData?.isbn, 'google_books_id:', bookData?.google_books_id, 'payload keys:', Object.keys(payload))
    const response = await this.client.post<{ user_book: UserBook }>('/user/books', payload)
    return response.data.user_book
  }

  async updateBookProgress(
    userBookId: number,
    updates: {
      status?: ShelfStatus
      visibility?: Visibility
      dnf_reason?: string
      dnf_page?: number
      pages_read?: number
      total_pages?: number
      completion_percentage?: number
      rating?: number
      review?: string
    }
  ) {
    const response = await this.client.patch<{ user_book: UserBook }>(`/user/books/${userBookId}`, {
      user_book: updates,
    })
    return response.data.user_book
  }

  async updateBookVisibility(userBookId: number, visibility: Visibility) {
    const response = await this.client.patch<{ user_book: UserBook }>(`/user/books/${userBookId}`, {
      user_book: { visibility },
    })
    return response.data.user_book
  }

  async getUserBooks(params?: {
    shelf?: ShelfStatus
    visibility?: Visibility
    page?: number
    per_page?: number
  }) {
    const query: Record<string, string> = {}
    if (params?.shelf) query.shelf = params.shelf
    if (params?.visibility) query.visibility = params.visibility
    if (params?.page) query.page = params.page.toString()
    if (params?.per_page) query.per_page = params.per_page.toString()

    const response = await this.client.get<{ user_books: UserBook[]; pagination?: PaginationMeta }>(
      '/user/books',
      { params: query }
    )
    return {
      user_books: response.data.user_books || [],
      pagination: response.data.pagination,
    }
  }

  async saveBookReview(userBookId: number, rating: number, review?: string) {
    const response = await this.client.post<{ user_book: UserBook }>(`/user/books/${userBookId}/review`, {
      rating,
      review,
    })
    return response.data.user_book
  }

  async saveBookNotes(userBookId: number, notes: string) {
    const response = await this.client.patch<{ user_book: UserBook }>(`/user/books/${userBookId}/notes`, {
      notes,
    })
    return response.data.user_book
  }

  async getBookNotes(userBookId: number) {
    const response = await this.client.get<{ notes: BookNote[] }>(`/user/books/${userBookId}/notes`)
    return response.data.notes
  }

  async createBookNote(userBookId: number, content: string, pageNumber?: number) {
    const response = await this.client.post<{ note: BookNote }>(`/user/books/${userBookId}/notes`, {
      note: { content, page_number: pageNumber ?? null },
    })
    return response.data.note
  }

  async updateBookNote(userBookId: number, noteId: number, content: string, pageNumber?: number) {
    const response = await this.client.patch<{ note: BookNote }>(`/user/books/${userBookId}/notes/${noteId}`, {
      note: { content, page_number: pageNumber ?? null },
    })
    return response.data.note
  }

  async deleteBookNote(userBookId: number, noteId: number) {
    await this.client.delete(`/user/books/${userBookId}/notes/${noteId}`)
  }

  async getAllUserNotes() {
    const response = await this.client.get<{ notes: BookNote[] }>('/user/notes')
    return response.data.notes
  }

  async deleteUserBook(userBookId: number): Promise<void> {
    await this.client.delete(`/user/books/${userBookId}`)
  }

  // Event endpoints
  async getEvents(params?: {
    upcoming?: boolean
    author_id?: number
    starts_after?: string
  }) {
    const response = await this.client.get<{ events: Event[] }>('/events', { params })
    return response.data.events
  }

  async getEvent(id: number) {
    const response = await this.client.get<{ event: Event }>(`/events/${id}`)
    return response.data.event
  }

  // Recommendation endpoints
  // Find My Next Book — BigBook-powered similarity
  // Called once per selected seed book (progressive loading).
  // Results are cached server-side so repeat calls for the same book are instant.
  async getSimilarBooks(bookId: number): Promise<Book[]> {
    const response = await this.client.get<{ books: Book[] }>(
      `/recommendations/similar_to/${bookId}`
    )
    return response.data.books ?? []
  }

  async getRecommendedBooks() {
    const response = await this.client.get<{
      recommended_books?: RecommendedBook[]
      books?: RecommendedBook[]
    }>('/recommendations/books')
    return response.data.recommended_books ?? response.data.books ?? []
  }

  async getRecommendedAuthors() {
    const response = await this.client.get<{
      recommended_authors?: RecommendedAuthor[]
      authors?: RecommendedAuthor[]
    }>('/recommendations/authors')
    return response.data.recommended_authors ?? response.data.authors ?? []
  }

  async regenerateRecommendations() {
    const response = await this.client.post<{ books_count: number; authors_count: number }>(
      '/recommendations/regenerate',
      {}
    )
    return response.data
  }

  async getRecommendedEvents() {
    const response = await this.client.get<{ recommended_events?: RecommendedEventGroup[] }>('/recommendations/events')
    return response.data.recommended_events ?? []
  }

  async getNewReleases() {
    const response = await this.client.get<{ new_releases: any[] }>('/recommendations/new_releases')
    return response.data.new_releases || []
  }

  async getComingSoon(params?: {
    genre?:     string
    page?:      number
    per?:       number
    date_from?: string   // ISO date, e.g. "2026-05-06"
    date_to?:   string   // ISO date, e.g. "2026-05-12"
  }) {
    const response = await this.client.get<UpcomingReleasesResponse>('/recommendations/coming_soon', {
      params: {
        ...(params?.genre     && { genre:     params.genre     }),
        ...(params?.page      && { page:      params.page      }),
        ...(params?.per       && { per:       params.per       }),
        ...(params?.date_from && { date_from: params.date_from }),
        ...(params?.date_to   && { date_to:   params.date_to   }),
      },
    })
    return response.data
  }

  async createReleaseReminder(upcomingReleaseId: number): Promise<{ id: number }> {
    const response = await this.client.post<{ id: number }>('/release_reminders', {
      upcoming_release_id: upcomingReleaseId,
    })
    return response.data
  }

  async deleteReleaseReminder(reminderId: number): Promise<void> {
    await this.client.delete(`/release_reminders/${reminderId}`)
  }

  // ── Circle ──────────────────────────────────────────────────────────────────

  async getCircleTrending(days = 30): Promise<import('../types').CircleTrendingResponse> {
    const response = await this.client.get<import('../types').CircleTrendingResponse>(
      `/circle/trending?days=${days}`
    )
    return response.data
  }

  async getCircleGenreReads(genre: string, days = 30): Promise<import('../types').CircleGenreReadsResponse> {
    const response = await this.client.get<import('../types').CircleGenreReadsResponse>(
      `/circle/genre_reads?genre=${encodeURIComponent(genre)}&days=${days}`
    )
    return response.data
  }

  async getCuratedShelfBooks(bisacCode: string): Promise<{ books: Book[]; populated: boolean; stale: boolean }> {
    const response = await this.client.get<{
      books: Array<{
        google_books_id: string
        title: string
        author_name: string | null
        cover_image_url: string | null
        description?: string
        published_date?: string
        page_count?: number
        average_rating?: number
        ratings_count?: number
        rank: number
      }>
      populated: boolean
      stale: boolean
    }>(`/bisac_categories/${encodeURIComponent(bisacCode)}/books`)

    const books: Book[] = (response.data.books || []).map(b => ({
      id: null,
      title: b.title,
      google_books_id: b.google_books_id,
      cover_image_url: b.cover_image_url ?? undefined,
      author_name: b.author_name ?? undefined,
      description: b.description,
      release_date: b.published_date ?? '',
      page_count: b.page_count,
    }))

    return { books, populated: response.data.populated, stale: response.data.stale }
  }

  async getGenreBooks(genreId: string): Promise<{ books: Book[]; source: string | null }> {
    const response = await this.client.get<{ books: Book[]; _source: string | null }>(
      `/books/genre?id=${encodeURIComponent(genreId)}`
    )
    return { books: response.data.books || [], source: response.data._source ?? null }
  }

  // Notification endpoints
  async getNotifications() {
    const response = await this.client.get<{ notifications: Notification[] }>('/notifications')
    return response.data.notifications
  }

  async getUnreadNotifications() {
    const response = await this.client.get<{ notifications: Notification[] }>(
      '/notifications/unread'
    )
    return response.data.notifications
  }

  async markNotificationAsRead(id: number) {
    await this.client.patch(`/notifications/${id}/read`)
  }

  async markAllNotificationsAsRead() {
    await this.client.patch('/notifications/read_all')
  }

  // User endpoints
  async getUser(userId: number) {
    const response = await this.client.get<{ user: User }>(`/users/${userId}`)
    return response.data.user
  }

  async getUserProfile(userId: number) {
    const response = await this.client.get<{
      user: User
      stats: {
        followers_count: number
        following_count: number
        friends_count: number
      }
      current_user_follow?: {
        following: boolean
        follow_id?: number | null
      }
      friendship?: {
        status: import('../types').FriendshipStatus
        friendship_id: number | null
      }
    }>(`/users/${userId}/profile`)
    return response.data
  }

  async getUserFollowing(userId: number) {
    // Backend returns array directly, not wrapped in object
    const response = await this.client.get<Follow[]>(`/users/${userId}/following`)
    return response.data
  }

  async getUserFollowers(userId: number) {
    // Backend returns array directly, not wrapped in object
    const response = await this.client.get<User[]>(`/users/${userId}/followers`)
    return response.data
  }

  async getUserLibrary(userId: number) {
    const response = await this.client.get<{ user_books: UserBook[] }>(`/users/${userId}/library`)
    return response.data.user_books
  }

  async getUserStats(userId: number) {
    const response = await this.client.get<{
      genres: Array<{ name: string; count: number }>
      top_authors: Array<{ name: string; count: number }>
    }>(`/users/${userId}/stats`)
    return response.data
  }

  async getGenreContributingBooks(userId: number, genre: string) {
    const response = await this.client.get<{
      genre: string
      books: Array<{
        id: number
        title: string
        author_name: string
        cover_image_url?: string
        pages_read: number
        total_pages?: number
        status: string
        finished_at?: string
        xp_contributed: number
      }>
      total_xp: number
    }>(`/users/${userId}/genre/${encodeURIComponent(genre)}/books`)
    return response.data
  }

  async updateUser(userId: number, updates: { display_name?: string; bio?: string; avatar_url?: string; zipcode?: string; avatar?: any }) {
    // Check if we have an avatar file to upload.
    // Handles both web (File/Blob) and React Native ({ uri, type, name }) formats.
    const isFileUpload =
      updates.avatar instanceof File ||
      updates.avatar instanceof Blob ||
      (updates.avatar != null && typeof updates.avatar === 'object' && 'uri' in updates.avatar)
    if (isFileUpload) {
      const formData = new FormData()
      
      // Add regular fields
      if (updates.display_name) formData.append('user[display_name]', updates.display_name)
      if (updates.bio) formData.append('user[bio]', updates.bio)
      if (updates.zipcode) formData.append('user[zipcode]', updates.zipcode)
      if (updates.avatar_url) formData.append('user[avatar_url]', updates.avatar_url)
      
      // Add file
      formData.append('user[avatar]', updates.avatar)

      const response = await this.client.patch<{ user: User }>(`/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.user
    }

    // Regular JSON update
    const response = await this.client.patch<{ user: User }>(`/users/${userId}`, {
      user: updates,
    })
    return response.data.user
  }

  async searchUsers(query: string, page: number = 1, perPage: number = 20) {
    const response = await this.client.get<{ users: User[]; pagination?: PaginationMeta }>(
      '/users/search',
      {
        params: {
          query,
          page,
          per_page: perPage,
        },
      }
    )
    return {
      users: response.data.users || [],
      pagination: response.data.pagination,
    }
  }

  // ── User Lists ──────────────────────────────────────────────────────────────

  async getUserLists(userId: number) {
    const response = await this.client.get<{ lists: import('../types').UserList[] }>(
      `/users/${userId}/lists`
    )
    return response.data.lists
  }

  async getUserList(userId: number, listId: number) {
    const response = await this.client.get<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/${listId}`
    )
    return response.data.list
  }

  /** Find or create the authenticated user's Top 10 list. */
  async getOrCreateTop10List(userId: number) {
    const response = await this.client.get<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/top_10`
    )
    return response.data.list
  }

  async createUserList(userId: number, data: {
    list_type?: import('../types').ListType
    name: string
    description?: string
    visibility?: import('../types').ListVisibility
  }) {
    const response = await this.client.post<{ list: import('../types').UserList }>(
      `/users/${userId}/lists`,
      { list: data }
    )
    return response.data.list
  }

  async updateUserList(userId: number, listId: number, data: {
    name?: string
    description?: string
    visibility?: import('../types').ListVisibility
  }) {
    const response = await this.client.patch<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/${listId}`,
      { list: data }
    )
    return response.data.list
  }

  async deleteUserList(userId: number, listId: number) {
    await this.client.delete(`/users/${userId}/lists/${listId}`)
  }

  async addBookToList(userId: number, listId: number, bookId: number, position?: number) {
    const response = await this.client.post<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/${listId}/items`,
      { book_id: bookId, position }
    )
    return response.data.list
  }

  async removeBookFromList(userId: number, listId: number, itemId: number) {
    const response = await this.client.delete<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/${listId}/items/${itemId}`
    )
    return response.data.list
  }

  async reorderList(userId: number, listId: number, items: import('../types').ReorderItem[]) {
    const response = await this.client.patch<{ list: import('../types').UserList }>(
      `/users/${userId}/lists/${listId}/reorder`,
      { items }
    )
    return response.data.list
  }

  async likeList(userId: number, listId: number) {
    const response = await this.client.post<{ liked: boolean; likes_count: number }>(
      `/users/${userId}/lists/${listId}/like`
    )
    return response.data
  }

  async unlikeList(userId: number, listId: number) {
    const response = await this.client.delete<{ liked: boolean; likes_count: number }>(
      `/users/${userId}/lists/${listId}/unlike`
    )
    return response.data
  }

  // Onboarding endpoints
  async savePreferences(preferences: {
    genres?: string[]
    author_ids?: number[]
    onboarding_completed?: boolean
    zipcode?: string
    milestones_viewed?: string[]
    reading_goal?: number
  }) {
    const response = await this.client.post<{
      message: string
      preferences: {
        genres?: string[]
        author_ids?: number[]
        onboarding_completed?: boolean
        zipcode?: string
        milestones_viewed?: string[]
        reading_goal?: number
      }
    }>('/users/preferences', {
      preferences,
    })
    return response.data
  }

  async getPreferences() {
    const response = await this.client.get<{
      preferences: {
        genres?: string[]
        author_ids?: number[]
        onboarding_completed?: boolean
        zipcode?: string
        milestones_viewed?: string[]
        reading_goal?: number
      }
    }>('/users/preferences')
    return response.data.preferences
  }

  async checkOnboardingStatus() {
    // Check if user has completed onboarding
    // Returns onboarding_completed status from preferences
    try {
      const preferences = await this.getPreferences()
      return preferences.onboarding_completed ?? false
    } catch (error) {
      // If preferences endpoint doesn't exist or user has no preferences, return false
      return false
    }
  }

  // Forum endpoints
  async getForums() {
    const response = await this.client.get<{ forums: Forum[] }>('/forums')
    return response.data.forums
  }

  async createForum(forumData: { title: string; description?: string; visibility?: string }) {
    const response = await this.client.post<{ forum: Forum }>('/forums', { forum: forumData })
    return response.data.forum
  }

  async getForum(id: number) {
    const response = await this.client.get<{ forum: Forum; posts: ForumPost[]; pagination: PaginationMeta }>(`/forums/${id}`)
    return response.data
  }

  async followForum(id: number) {
    const response = await this.client.post<{ forum: Forum }>(`/forums/${id}/follow`)
    return response.data.forum
  }

  async unfollowForum(id: number) {
    const response = await this.client.delete(`/forums/${id}/follow`)
    return response.data
  }

  async getForumPosts(forumId: number, page: number = 1) {
    const response = await this.client.get<{ posts: ForumPost[]; pagination: PaginationMeta }>(
      `/forums/${forumId}/posts`,
      { params: { page } }
    )
    return response.data
  }

  async createForumPost(forumId: number, postData: { body: string }) {
    const response = await this.client.post<ForumPost>(`/forums/${forumId}/posts`, {
      post: postData,
    })
    return response.data
  }

  async getForumPost(id: number) {
    const response = await this.client.get<{ post: ForumPost; replies: ForumComment[]; pagination: PaginationMeta }>(`/forum_posts/${id}`)
    return response.data
  }

  async getPostComments(postId: number) {
    const response = await this.client.get<{ replies: ForumComment[] }>(`/forum_posts/${postId}/replies`)
    return response.data.replies
  }

  async createPostComment(postId: number, body: string) {
    const response = await this.client.post<{ reply: ForumComment } | ForumComment>(`/forum_posts/${postId}/replies`, {
      reply: { body },
    })
    // Support both { reply: comment } and direct comment response
    return 'reply' in response.data ? response.data.reply : response.data
  }

  async updatePost(postId: number, body: string) {
    const response = await this.client.patch<ForumPost>(`/forum_posts/${postId}`, {
      post: { body },
    })
    return response.data
  }

  async deletePost(postId: number) {
    await this.client.delete(`/forum_posts/${postId}`)
  }

  async reportPost(postId: number, reason: string) {
    await this.client.post(`/forum_posts/${postId}/report`, { reason })
  }

  async updateReply(replyId: number, body: string) {
    const response = await this.client.patch<{ reply: ForumComment } | ForumComment>(`/forum_replies/${replyId}`, {
      reply: { body },
    })
    return 'reply' in response.data ? response.data.reply : response.data
  }

  async deleteReply(replyId: number) {
    await this.client.delete(`/forum_replies/${replyId}`)
  }

  async reportReply(replyId: number, reason: string) {
    await this.client.post(`/forum_replies/${replyId}/report`, { reason })
  }

  // Import data endpoints
  // 
  // Why CSV import instead of direct login:
  // - Goodreads/StoryGraph do not provide public APIs for user libraries
  // - OAuth is deprecated and no longer available
  // - Scraping with user credentials violates Terms of Service
  // - CSV export is the only officially supported way to access user data
  //
  // This approach respects platform ToS while providing a smooth UX
  
  async uploadGoodreadsCsv(file: File | { uri: string; name: string; type?: string }) {
    const formData = new FormData()
    formData.append('file', file as unknown as Blob)
    const response = await this.client.post<{
      import: {
        id: number
        source: string
        status: string
        filename: string
        total_books: number
        processed_books: number
        successful_imports: number
        failed_imports: number
        progress_percentage: number
        metadata: Record<string, any>
        error_message?: string
        started_at?: string
        completed_at?: string
        created_at: string
      }
      message: string
    }>('/imports/goodreads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getImportStatus(importId: number) {
    const response = await this.client.get<{
      import: {
        id: number
        source: string
        status: string
        filename: string
        total_books: number
        processed_books: number
        successful_imports: number
        failed_imports: number
        progress_percentage: number
        metadata: Record<string, any>
        error_message?: string
        started_at?: string
        completed_at?: string
        created_at: string
      }
    }>(`/imports/${importId}`)
    return response.data.import
  }

  async getImports() {
    const response = await this.client.get<{
      imports: Array<{
        id: number
        source: string
        status: string
        filename: string
        total_books: number
        processed_books: number
        successful_imports: number
        failed_imports: number
        progress_percentage: number
        metadata: Record<string, any>
        error_message?: string
        started_at?: string
        completed_at?: string
        created_at: string
      }>
    }>('/imports')
    return response.data.imports
  }

  // StoryGraph import - can be added later with similar pattern
  async uploadStoryGraphCsv(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', 'storygraph')
    const response = await this.client.post<{
      import: {
        id: number
        source: string
        status: string
        filename: string
        total_books: number
        processed_books: number
        successful_imports: number
        failed_imports: number
        progress_percentage: number
        metadata: Record<string, any>
        error_message?: string
        started_at?: string
        completed_at?: string
        created_at: string
      }
      message: string
    }>('/imports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  // ── Reading Buddy ──────────────────────────────────────────────────────────

  async getReadingBuddySessions() {
    const response = await this.client.get<{ sessions: import('../types').ReadingBuddySession[] }>(
      '/reading_buddy/sessions'
    )
    return response.data.sessions
  }

  async getReadingBuddySession(sessionId: number) {
    const response = await this.client.get<{
      session:    import('../types').ReadingBuddySession
      messages:   import('../types').ReadingBuddyMessage[]
      highlights: import('../types').ReadingBuddyHighlight[]
    }>(`/reading_buddy/sessions/${sessionId}`)
    return response.data
  }

  async createReadingBuddySession(bookId: number, invitedId: number) {
    const response = await this.client.post<{ session: import('../types').ReadingBuddySession }>(
      '/reading_buddy/sessions',
      { book_id: bookId, invited_id: invitedId }
    )
    return response.data.session
  }

  async updateReadingBuddySession(
    sessionId: number,
    actionType: 'accept' | 'decline' | 'dnf' | 'cancel'
  ) {
    const response = await this.client.patch<{ session: import('../types').ReadingBuddySession }>(
      `/reading_buddy/sessions/${sessionId}`,
      { action_type: actionType }
    )
    return response.data.session
  }

  async sendReadingBuddyMessage(sessionId: number, content: string) {
    const response = await this.client.post<{ message: import('../types').ReadingBuddyMessage }>(
      `/reading_buddy/sessions/${sessionId}/messages`,
      { content }
    )
    return response.data.message
  }

  async toggleMessageReaction(sessionId: number, messageId: number, emoji: string) {
    const response = await this.client.post<{ reactions: import('../types').ReadingBuddyMessageReaction[] }>(
      `/reading_buddy/sessions/${sessionId}/messages/${messageId}/reactions/toggle`,
      { emoji }
    )
    return response.data.reactions
  }

  async getReadingBuddyHighlights(sessionId: number) {
    const response = await this.client.get<{ highlights: import('../types').ReadingBuddyHighlight[] }>(
      `/reading_buddy/sessions/${sessionId}/highlights`
    )
    return response.data.highlights
  }

  async deleteReadingBuddyHighlight(sessionId: number, highlightId: number): Promise<void> {
    await this.client.delete(
      `/reading_buddy/sessions/${sessionId}/highlights/${highlightId}`
    )
  }

  async createReadingBuddyHighlight(
    sessionId: number,
    payload: import('../types').CreateHighlightPayload
  ) {
    // Use multipart form data only when a page image is provided
    if (payload.page_image) {
      const formData = new FormData()
      formData.append('page_number',      String(payload.page_number))
      formData.append('extracted_text',   payload.extracted_text)
      formData.append('highlighted_text', payload.highlighted_text)
      formData.append('char_start',       String(payload.char_start))
      formData.append('char_end',         String(payload.char_end))
      if (payload.note) formData.append('note', payload.note)
      if (payload.moods) payload.moods.forEach(m => formData.append('moods[]', m))
      if (payload.spoiler_lock) formData.append('spoiler_lock', 'true')
      formData.append('page_image',       payload.page_image, 'page.jpg')

      const response = await this.client.post<{ highlight: import('../types').ReadingBuddyHighlight }>(
        `/reading_buddy/sessions/${sessionId}/highlights`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.highlight
    }

    const response = await this.client.post<{ highlight: import('../types').ReadingBuddyHighlight }>(
      `/reading_buddy/sessions/${sessionId}/highlights`,
      {
        page_number:      payload.page_number,
        extracted_text:   payload.extracted_text,
        highlighted_text: payload.highlighted_text,
        char_start:       payload.char_start,
        char_end:         payload.char_end,
        note:             payload.note || undefined,
        moods:            payload.moods?.length ? payload.moods : undefined,
        spoiler_lock:     payload.spoiler_lock || undefined,
      }
    )
    return response.data.highlight
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
