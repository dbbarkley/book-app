// Event Service - API calls for events
// Uses shared API client

import { apiClient } from '@book-app/shared'
import type { Event } from '@book-app/shared'

export interface GetEventsParams {
  upcoming?: boolean
  author_id?: number
  starts_after?: string
}

export const eventService = {
  /**
   * Get all events with optional filters
   */
  async getEvents(params?: GetEventsParams): Promise<Event[]> {
    return apiClient.getEvents(params)
  },

  /**
   * Get a single event by ID
   */
  async getEvent(id: number): Promise<Event> {
    return apiClient.getEvent(id)
  },
}

