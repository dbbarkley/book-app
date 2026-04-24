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
  Forum,
  ForumPost,
  ForumComment,
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

  async getComingSoon() {
    const response = await this.client.get<{ coming_soon: any[] }>('/recommendations/coming_soon')
    return response.data.coming_soon || []
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
    // Check if we have an avatar file to upload
    if (updates.avatar instanceof File || updates.avatar instanceof Blob) {
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
