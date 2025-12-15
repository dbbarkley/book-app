// Author Service - API calls for authors
// Uses shared API client

import { apiClient } from '@book-app/shared'
import type { Author, Book, Event } from '@book-app/shared'

export const authorService = {
  /**
   * Get all authors
   */
  async getAuthors(): Promise<Author[]> {
    return apiClient.getAuthors()
  },

  /**
   * Get a single author by ID
   */
  async getAuthor(id: number): Promise<Author> {
    return apiClient.getAuthor(id)
  },

  /**
   * Get books by author
   */
  async getAuthorBooks(id: number): Promise<Book[]> {
    return apiClient.getAuthorBooks(id)
  },

  /**
   * Get events by author
   */
  async getAuthorEvents(id: number): Promise<Event[]> {
    return apiClient.getAuthorEvents(id)
  },
}

