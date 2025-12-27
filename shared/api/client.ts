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
  ShelfStatus,
  Visibility,
  RecommendedBook,
  RecommendedAuthor,
  RecommendedEventGroup,
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

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Token expired or invalid - clear it
          this.setToken(null)
          // In React Native, you might want to trigger a logout action here
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'))
          }
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token: string | null) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  // Auth endpoints
  async register(email: string, username: string, password: string) {
    const response = await this.client.post<{ user: User; token: string }>('/auth/register', {
      user: { email, username },
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
    const response = await this.client.post<{ token: string }>('/auth/refresh')
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get<{ user: User }>('/auth/me')
    return response.data.user
  }

  async forgotPassword(email: string) {
    // TODO: Implement backend endpoint for password reset
    // Expected endpoint: POST /api/v1/auth/forgot-password
    // Expected body: { email: string }
    // Expected response: { message: string }
    const response = await this.client.post<{ message: string }>('/auth/forgot-password', {
      email,
    })
    return response.data
  }

  // Feed endpoints
  async getFeed(page: number = 1, perPage: number = 50, activityType?: string) {
    const params: Record<string, string> = {
      page: page.toString(),
      per_page: perPage.toString(),
    }
    if (activityType) {
      params.activity_type = activityType
    }
    const response = await this.client.get<{
      feed_items: FeedItem[]
      pagination: PaginationMeta
    }>('/feed', { params })
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
    bookId: number,
    status: ShelfStatus,
    bookData?: Book,
    options?: { visibility?: Visibility; dnf_reason?: string; dnf_page?: number }
  ) {
    // TODO: Backend must persist status/visibility/dnf metadata for each user book.
    // For Google Books results (negative IDs), include full book data
    const payload: any = {
      book_id: bookId,
      status,
      shelf: status, // Keep legacy param until backend drops it
    }
    if (options?.visibility) {
      payload.visibility = options.visibility
    }
    if (options?.dnf_reason) {
      payload.dnf_reason = options.dnf_reason
    }
    if (options?.dnf_page !== undefined) {
      payload.dnf_page = options.dnf_page
    }
    
    // If it's a Google Books result, include the book data
    if (bookId < 0 && bookData) {
      payload.title = bookData.title
      payload.author_name = bookData.author_name
      payload.isbn = bookData.isbn
      payload.description = bookData.description
      payload.cover_image_url = bookData.cover_image_url
      payload.release_date = bookData.release_date
      payload.google_books_id = bookData.google_books_id
      payload.page_count = bookData.page_count
    }
    
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

  async getRecommendedEvents() {
    const response = await this.client.get<{ recommended_events?: RecommendedEventGroup[] }>('/recommendations/events')
    return response.data.recommended_events ?? []
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

  async updateUser(userId: number, updates: { display_name?: string; bio?: string; avatar_url?: string; zipcode?: string }) {
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

  // Onboarding endpoints
  async savePreferences(preferences: {
    genres?: string[]
    author_ids?: number[]
    onboarding_completed?: boolean
    zipcode?: string
  }) {
    const response = await this.client.post<{
      message: string
      preferences: {
        genres?: string[]
        author_ids?: number[]
        onboarding_completed?: boolean
        zipcode?: string
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

  // Import data endpoints
  // 
  // Why CSV import instead of direct login:
  // - Goodreads/StoryGraph do not provide public APIs for user libraries
  // - OAuth is deprecated and no longer available
  // - Scraping with user credentials violates Terms of Service
  // - CSV export is the only officially supported way to access user data
  //
  // This approach respects platform ToS while providing a smooth UX
  
  async uploadGoodreadsCsv(file: File) {
    const formData = new FormData()
    formData.append('file', file)
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
}

// Export singleton instance
export const apiClient = new ApiClient()
