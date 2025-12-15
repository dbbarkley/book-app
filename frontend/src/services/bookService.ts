// Book Service - API calls for books
// Uses shared API client

import { apiClient } from '@book-app/shared'
import type { Book } from '@book-app/shared'

export interface GetBooksParams {
  upcoming?: boolean
  author_id?: number
  release_date?: string
}

export const bookService = {
  /**
   * Get all books with optional filters
   */
  async getBooks(params?: GetBooksParams): Promise<Book[]> {
    return apiClient.getBooks(params)
  },

  /**
   * Get a single book by ID
   */
  async getBook(id: number): Promise<Book> {
    return apiClient.getBook(id)
  },
}

